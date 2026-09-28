/** Übersetzungen (Deutsch, Englisch, Vietnamesisch) und der Hook `useT`. */

import { getLocales } from 'expo-localization';
import { useCallback } from 'react';

import type { Language } from '../state/settings';
import { useSettings } from '../state/store';
import { de, Dictionary, TranslationKey } from './de';
import { en } from './en';
import { vi } from './vi';

export type Locale = Exclude<Language, 'system'>;
export type { TranslationKey };

const DICTIONARIES: Record<Locale, Dictionary> = { de, en, vi };

/** Namen der Sprachen in der jeweiligen Sprache selbst. */
export const LANGUAGE_NAMES: Record<Locale, string> = { de: 'Deutsch', en: 'English', vi: 'Tiếng Việt' };

export function systemLocale(): Locale {
  try {
    const code = getLocales()[0]?.languageCode;
    if (code === 'de' || code === 'vi') return code;
  } catch {
    // z. B. in Tests ohne native Module
  }
  return 'en';
}

export function resolveLocale(language: Language): Locale {
  return language === 'system' ? systemLocale() : language;
}

export function translate(
  locale: Locale,
  key: TranslationKey,
  params?: Record<string, string | number>,
): string {
  const text = DICTIONARIES[locale][key] ?? de[key];
  return params ? text.replace(/\{(\w+)\}/g, (m, name) => (name in params ? String(params[name]) : m)) : text;
}

export function useT() {
  const { settings } = useSettings();
  const locale = resolveLocale(settings.language);
  return useCallback(
    (key: TranslationKey, params?: Record<string, string | number>) => translate(locale, key, params),
    [locale],
  );
}
