const DEFAULT_TRACK = {
  src: '/audio/i-really-want-to-stay-at-your-house.mp3',
  title: 'I Really Want to Stay at Your House',
  artist: 'Rosa Walton & Hallie Coggins',
  source: 'EDGERUNNERS // DEFAULT TRACK',
};

export function createAudioEngine(callbacks = {}) {
  const music = new Audio();
  const audio = {
    enabled: false,
    sfxEnabled: true,
    volume: 0.55,
    objectUrl: null,
    context: null,
    ambience: null,
    track: DEFAULT_TRACK,
  };
  music.preload = 'metadata';
  music.loop = true;
  music.volume = audio.volume;
  music.src = DEFAULT_TRACK.src;

  function initializeEffects() {
    if (audio.context) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) throw new Error('Web Audio is not supported');
    audio.context = new AudioContext();
    audio.ambience = audio.context.createGain();
    audio.ambience.gain.value = 0;
    audio.ambience.connect(audio.context.destination);

    const lowpass = audio.context.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 260;
    lowpass.connect(audio.ambience);
    [43, 64.5, 86].forEach((frequency, index) => {
      const oscillator = audio.context.createOscillator();
      const gain = audio.context.createGain();
      oscillator.type = index === 1 ? 'triangle' : 'sine';
      oscillator.frequency.value = frequency;
      gain.gain.value = index === 0 ? 0.15 : 0.035;
      oscillator.connect(gain).connect(lowpass);
      oscillator.start();
    });

    const buffer = audio.context.createBuffer(1, audio.context.sampleRate * 3, audio.context.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < data.length; i += 1) {
      last = (last + 0.018 * (Math.random() * 2 - 1)) / 1.018;
      data[i] = last * 2.4;
    }
    const noise = audio.context.createBufferSource();
    const noiseGain = audio.context.createGain();
    noise.buffer = buffer;
    noise.loop = true;
    noiseGain.gain.value = 0.1;
    noise.connect(noiseGain).connect(lowpass);
    noise.start();
  }

  function syncAmbience() {
    if (!audio.context) return;
    const target = audio.enabled && audio.sfxEnabled ? 0.09 : 0;
    audio.ambience.gain.setTargetAtTime(target, audio.context.currentTime, 0.3);
  }

  function playThunder() {
    const now = audio.context.currentTime;
    const duration = 3.4;
    const buffer = audio.context.createBuffer(1, audio.context.sampleRate * duration, audio.context.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < data.length; i += 1) {
      last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
      data[i] = last * 3.4;
    }
    const source = audio.context.createBufferSource();
    const filter = audio.context.createBiquadFilter();
    const gain = audio.context.createGain();
    source.buffer = buffer;
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(210, now);
    filter.frequency.exponentialRampToValueAtTime(55, now + duration);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.4, now + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    source.connect(filter).connect(gain).connect(audio.context.destination);
    source.start(now);
    source.stop(now + duration);
  }

  function progress() {
    callbacks.onProgress?.({
      currentTime: music.currentTime,
      duration: Number.isFinite(music.duration) ? music.duration : 0,
    });
  }

  music.addEventListener('play', () => callbacks.onPlaybackChange?.(true));
  music.addEventListener('pause', () => callbacks.onPlaybackChange?.(false));
  music.addEventListener('timeupdate', progress);
  music.addEventListener('loadedmetadata', progress);
  music.addEventListener('error', () => callbacks.onError?.(new Error('This audio file could not be played')));

  async function setEnabled(next) {
    if (next) {
      initializeEffects();
      await audio.context.resume();
      try {
        await music.play();
      } catch (error) {
        audio.enabled = false;
        syncAmbience();
        callbacks.onEnabledChange?.(false);
        throw error;
      }
    } else {
      music.pause();
    }
    audio.enabled = next;
    syncAmbience();
    callbacks.onEnabledChange?.(next);
    return next;
  }

  async function loadTrack(track) {
    music.pause();
    music.src = track.src;
    music.load();
    audio.track = track;
    callbacks.onTrackChange?.(track);
    callbacks.onProgress?.({ currentTime: 0, duration: 0 });
    await setEnabled(true);
    return track;
  }

  return {
    get enabled() { return audio.enabled; },
    get sfxEnabled() { return audio.sfxEnabled; },
    toggle: () => setEnabled(!audio.enabled),
    async playPause() {
      if (music.paused) {
        if (!audio.enabled) return setEnabled(true);
        await audio.context.resume();
        await music.play();
        return true;
      }
      music.pause();
      return false;
    },
    async selectFile(file) {
      const validType = file.type.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(file.name);
      if (!validType) throw new Error('Choose a valid audio file');
      const objectUrl = URL.createObjectURL(file);
      const title = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ').trim();
      try {
        const track = await loadTrack({ src: objectUrl, title, artist: 'Your local audio file', source: 'LOCAL DEVICE // PRIVATE SESSION' });
        if (audio.objectUrl) URL.revokeObjectURL(audio.objectUrl);
        audio.objectUrl = objectUrl;
        return track;
      } catch (error) {
        URL.revokeObjectURL(objectUrl);
        throw error;
      }
    },
    async useDefault() {
      const track = await loadTrack(DEFAULT_TRACK);
      if (audio.objectUrl) URL.revokeObjectURL(audio.objectUrl);
      audio.objectUrl = null;
      return track;
    },
    setVolume(value) {
      audio.volume = Math.min(Math.max(value, 0), 1);
      music.volume = audio.volume;
    },
    seek(fraction) {
      if (Number.isFinite(music.duration)) music.currentTime = fraction * music.duration;
    },
    setSfxEnabled(value) {
      audio.sfxEnabled = value;
      syncAmbience();
    },
    sfx(type = 'click') {
      if (!audio.enabled || !audio.sfxEnabled || !audio.context) return;
      if (type === 'thunder') {
        playThunder();
        return;
      }
      const settings = {
        click: [620, 420, 0.055, 0.022],
        transition: [110, 520, 0.42, 0.04],
        archive: [240, 880, 0.22, 0.025],
      }[type] || [620, 420, 0.055, 0.022];
      const [start, end, duration, volume] = settings;
      const now = audio.context.currentTime;
      const oscillator = audio.context.createOscillator();
      const gain = audio.context.createGain();
      oscillator.type = type === 'click' ? 'square' : 'sawtooth';
      oscillator.frequency.setValueAtTime(start, now);
      oscillator.frequency.exponentialRampToValueAtTime(end, now + duration);
      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      oscillator.connect(gain).connect(audio.context.destination);
      oscillator.start(now);
      oscillator.stop(now + duration);
    },
  };
}
