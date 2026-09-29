/**
 * Tonerzeugung auf iOS/Android.
 *
 * Bevorzugt Echtzeit-Audio über react-native-audio-api (Oszillator, praktisch
 * keine Latenz). Dieses Modul ist nativ und fehlt in Expo Go; dort greift
 * automatisch die dateibasierte Variante aus `tone.fallback.ts` (spürbare Latenz).
 */

import { createToneEngine, LEAD_IN_MS, ToneEngine } from './engine';
import * as fallback from './tone.fallback';

export { LEAD_IN_MS };

function createRealtimeEngine(): ToneEngine | null {
  try {
    // Dynamisch laden: Fehlt das native Modul (Expo Go), wirft schon der Import.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { AudioContext, AudioManager } = require('react-native-audio-api');
    // Wie zuvor: Ton auch bei stummgeschaltetem iPhone, andere Audio-Apps laufen weiter.
    AudioManager.setAudioSessionOptions({
      iosCategory: 'playback',
      iosMode: 'default',
      iosOptions: ['mixWithOthers'],
    });
    AudioManager.setAudioSessionActivity(true).catch(() => {});
    return createToneEngine(() => new AudioContext());
  } catch (e) {
    console.warn('Echtzeit-Audio nicht verfügbar, nutze Dateiwiedergabe', e);
    return null;
  }
}

const engine: ToneEngine = createRealtimeEngine() ?? fallback;

export const prepareSidetone = engine.prepareSidetone.bind(engine);
export const sidetoneOn = engine.sidetoneOn.bind(engine);
export const sidetoneOff = engine.sidetoneOff.bind(engine);
export const playSegments = engine.playSegments.bind(engine);
export const stopSegments = engine.stopSegments.bind(engine);
