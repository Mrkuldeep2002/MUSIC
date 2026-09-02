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
          if (event.data === window.YT.PlayerState.PLAYING) {
            setIsPlaying(true);
            setNeedsUserInteraction(false);
            setEmbedError(null);
          } else if (event.data === window.YT.PlayerState.PAUSED) {
            setIsPlaying(false);
          } else if (event.data === window.YT.PlayerState.ENDED) {
            setIsPlaying(false);
            if (isHost && onVideoEnd) {
              onVideoEnd();
            }
          }
        },
        onError: (e: any) => {
          console.error('YouTube Player Error Code:', e.data);
          // Only flag error if there is an active video selected
          if (playback?.videoId) {
            if (e.data === 101 || e.data === 150) {
              setEmbedError('Video embedding restricted by YouTube video owner on mobile web.');
            } else if (e.data === 100 || e.data === 2) {
              setEmbedError('Video unavailable or invalid YouTube video ID.');
            }
          }
        },
      },
    });
  }, [containerId, isHost, onVideoEnd, playback?.videoId]);

  // Synchronize player with authoritative server state
  useEffect(() => {
    if (!isReady || !playerRef.current || !playback || !playback.videoId) return;

    const player = playerRef.current;
    const currentVideoId = playback.videoId;

    // Load new video if videoId changed
    if (lastVideoIdRef.current !== currentVideoId) {
      lastVideoIdRef.current = currentVideoId;
      try {
        if (typeof player.loadVideoById === 'function') {
          player.loadVideoById({
            videoId: currentVideoId,
            startSeconds: calculateExpectedPosition(playback),
          });
        }
      } catch (err) {
        console.error('Error loading video by ID:', err);
      }
    }

    // Handle Play / Pause sync
    const expectedPos = calculateExpectedPosition(playback);

    try {
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
    }
  }, [isReady, playback]);

  // Periodic drift check & time ticker (every 1 second)
  useEffect(() => {
    if (!isReady || !playerRef.current) return;

    const interval = setInterval(() => {
      try {
        const player = playerRef.current;
        if (typeof player.getCurrentTime === 'function') {
          const localTime = player.getCurrentTime() || 0;
          setCurrentTime(localTime);
        }
        if (typeof player.getDuration === 'function') {
          const dur = player.getDuration() || 0;
          setDuration(dur);
        }
      } catch (e) {
        // Player state transient read
      }
    }, 1000);

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
