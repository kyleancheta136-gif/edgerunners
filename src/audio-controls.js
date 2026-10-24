import { createAudioEngine } from './audio.js';

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return '0:00';
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
}

export function createAudioControls({ showToast }) {
  const byId = (id) => document.getElementById(id);
  const panel = byId('music-player');
  const musicToggle = byId('music-toggle');
  const soundToggle = byId('sound-toggle');
  const playToggle = byId('play-toggle');
  const progress = byId('track-progress');
  const sfxToggle = byId('sfx-toggle');
  let scrubbing = false;

  const engine = createAudioEngine({
    onEnabledChange(enabled) {
      soundToggle.setAttribute('aria-pressed', String(enabled));
      soundToggle.setAttribute('aria-label', enabled ? 'Mute music and sound effects' : 'Enable music and sound effects');
      byId('sound-label').textContent = enabled ? 'SOUND ON' : 'SOUND OFF';
    },
    onPlaybackChange(playing) {
      playToggle.setAttribute('aria-label', playing ? 'Pause music' : 'Play music');
      byId('play-icon').toggleAttribute('hidden', playing);
      byId('pause-icon').toggleAttribute('hidden', !playing);
      panel.classList.toggle('is-playing', playing);
    },
    onTrackChange(track) {
      byId('track-title').textContent = track.title;
      byId('track-artist').textContent = track.artist;
      byId('track-source').textContent = track.source;
    },
    onProgress({ currentTime, duration }) {
      if (!scrubbing) progress.value = duration ? String((currentTime / duration) * 1000) : '0';
      byId('track-current').textContent = formatTime(currentTime);
      byId('track-duration').textContent = formatTime(duration);
    },
    onError(error) { showToast(error.message.toUpperCase()); },
  });

  function setPanel(open) {
    panel.hidden = !open;
    musicToggle.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('audio-open', open);
  }

  musicToggle.addEventListener('click', () => setPanel(panel.hidden));
  byId('close-music').addEventListener('click', () => setPanel(false));
  soundToggle.addEventListener('click', async () => {
    try {
      const enabled = await engine.toggle();
      if (enabled) engine.sfx('archive');
      showToast(enabled ? 'MUSIC + AUDIO CHANNEL ONLINE' : 'AUDIO CHANNEL MUTED');
    } catch {
      showToast('AUDIO PLAYBACK COULD NOT START');
    }
  });
  playToggle.addEventListener('click', async () => {
    try { await engine.playPause(); }
    catch { showToast('AUDIO PLAYBACK COULD NOT START'); }
  });
  byId('music-volume').addEventListener('input', (event) => engine.setVolume(Number(event.target.value)));
  progress.addEventListener('pointerdown', () => { scrubbing = true; });
  progress.addEventListener('pointerup', () => { scrubbing = false; });
  progress.addEventListener('input', () => engine.seek(Number(progress.value) / 1000));
  byId('track-file').addEventListener('change', async (event) => {
    const [file] = event.target.files;
    if (!file) return;
    try {
      await engine.selectFile(file);
      showToast('LOCAL TRACK LOADED // NOW PLAYING');
    } catch (error) {
      showToast(error.message.toUpperCase());
    } finally {
      event.target.value = '';
    }
  });
  byId('default-track').addEventListener('click', async () => {
    try {
      await engine.useDefault();
      showToast('EDGERUNNERS DEFAULT TRACK RESTORED');
    } catch {
      showToast('DEFAULT TRACK COULD NOT START');
    }
  });
  sfxToggle.addEventListener('click', () => {
    const enabled = !engine.sfxEnabled;
    engine.setSfxEnabled(enabled);
    sfxToggle.setAttribute('aria-pressed', String(enabled));
    byId('sfx-status').textContent = enabled ? 'ENABLED' : 'MUTED';
    if (enabled) engine.sfx('archive');
  });
  document.addEventListener('click', (event) => {
    if (event.target.closest('button')) engine.sfx('click');
    if (!panel.hidden && !panel.contains(event.target) && !musicToggle.contains(event.target)) setPanel(false);
  });

  return {
    sfx: (type) => engine.sfx(type),
    closePanel() {
      if (panel.hidden) return false;
      setPanel(false);
      return true;
    },
  };
}
