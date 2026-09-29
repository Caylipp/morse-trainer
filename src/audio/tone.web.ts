/** Tonerzeugung im Browser über die Web-Audio-API. Gleiche Schnittstelle wie `tone.ts`. */

import { createToneEngine, LEAD_IN_MS } from './engine';

export { LEAD_IN_MS };

const engine = createToneEngine(() => {
  if (typeof window === 'undefined') return null;
  const Ctor =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  return Ctor ? new Ctor() : null;
});

export const { prepareSidetone, sidetoneOn, sidetoneOff, playSegments, stopSegments } = engine;
