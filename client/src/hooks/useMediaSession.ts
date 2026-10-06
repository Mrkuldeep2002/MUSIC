import { useEffect, useRef } from 'react';
import { PlaybackState, PlaylistItem } from '../types/room';

interface UseMediaSessionProps {
  playback: PlaybackState | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onPlay: () => void;
  onPause: () => void;
  onNextTrack: () => void;
  onSeek?: (position: number) => void;
}

/**
 * Media Session API hook — shows media controls in mobile notification bar / lock screen.
 * Also includes a silent audio keep-alive to prevent mobile browsers from suspending the page.
 */
export function useMediaSession({
  playback,
  isPlaying,
  currentTime,
  duration,
  onPlay,
  onPause,
  onNextTrack,
  onSeek,
}: UseMediaSessionProps) {
  const onPlayRef = useRef(onPlay);
  onPlayRef.current = onPlay;
  const onPauseRef = useRef(onPause);
  onPauseRef.current = onPause;
  const onNextTrackRef = useRef(onNextTrack);
  onNextTrackRef.current = onNextTrack;
  const onSeekRef = useRef(onSeek);
  onSeekRef.current = onSeek;

  // ─── Silent Audio Keep-Alive for Mobile Background Playback ───
  // Mobile browsers (Chrome Android, Safari iOS) aggressively suspend tabs that go to background.
  // A silent audio stream via Web Audio API + hidden <audio> element keeps the audio session alive,
  // preventing the OS from killing the page. This is the same technique used by web-based music players.
  const audioContextRef = useRef<AudioContext | null>(null);
  const silentSourceRef = useRef<AudioBufferSourceNode | OscillatorNode | null>(null);
  const silentAudioElRef = useRef<HTMLAudioElement | null>(null);

  // Create a hidden <audio> element with silent audio on mount (one-time)
  useEffect(() => {
    // Generate a tiny silent WAV as a data URI (44 bytes header + 1 second of silence at 8kHz mono 8-bit)
    const silentAudio = createSilentAudioElement();
    silentAudioElRef.current = silentAudio;

    return () => {
      if (silentAudioElRef.current) {
        silentAudioElRef.current.pause();
        silentAudioElRef.current.remove();
        silentAudioElRef.current = null;
      }
    };
  }, []);

  // Start/stop the silent keep-alive based on playback state
  useEffect(() => {
    if (isPlaying && playback?.videoId) {
      startSilentKeepAlive();
    } else {
      stopSilentKeepAlive();
    }

    return () => stopSilentKeepAlive();
  }, [isPlaying, playback?.videoId]);

  function startSilentKeepAlive() {
    // Start Web Audio API silent oscillator
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Only create if not already running
      if (!silentSourceRef.current) {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        gainNode.gain.value = 0.001; // Nearly silent — just enough to keep audio session alive
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        oscillator.frequency.value = 1; // 1Hz — inaudible frequency
        oscillator.start();
        silentSourceRef.current = oscillator;
        console.log('🔇 Silent keep-alive audio started (mobile background protection)');
      }
    } catch (e) {
      // AudioContext may not be available or may require user gesture
    }

    // Also play the hidden <audio> element for broader compatibility
    if (silentAudioElRef.current) {
      silentAudioElRef.current.play().catch(() => {
        // Autoplay blocked — will start on next user interaction
      });
    }
  }

  function stopSilentKeepAlive() {
    if (silentSourceRef.current) {
      try {
        silentSourceRef.current.stop();
      } catch {}
      silentSourceRef.current = null;
    }
    if (silentAudioElRef.current) {
      silentAudioElRef.current.pause();
    }
  }

  // ─── Media Session Metadata ───

  // Update media session metadata when track changes
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    const track = playback?.currentTrack;
    if (!track) {
      navigator.mediaSession.metadata = null;
      navigator.mediaSession.playbackState = 'none';
      return;
    }

    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title || 'Unknown Track',
      artist: track.channelTitle || 'WeSync',
      album: 'WeSync Room',
      artwork: getArtwork(track),
    });
  }, [playback?.currentTrack?.videoId, playback?.currentTrack?.title]);

  // Update playback state (playing/paused)
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
  }, [isPlaying]);

  // Update position state for notification progress bar
  useEffect(() => {
    if (!('mediaSession' in navigator) || !('setPositionState' in navigator.mediaSession)) return;
    if (!playback?.videoId || duration <= 0) return;

    try {
      navigator.mediaSession.setPositionState({
        duration: Math.max(0, duration),
        playbackRate: 1,
        position: Math.min(Math.max(0, currentTime), duration),
      });
    } catch {
      // Some browsers throw if position > duration during transitions
    }
  }, [currentTime, duration, playback?.videoId]);

  // ─── Media Session Action Handlers ───

  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    const handlePlay = () => {
      console.log('📱 Media Session: Play from notification');
      onPlayRef.current();
    };

    const handlePause = () => {
      console.log('📱 Media Session: Pause from notification');
      onPauseRef.current();
    };

    const handleNextTrack = () => {
      console.log('📱 Media Session: Next Track from notification');
      onNextTrackRef.current();
    };

    const handleSeekTo = (details: MediaSessionActionDetails) => {
      if (details.seekTime !== undefined && details.seekTime !== null && onSeekRef.current) {
        onSeekRef.current(details.seekTime);
      }
    };

    try {
      navigator.mediaSession.setActionHandler('play', handlePlay);
      navigator.mediaSession.setActionHandler('pause', handlePause);
      navigator.mediaSession.setActionHandler('nexttrack', handleNextTrack);
      navigator.mediaSession.setActionHandler('previoustrack', null);
      navigator.mediaSession.setActionHandler('seekto', handleSeekTo);
    } catch (e) {
      console.warn('Media Session: Some action handlers not supported', e);
    }

    return () => {
      try {
        navigator.mediaSession.setActionHandler('play', null);
        navigator.mediaSession.setActionHandler('pause', null);
        navigator.mediaSession.setActionHandler('nexttrack', null);
        navigator.mediaSession.setActionHandler('seekto', null);
      } catch {}
    };
  }, []);
}

// ─── Helpers ───

/**
 * Generate artwork array from YouTube thumbnail URL at multiple resolutions.
 */
function getArtwork(track: PlaylistItem): MediaImage[] {
  const videoId = track.videoId;
  if (!videoId) {
    return track.thumbnailUrl
      ? [{ src: track.thumbnailUrl, sizes: '120x90', type: 'image/jpeg' }]
      : [];
  }

  return [
    { src: `https://img.youtube.com/vi/${videoId}/default.jpg`, sizes: '120x90', type: 'image/jpeg' },
    { src: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`, sizes: '320x180', type: 'image/jpeg' },
    { src: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`, sizes: '480x360', type: 'image/jpeg' },
    { src: `https://img.youtube.com/vi/${videoId}/sddefault.jpg`, sizes: '640x480', type: 'image/jpeg' },
    { src: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`, sizes: '1280x720', type: 'image/jpeg' },
  ];
}

/**
 * Create a hidden <audio> element that loops a tiny silent audio clip.
 * This is a secondary keep-alive mechanism — some mobile browsers respond
 * to <audio> elements better than Web Audio API for preventing suspension.
 */
function createSilentAudioElement(): HTMLAudioElement {
  const audio = document.createElement('audio');
  audio.id = 'wesync-silent-keepalive';
  audio.loop = true;
  audio.volume = 0.01;
  // Tiny silent MP3 (< 1KB) encoded as base64 data URI — plays silence on loop
  audio.src = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAAYYoRwMHAAAAAAD/+1DEAAIH8AZX9AAAI4gzKv8wAABEACAABMQAAAZJgBCAEJu5+sGDhA4IHD/BAcPygYf+X/yg+D4OAgGP/BwEB8H/8oc/+D4Pg+D4AAAATCYAAAAAADS5ubv/7UMQFgAe4Zkf5l4AAAADSDAAAEAAAAB3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3dQ==';
  audio.setAttribute('playsinline', '');
  audio.style.display = 'none';
  document.body.appendChild(audio);
  return audio;
}

