import { DEFAULT_SETTINGS, migrateSettings, SETTINGS_VERSION } from '../settings';

describe('settings', () => {
  it('fills missing fields with defaults', () => {
    expect(migrateSettings({ version: SETTINGS_VERSION })).toEqual(DEFAULT_SETTINGS);
    expect(migrateSettings({ version: SETTINGS_VERSION, frequency: 700 }).frequency).toBe(700);
  });

  it('upgrades untouched v1 defaults to the new timing', () => {
    const s = migrateSettings({ sendWpm: 10, gapTolerance: 1, frequency: 600 });
    expect(s.sendWpm).toBe(DEFAULT_SETTINGS.sendWpm);
    expect(s.gapTolerance).toBe(DEFAULT_SETTINGS.gapTolerance);
    expect(s.frequency).toBe(600);
  });

  it('keeps timing the user changed in v1', () => {
    const s = migrateSettings({ sendWpm: 15, gapTolerance: 1 });
    expect(s.sendWpm).toBe(15);
    expect(s.gapTolerance).toBe(1);
  });

  it('does not migrate values stored by v2', () => {
    const s = migrateSettings({ version: 2, sendWpm: 10, gapTolerance: 1 });
    expect(s.sendWpm).toBe(10);
    expect(s.gapTolerance).toBe(1);
  });

  it('resets the v2 tolerance default of 2x', () => {
    expect(migrateSettings({ version: 2, sendWpm: 20, gapTolerance: 2 }).gapTolerance).toBe(1);
    expect(migrateSettings({ version: 3, gapTolerance: 2 }).gapTolerance).toBe(2);
  });

  it('moves the old 20 WPM default back to 10 but keeps own values', () => {
    expect(DEFAULT_SETTINGS.sendWpm).toBe(10);
    expect(migrateSettings({ version: 3, sendWpm: 20 }).sendWpm).toBe(10);
    expect(migrateSettings({ version: 3, sendWpm: 4 }).sendWpm).toBe(4);
    expect(migrateSettings({ version: 4, sendWpm: 20 }).sendWpm).toBe(20);
  });

  it('does not leak the version field into settings', () => {
    expect(migrateSettings({ version: 2 })).not.toHaveProperty('version');
  });
});
