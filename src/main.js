import './styles.css';
import { createCityScene } from './scene.js';
import { createAudioControls } from './audio-controls.js';
import { createWeatherControls } from './weather-controls.js';

const districtContent = {
  heywood: {
    code: 'DISTRICT 01 // SOUTHEAST NC', name: 'HEYWOOD',
    description: 'A vibrant sprawl of contrasts. Sleek towers overlook old neighborhoods, and every street corner has a story to tell. Keep your friends close—and your chrome closer.',
    security: 'VOLATILE', vibe: 'STREET SOUL', location: 'HEYWOOD // THE GLEN',
  },
  center: {
    code: 'DISTRICT 02 // CORPORATE NC', name: 'CITY CENTER',
    description: 'The beating corporate heart of Night City. Monumental towers pierce the smog while neon advertisements promise a better life—for anyone who can afford it.',
    security: 'MAXIMUM', vibe: 'CORPO NEON', location: 'CITY CENTER // DOWNTOWN',
  },
  japantown: {
    code: 'DISTRICT 03 // WESTBROOK NC', name: 'JAPANTOWN',
    description: 'When the sun goes down, Japantown comes alive. Arcade lights, midnight noodles, and high-stakes deals beneath a cascade of electric color.',
    security: 'ELEVATED', vibe: 'NEON NOIR', location: 'WESTBROOK // JAPANTOWN',
  },
  market: {
    code: 'SCENARIO 04 // KABUKI NC', name: 'NIGHT MARKET',
    description: 'Follow the crowd through a maze of sizzling food stalls, back-alley chrome, and handcrafted tech. Hundreds of stories trade under the lanterns—and everything has a price.',
    security: 'UNPREDICTABLE', vibe: 'CROWDED CHAOS', location: 'KABUKI // NIGHT MARKET',
  },
  highway: {
    code: 'SCENARIO 05 // NC FREEWAY', name: 'THE HIGHWAY',
    description: 'Six lanes. No speed limit worth mentioning. Ride the electric current through the heart of the city, beneath megatowers and a sky full of neon.',
    security: 'HIGH SPEED', vibe: 'ADRENALINE', location: 'NIGHT CITY // NORTHBOUND',
  },
  beach: {
    code: 'SCENARIO 06 // PACIFICA COAST', name: 'PACIFICA COAST',
    description: 'Beyond the towers, the Pacific glows with reflected neon. Wander the boardwalk, feel the warm rain fade, and watch the last light disappear behind Night City.',
    security: 'UNSTABLE', vibe: 'NEON SUNSET', location: 'PACIFICA // COASTAL BOARDWALK',
  },
  suburbs: {
    code: 'DISTRICT 07 // SUMMIT RIDGE NC', name: 'SUBURBS',
    description: 'Beyond the smog line, Summit Ridge opens onto clear corporate skies. Dense smart estates, guarded loops, and spotless streets arranged like a product—with open weather rolling in over the ridge.',
    security: 'PRIVATE', vibe: 'MANUFACTURED CALM', location: 'SUMMIT RIDGE // SECTOR OVERVIEW',
  },
};

const suburbPlaces = {
  houses: {
    code: 'PLACE 01 // SUMMIT ROUNDABOUT', name: 'SMART ESTATES',
    description: 'A guarded curve drops off the arterial into a landscaped roundabout, then runs straight through Summit Row. Carbon-fiber villas line both sides, a quadruped patrol sweeps the ring, and Summit Play keeps the corner alive with swings, slides, and three late-night food kiosks.',
    security: 'BIOMETRIC', vibe: 'ARMORED PRIVACY', location: 'SUMMIT RIDGE // ESTATES LOOP',
  },
  houses2: {
    code: 'PLACE 01B // SUMMIT ROW', name: 'ESTATE ROW',
    description: 'Both rows of carbon-fiber villas frame Summit Row from curb to roofline. Trimmed lawns, private walk lights, and a twin line of pollarded trees march past driveways where nobody is ever outside.',
    security: 'BIOMETRIC', vibe: 'GATED SILENCE', location: 'SUMMIT RIDGE // ROW CORRIDOR',
  },
  malls: {
    code: 'PLACE 02 // RETAIL SPINE', name: 'MERIDIAN MALL',
    description: 'A strip of curated retail feeds into an enclosed atrium of glass and gold light. Drive-thru bio-dispensaries trade through chrome pods while prestige kiosks scan your iris before they say hello.',
    security: 'CORPO RETAIL', vibe: 'CURATED COMMERCE', location: 'SUMMIT RIDGE // MERIDIAN MALL',
  },
  street: {
    code: 'PLACE 03 // TRANSIT CORRIDOR', name: 'ARTERIAL STREET',
    description: 'Self-healing asphalt runs cyan fiber lanes under sound-cancellation lamps. A bipedal Militech mech patrols the pavement, sweeping its laser past an AV pad where a corporate shuttle never quite lands.',
    security: 'PATROLLED', vibe: 'QUIET CONTROL', location: 'SUMMIT RIDGE // ARTERIAL',
  },
  station: {
    code: 'PLACE 04 // MAGLEV LINE 09', name: 'SUMMIT STATION',
    description: 'An armed commuter monorail glides over white soundproof pillars into a badge-only station. Summit West mirrors the main hall across the guideway while solar park-and-ride canopies shade the cars of people who still have somewhere to be.',
    security: 'BADGE ONLY', vibe: 'COMMUTE LOCKDOWN', location: 'SUMMIT RIDGE // STATION',
  },
  parks: {
    code: 'PLACE 05 // RECREATION', name: 'SUMMIT GREEN',
    description: 'Synthetic lawns stay green on a schedule. A community pool, ball diamond, soccer pitch, playground, and dog run share the ring path with trimming drones and polymer trees.',
    security: 'LOW', vibe: 'ENGINEERED LEISURE', location: 'SUMMIT GREEN // CENTRAL PARK',
  },
  school: {
    code: 'PLACE 06 // EDUCATION CAMPUS', name: 'SUMMIT ACADEMY',
    description: 'Elementary, middle, and high school wings face an oval athletics track. Solar parking canopies and sweeping bleachers hold the families who were selected for this postcode.',
    security: 'CONTROLLED', vibe: 'FUTURE LABOR', location: 'SUMMIT RIDGE // ACADEMY',
  },
  church: {
    code: 'PLACE 07 // CIVIC CORE', name: 'ST. ADRIAN CHAPEL',
    description: 'A white chapel lifts a neon halo over a quiet plaza and fountain. Next door, the community aid center keeps its doors open under the same corporate seal.',
    security: 'OPEN', vibe: 'QUIET FAITH', location: 'SUMMIT RIDGE // CHAPEL PLAZA',
  },
  sidewalks: {
    code: 'PLACE 08 // PEDESTRIAN LAYER', name: 'SIDEWALK GRID',
    description: 'Wide, spotless sidewalks stitch the sector together: wayfinder maps, timber benches, luminous planters, a transit shelter, and not one piece of litter in sight.',
    security: 'MONITORED', vibe: 'ORDERED CALM', location: 'SUMMIT RIDGE // PEDESTRIAN GRID',
  },
};

const elements = Object.fromEntries([
  'loader', 'loader-progress', 'loader-label', 'loader-value', 'webgl-error',
  'district-panel', 'district-code', 'district-name', 'district-description',
  'district-security', 'district-vibe', 'location-name', 'district-places', 'archive-modal',
  'sound-toggle', 'sound-label', 'toast', 'toast-message', 'local-time',
].map((id) => [id, document.getElementById(id)]));

let cityScene;
let activeDistrict = 'center';
let toastTimeout;
const audioControls = createAudioControls({ showToast });
const weatherControls = createWeatherControls({
  onChange: (mode) => cityScene?.setWeather(mode),
  onOpen: () => audioControls.closePanel(),
  showToast,
});
document.getElementById('music-toggle').addEventListener('click', () => weatherControls.closePanel());

function showToast(message) {
  elements['toast-message'].textContent = message;
  elements.toast.classList.add('visible');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => elements.toast.classList.remove('visible'), 2800);
}

function setNavigation(view) {
  document.querySelectorAll('[data-nav]').forEach((button) => {
    button.classList.toggle('active', button.dataset.nav === view);
  });
}

function setActivePlace(place) {
  document.querySelectorAll('[data-place]').forEach((button) => {
    const active = button.dataset.place === place;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
}

function selectSuburbPlace(place) {
  if (activeDistrict !== 'suburbs' || !cityScene) return;
  const content = place === 'overview' ? districtContent.suburbs : suburbPlaces[place];
  if (!content) return;
  elements['district-code'].textContent = content.code;
  elements['district-name'].textContent = content.name;
  elements['district-description'].textContent = content.description;
  elements['district-security'].textContent = content.security;
  elements['district-vibe'].textContent = content.vibe;
  elements['location-name'].textContent = content.location;
  setActivePlace(place);
  setNavigation('districts');
  audioControls.sfx('transition');
  cityScene.focusSuburbPlace(place);
}

function selectDistrict(id) {
  const district = districtContent[id];
  if (!district || !cityScene) return;
  activeDistrict = id;
  document.body.classList.add('is-exploring');
  elements['district-panel'].hidden = false;
  elements['district-code'].textContent = district.code;
  elements['district-name'].textContent = district.name;
  elements['district-description'].textContent = district.description;
  elements['district-security'].textContent = district.security;
  elements['district-vibe'].textContent = district.vibe;
  elements['location-name'].textContent = district.location;
  elements['district-places'].hidden = id !== 'suburbs';
  setActivePlace(id === 'suburbs' ? 'overview' : '');
  document.querySelectorAll('[data-district]').forEach((button) => {
    button.classList.toggle('active', button.dataset.district === id);
    button.setAttribute('aria-pressed', String(button.dataset.district === id));
  });
  const selectedButton = document.querySelector(`[data-district="${id}"]`);
  const dock = document.querySelector('.district-dock');
  if (window.innerWidth <= 760) dock.scrollTo({ left: selectedButton.offsetLeft - dock.clientWidth / 2 + selectedButton.clientWidth / 2, behavior: 'smooth' });
  setNavigation('districts');
  audioControls.sfx('transition');
  cityScene.focusDistrict(id);
}

function resetOverview() {
  if (!cityScene) return;
  document.body.classList.remove('is-exploring');
  elements['district-panel'].hidden = true;
  elements['district-places'].hidden = true;
  setActivePlace('');
  elements['location-name'].textContent = 'NIGHT CITY // OVERVIEW';
  document.querySelectorAll('[data-district]').forEach((button) => {
    button.classList.remove('active');
    button.setAttribute('aria-pressed', 'false');
  });
  setNavigation('overview');
  cityScene.reset();
}

function openArchive() {
  if (!elements['archive-modal'].open) elements['archive-modal'].showModal();
  audioControls.sfx('archive');
  setNavigation('archive');
}

document.getElementById('enter-button').addEventListener('click', () => {
  selectDistrict('center');
  showToast('NEURAL LINK ESTABLISHED');
});
document.getElementById('districts-button').addEventListener('click', () => selectDistrict(activeDistrict));
document.getElementById('home-button').addEventListener('click', resetOverview);
document.getElementById('close-district').addEventListener('click', resetOverview);
document.querySelectorAll('[data-district]').forEach((button) => {
  button.setAttribute('aria-pressed', String(button.classList.contains('active')));
  button.addEventListener('click', () => selectDistrict(button.dataset.district));
});
document.querySelectorAll('[data-place]').forEach((button) => {
  button.addEventListener('click', () => selectSuburbPlace(button.dataset.place));
});
document.querySelectorAll('[data-nav]').forEach((button) => {
  button.addEventListener('click', () => {
    if (button.dataset.nav === 'overview') resetOverview();
    if (button.dataset.nav === 'districts') selectDistrict(activeDistrict);
    if (button.dataset.nav === 'archive') openArchive();
  });
});

document.getElementById('transmission-button').addEventListener('click', openArchive);
document.getElementById('close-archive').addEventListener('click', () => elements['archive-modal'].close());
document.getElementById('archive-enter').addEventListener('click', () => elements['archive-modal'].close());
elements['archive-modal'].addEventListener('click', (event) => {
  if (event.target === elements['archive-modal']) elements['archive-modal'].close();
});
elements['archive-modal'].addEventListener('close', () => {
  setNavigation(document.body.classList.contains('is-exploring') ? 'districts' : 'overview');
});

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape' || elements['archive-modal'].open) return;
  if (weatherControls.closePanel()) return;
  if (audioControls.closePanel()) return;
  if (document.body.classList.contains('is-exploring')) resetOverview();
});

function updateClock() {
  elements['local-time'].textContent = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/Los_Angeles', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).format(new Date());
}
updateClock();
setInterval(updateClock, 1000);

let progress = 0;
const loadingInterval = setInterval(() => {
  progress = Math.min(progress + 4 + Math.random() * 12, 91);
  elements['loader-progress'].style.width = `${progress}%`;
  elements['loader-value'].textContent = `${Math.floor(progress)}%`;
  if (progress > 65) elements['loader-label'].textContent = 'SYNCHRONIZING NEURAL LINK';
}, 100);

requestAnimationFrame(() => {
  try {
    cityScene = createCityScene(document.getElementById('webgl'), {
      onThunder: () => setTimeout(() => audioControls.sfx('thunder'), 650 + Math.random() * 900),
    });
    cityScene.setWeather(weatherControls.current);
    clearInterval(loadingInterval);
    elements['loader-progress'].style.width = '100%';
    elements['loader-value'].textContent = '100%';
    elements['loader-label'].textContent = 'CONNECTION ESTABLISHED';
    setTimeout(() => {
      elements.loader.classList.add('loaded');
      setTimeout(() => showToast('WELCOME TO NIGHT CITY'), 650);
    }, 350);
  } catch (error) {
    clearInterval(loadingInterval);
    console.error('Unable to initialize Night City:', error);
    elements.loader.classList.add('loaded');
    elements['webgl-error'].hidden = false;
  }
});
