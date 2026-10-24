const STORAGE_KEY = 'night-city-weather-v2';
const MODES = {
  off: { label: 'SUNNY', indicator: 'SUN', readout: 'CLEAR SKIES // 22 KM/H', toast: 'CLEAR SKY SYSTEM ONLINE' },
  rain: { label: 'RAIN', indicator: 'RAIN', readout: 'STEADY RAIN // 24 KM/H', toast: 'RAIN SYSTEM ENGAGED' },
  storm: { label: 'THUNDERSTORM', indicator: 'STORM', readout: 'STORM CELL // LIGHTNING ACTIVE', toast: 'STORM FRONT INBOUND' },
  wind: { label: 'WINDY', indicator: 'WIND', readout: 'GALE FRONT // 68 KM/H', toast: 'WIND ADVISORY ACTIVE' },
};

function storedMode() {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return MODES[value] ? value : 'off';
  } catch {
    return 'off';
  }
}

export function createWeatherControls({ onChange, onOpen, showToast }) {
  const byId = (id) => document.getElementById(id);
  const panel = byId('weather-panel');
  const toggle = byId('weather-toggle');
  const buttons = [...panel.querySelectorAll('[data-weather]')];
  let current = storedMode();

  function applyMode(mode, announce = false) {
    current = MODES[mode] ? mode : 'off';
    const details = MODES[current];
    buttons.forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.weather === current));
    });
    byId('weather-current').textContent = details.label;
    byId('weather-readout').textContent = details.readout;
    byId('weather-indicator').textContent = details.indicator;
    toggle.dataset.mode = current;
    toggle.setAttribute('aria-label', `Open weather controls. Current weather: ${details.label.toLowerCase()}`);
    try { localStorage.setItem(STORAGE_KEY, current); } catch { /* storage may be unavailable */ }
    onChange?.(current);
    if (announce) showToast?.(details.toast);
  }

  function setPanel(open) {
    if (open) onOpen?.();
    panel.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('weather-open', open);
  }

  applyMode(current);
  toggle.addEventListener('click', () => setPanel(panel.hidden));
  byId('close-weather').addEventListener('click', () => setPanel(false));
  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      applyMode(button.dataset.weather, true);
      setPanel(false);
    });
  });
  document.addEventListener('click', (event) => {
    if (!panel.hidden && !panel.contains(event.target) && !toggle.contains(event.target)) setPanel(false);
  });

  return {
    get current() { return current; },
    closePanel() {
      if (panel.hidden) return false;
      setPanel(false);
      return true;
    },
  };
}
