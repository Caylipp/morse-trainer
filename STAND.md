# Stand: Morse-Trainer (2026-11-28)

## Was funktioniert
- Senden (Tab Lernen), Hören (Tab Hören) mit Farnsworth-Timing und Koch-Methode, Taste mit Live-Dekodierung, Text-zu-Morse, Optionen (DE/EN/VI). Siehe README.
- Neu: **Statistik** (Optionen, Bereich "Auswertung und Abkürzungen"): Fehlerquote je Zeichen (Senden/Hören getrennt), häufige Verwechslungen (neue Felder `confused` in `CharStats`, alte gespeicherte Stände bleiben lesbar), Stand der Abkürzungen. Logik in `src/lib/koch.ts` (`charReports`, `topConfusions`, `totals`), Screen `src/app/(tabs)/stats.tsx`.
- Neu: **Q-Codes und Abkürzungen** (40 Einträge in DE/EN/VI): Wort hören, Bedeutung wählen, mit Spaced Repetition (Leitner, `src/lib/srs.ts`, Daten `src/lib/abbrev.ts`, Screen `src/app/(tabs)/abbrev.tsx`). Nachsichtig: Fehler wirft nur einen Kasten zurück, kein Zeitdruck, Tempo aus den bestehenden Hör-Einstellungen (Standard 20/10 WPM Farnsworth, nicht verändert). Lernstand in AsyncStorage (`morse.srs.v1`), in den Optionen zurücksetzbar.
- Audio läuft über den bestehenden Weg (`playText`, dauerlaufender Oszillator); keine neuen Module, keine Emoji-Icons (Ionicons-Linien).
- `npm run check` (typecheck, lint, Jest) ist grün: 70 Tests, davon neu `srs`, `abbrev`, Statistik-Funktionen in `koch`.

## Nächste Schritte
- Gerätetest der beiden neuen Screens (siehe offene Fragen).
- Prosigns (AR, SK, BK) fehlen noch: Die Wiedergabe sendet Zeichen mit Pause, Prosigns brauchen eine Wiedergabe ohne Zeichenpause. Deshalb sind sie nicht in den Abkürzungen.
- Spaced Repetition für einzelne Zeichen (Koch) ist nur über die Gewichtung in `pickNextChar` abgedeckt, nicht über Fälligkeiten.
- Reverse-Richtung bei Abkürzungen (Bedeutung sehen, Code tasten) wäre möglich.

## Offene Fragen an Philipp
- **Gerätetest offen:** Nicht auf Gerät oder Simulator geprüft (bewusst kein Build/`expo start`). Nur Typecheck, Lint und Jest. Wirkt Navigation Optionen -> Statistik/Abkürzungen -> Zurück sauber? Passen Tempo und Auswahltexte?
- Sollen Statistik und Abkürzungen eigene Tabs bekommen statt Einstieg über die Optionen? (Fünf Tabs sind schon belegt.)
- Technischer Hinweis: Die Route-Typen von Expo Router werden erst bei `expo start` neu erzeugt, deshalb steht bei `router.navigate('/stats' as never)` ein Cast.
