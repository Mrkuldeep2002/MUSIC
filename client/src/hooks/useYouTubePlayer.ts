import { useEffect, useRef, useState, useCallback } from 'react';
import { PlaybackState } from '../types/room';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: (() => void) | undefined;
  }
}

interface UseYouTubePlayerProps {
  containerId: string;
  playback: PlaybackState | null;
  isHost: boolean;
  canControlPlayback?: boolean;
  onStateChangeByHost?: (action: 'play' | 'pause' | 'seek', position: number) => void;
  onVideoEnd?: () => void;
}

export function useYouTubePlayer({
  containerId,
  playback,
  isHost,
  canControlPlayback = isHost,
  onStateChangeByHost,
  onVideoEnd,
}: UseYouTubePlayerProps) {
  const playerRef = useRef<any>(null);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [drift, setDrift] = useState<number>(0);
  const [needsUserInteraction, setNeedsUserInteraction] = useState<boolean>(false);
  const [embedError, setEmbedError] = useState<string | null>(null);

  const lastVideoIdRef = useRef<string | null>(null);
  const isSyncingFromServerRef = useRef<boolean>(false);
  const lastKnownTimeRef = useRef<number>(0);

  // Refs for callbacks and props to avoid stale closures inside YT Player API callbacks
  const canControlPlaybackRef = useRef<boolean>(canControlPlayback);
  canControlPlaybackRef.current = canControlPlayback;

  const onStateChangeByHostRef = useRef<typeof onStateChangeByHost>(onStateChangeByHost);
  onStateChangeByHostRef.current = onStateChangeByHost;

  const isHostRef = useRef<boolean>(isHost);
  isHostRef.current = isHost;

  const onVideoEndRef = useRef<typeof onVideoEnd>(onVideoEnd);
  onVideoEndRef.current = onVideoEnd;

  const playbackRef = useRef<PlaybackState | null>(playback);
  playbackRef.current = playback;

  // Load YouTube IFrame API script dynamically
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      initPlayer();
      return;
    }

    const previousOnReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (previousOnReady) previousOnReady();
      initPlayer();
    };

    if (!document.getElementById('youtube-iframe-api')) {
      const tag = document.createElement('script');
      tag.id = 'youtube-iframe-api';
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }
  }, []);

  // Clear embed error when videoId changes
  useEffect(() => {
    setEmbedError(null);
  }, [playback?.videoId]);

  const initPlayer = useCallback(() => {
    if (playerRef.current) return;

    playerRef.current = new window.YT.Player(containerId, {
      height: '100%',
      width: '100%',
      playerVars: {
        autoplay: 1,
        controls: 1,
        modestbranding: 1,
        rel: 0,
        enablejsapi: 1,
        playsinline: 1,
        origin: window.location.origin,
      },
      events: {
        onReady: () => {
          setIsReady(true);
          setEmbedError(null);
          console.log('🎬 YouTube IFrame Player Ready');
        },
        onStateChange: (event: any) => {
          const player = playerRef.current;
          const localTime = player && typeof player.getCurrentTime === 'function' ? player.getCurrentTime() || 0 : 0;

          if (event.data === window.YT.PlayerState.PLAYING) {
            setIsPlaying(true);
            setNeedsUserInteraction(false);
            setEmbedError(null);

            // Capture play click inside native YouTube controls
            if (!isSyncingFromServerRef.current) {
              if (canControlPlaybackRef.current && onStateChangeByHostRef.current) {
                console.log('▶️ Native YouTube Play clicked. Broadcasting to room...');
                onStateChangeByHostRef.current('play', localTime);
              } else if (!canControlPlaybackRef.current && playbackRef.current && !playbackRef.current.isPlaying) {
                // Unauthorized guest clicked play -> pause back
                player?.pauseVideo();
              }
            }
          } else if (event.data === window.YT.PlayerState.PAUSED) {
            setIsPlaying(false);

            // Capture pause click inside native YouTube controls
            if (!isSyncingFromServerRef.current) {
              if (canControlPlaybackRef.current && onStateChangeByHostRef.current) {
                console.log('⏸️ Native YouTube Pause clicked. Broadcasting to room...');
                onStateChangeByHostRef.current('pause', localTime);
              } else if (!canControlPlaybackRef.current && playbackRef.current && playbackRef.current.isPlaying) {
                // Unauthorized guest clicked pause -> play back
                player?.playVideo();
              }
            }
          } else if (event.data === window.YT.PlayerState.ENDED) {
            setIsPlaying(false);
            if (isHostRef.current && onVideoEndRef.current) {
              onVideoEndRef.current();
            }
          }
        },
        onError: (e: any) => {
          console.error('YouTube Player Error Code:', e.data);
          if (playbackRef.current?.videoId) {
            if (e.data === 101 || e.data === 150) {
              setEmbedError('Video embedding restricted by YouTube video owner on mobile web.');
            } else if (e.data === 100 || e.data === 2) {
              setEmbedError('Video unavailable or invalid YouTube video ID.');
            }
          }
        },
      },
    });
  }, [containerId]);

  // Synchronize player with authoritative server state
  useEffect(() => {
    if (!isReady || !playerRef.current || !playback || !playback.videoId) return;

    isSyncingFromServerRef.current = true;
    const player = playerRef.current;
    const currentVideoId = playback.videoId;

    try {
      // Load new video if videoId changed
      if (lastVideoIdRef.current !== currentVideoId) {
        lastVideoIdRef.current = currentVideoId;
        if (typeof player.loadVideoById === 'function') {
          player.loadVideoById({
            videoId: currentVideoId,
            startSeconds: calculateExpectedPosition(playback),
          });
        }
      }

      // Handle Play / Pause sync
      const expectedPos = calculateExpectedPosition(playback);
      const playerState = typeof player.getPlayerState === 'function' ? player.getPlayerState() : -1;

      if (playback.isPlaying) {
        if (playerState !== window.YT?.PlayerState?.PLAYING && playerState !== window.YT?.PlayerState?.BUFFERING) {
          const playPromise = player.playVideo();
          if (playPromise && typeof playPromise.catch === 'function') {
            playPromise.catch(() => setNeedsUserInteraction(true));
          }
        }
      } else {
        if (playerState === window.YT?.PlayerState?.PLAYING) {
          player.pauseVideo();
        }
      }

      // Check current drift
      if (typeof player.getCurrentTime === 'function') {
        const localTime = player.getCurrentTime();
        const currentDrift = localTime - expectedPos;
        setDrift(currentDrift);

        // Only seek if drift exceeds threshold (1.5s) to avoid stutters
        if (Math.abs(currentDrift) > 1.5) {
          console.log(`⏱️ Drift threshold exceeded (${currentDrift.toFixed(2)}s). Resyncing...`);
          player.seekTo(expectedPos, true);
        }
      }
    } catch (err) {
      console.warn('Sync error during player update:', err);
    } finally {
      setTimeout(() => {
        isSyncingFromServerRef.current = false;
      }, 400);
    }
  }, [isReady, playback]);

  // Periodic drift check & time ticker (every 500ms) + Native Seek Detection
  useEffect(() => {
    if (!isReady || !playerRef.current) return;

    const interval = setInterval(() => {
      try {
        const player = playerRef.current;
        if (typeof player.getCurrentTime === 'function') {
          const localTime = player.getCurrentTime() || 0;
          setCurrentTime(localTime);

          // Detect manual seek performed inside YouTube native iframe player controls
          if (
            !isSyncingFromServerRef.current &&
            canControlPlaybackRef.current &&
            onStateChangeByHostRef.current &&
            playbackRef.current &&
            playbackRef.current.isPlaying
          ) {
            const expectedPos = calculateExpectedPosition(playbackRef.current);
            const deltaPrev = Math.abs(localTime - lastKnownTimeRef.current);
            const deltaExpected = Math.abs(localTime - expectedPos);

            // If time jumped by > 2.5 seconds compared to previous check AND expected position
            if (deltaPrev > 2.5 && deltaExpected > 2.5) {
              console.log(
                `🎯 Native YouTube Seek detected to ${localTime.toFixed(1)}s. Broadcasting seek to room...`
              );
              onStateChangeByHostRef.current('seek', localTime);
            }
          }

          lastKnownTimeRef.current = localTime;
        }

        if (typeof player.getDuration === 'function') {
          const dur = player.getDuration() || 0;
          setDuration(dur);
        }
      } catch (e) {
        // Player state transient read
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isReady]);

  // User interactive triggers (Host or Authorized Guest actions)
  const play = useCallback(() => {
    if (playerRef.current && typeof playerRef.current.playVideo === 'function') {
      playerRef.current.playVideo();
      setNeedsUserInteraction(false);
      if (canControlPlayback && onStateChangeByHost) {
        const time = playerRef.current.getCurrentTime() || 0;
        onStateChangeByHost('play', time);
      }
    }
  }, [canControlPlayback, onStateChangeByHost]);

  const pause = useCallback(() => {
    if (playerRef.current && typeof playerRef.current.pauseVideo === 'function') {
      playerRef.current.pauseVideo();
      if (canControlPlayback && onStateChangeByHost) {
        const time = playerRef.current.getCurrentTime() || 0;
        onStateChangeByHost('pause', time);
      }
    }
  }, [canControlPlayback, onStateChangeByHost]);

  const seek = useCallback(
    (seconds: number) => {
      if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
        playerRef.current.seekTo(seconds, true);
        if (canControlPlayback && onStateChangeByHost) {
          onStateChangeByHost('seek', seconds);
        }
      }
    },
    [canControlPlayback, onStateChangeByHost]
  );

  const enableAudioAndSync = useCallback(() => {
    if (playerRef.current && typeof playerRef.current.playVideo === 'function') {
      playerRef.current.playVideo();
      setNeedsUserInteraction(false);
    }
  }, []);

  return {
    isReady,
    isPlaying,
    currentTime,
    duration,
    drift,
    needsUserInteraction,
    embedError,
    play,
    pause,
    seek,
    enableAudioAndSync,
  };
}

function calculateExpectedPosition(playback: PlaybackState): number {
  if (!playback) return 0;
  if (!playback.isPlaying) return playback.position;

  const now = Date.now();
  const elapsed = (now - playback.updatedAt) / 1000;
  return Math.max(0, playback.position + elapsed);
}
