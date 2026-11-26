/**
 * Curated Relaxing Presets & Persistent Settings Storage
 */

export const STORAGE_KEY = 'hanoi_soundscapes_settings_v1';

export const PRESETS = [
  {
    id: 'midnight-rain',
    name: 'Midnight Rain & Daf',
    subtitle: 'Slow rainfall on dark emerald stone with resonant frame drum',
    numDiscs: 5,
    tempo: 56,
    spatialSpread: 82,
    resonance: 0.72,
    loopMode: true,
    dafVolume: 0.82,
    natureVolume: 0.62,
    natureEnabled: true,
    ambienceProfile: {
      rain: 0.88,
      wind: 0.32,
      water: 0.35,
      rainDensity: 1.0,
      fireflyDensity: 0.45,
    },
  },
  {
    id: 'desert-courtyard',
    name: 'Desert Courtyard Rhythm',
    subtitle: 'Warm evening breeze and dry cedar courtyard acoustics',
    numDiscs: 6,
    tempo: 68,
    spatialSpread: 68,
    resonance: 0.56,
    loopMode: true,
    dafVolume: 0.88,
    natureVolume: 0.48,
    natureEnabled: true,
    ambienceProfile: {
      rain: 0.12,
      wind: 0.92,
      water: 0.22,
      rainDensity: 0.15,
      fireflyDensity: 1.0,
    },
  },
  {
    id: 'forest-stream',
    name: 'Forest Stream Meditation',
    subtitle: 'Flowing water, unhurried breath, and wide stereo calm',
    numDiscs: 4,
    tempo: 48,
    spatialSpread: 92,
    resonance: 0.82,
    loopMode: true,
    dafVolume: 0.76,
    natureVolume: 0.72,
    natureEnabled: true,
    ambienceProfile: {
      rain: 0.42,
      wind: 0.38,
      water: 0.95,
      rainDensity: 0.45,
      fireflyDensity: 0.8,
    },
  },
  {
    id: 'deep-focus',
    name: 'Deep Focus Pulse',
    subtitle: 'Crisp seven-level fractal percussion for steady concentration',
    numDiscs: 7,
    tempo: 84,
    spatialSpread: 55,
    resonance: 0.36,
    loopMode: true,
    dafVolume: 0.85,
    natureVolume: 0.36,
    natureEnabled: true,
    ambienceProfile: {
      rain: 0.55,
      wind: 0.4,
      water: 0.2,
      rainDensity: 0.55,
      fireflyDensity: 0.55,
    },
  },
];

export const DEFAULT_SETTINGS = {
  presetId: PRESETS[0].id,
  numDiscs: PRESETS[0].numDiscs,
  tempo: PRESETS[0].tempo,
  spatialSpread: PRESETS[0].spatialSpread,
  resonance: PRESETS[0].resonance,
  loopMode: PRESETS[0].loopMode,
  dafVolume: PRESETS[0].dafVolume,
  natureVolume: PRESETS[0].natureVolume,
  natureEnabled: PRESETS[0].natureEnabled,
  ambienceProfile: { ...PRESETS[0].ambienceProfile },
};

export function loadSavedSettings() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    const matchedPreset = PRESETS.find((p) => p.id === parsed.presetId) || PRESETS[0];

    return {
      presetId: parsed.presetId ?? DEFAULT_SETTINGS.presetId,
      numDiscs: clampInt(parsed.numDiscs, 3, 8, DEFAULT_SETTINGS.numDiscs),
      tempo: clampInt(parsed.tempo, 45, 100, DEFAULT_SETTINGS.tempo),
      spatialSpread: clampInt(parsed.spatialSpread, 0, 100, DEFAULT_SETTINGS.spatialSpread),
      resonance: clampFloat(parsed.resonance, 0.2, 0.9, DEFAULT_SETTINGS.resonance),
      loopMode: typeof parsed.loopMode === 'boolean' ? parsed.loopMode : DEFAULT_SETTINGS.loopMode,
      dafVolume: clampFloat(parsed.dafVolume, 0, 1, DEFAULT_SETTINGS.dafVolume),
      natureVolume: clampFloat(parsed.natureVolume, 0, 1, DEFAULT_SETTINGS.natureVolume),
      natureEnabled:
        typeof parsed.natureEnabled === 'boolean'
          ? parsed.natureEnabled
          : DEFAULT_SETTINGS.natureEnabled,
      ambienceProfile: {
        ...matchedPreset.ambienceProfile,
        ...(parsed.ambienceProfile || {}),
      },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Ignore storage quota or privacy-mode errors gracefully
  }
}

function clampInt(val, min, max, fallback) {
  const n = Number(val);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.round(n)));
}

function clampFloat(val, min, max, fallback) {
  const n = Number(val);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}
