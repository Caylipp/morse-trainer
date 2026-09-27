# Konzept: Morse-Trainer

## Idee
Handy-App nach dem Vorbild physischer Morse-Lerngeräte: Man tippt auf eine große Taste, und nach jedem Druck zeigt die App live an, ob ein Punkt oder Strich erkannt wurde, welcher Buchstabe entsteht und wie das Wort bisher lautet.

## Bewertung
| Kriterium | Einschätzung |
|---|---|
| Machbarkeit | Sehr hoch. Rein lokal, kein Backend nötig. |
| Aufwand MVP | Gering (1–2 Wochen) |
| Konkurrenz | Einige Apps vorhanden (Morse Mania, Morse-It), oft altbacken. Echtes Live-Feedback beim **Senden** ist seltener als Hör-Training. |
| Zielgruppe | Nische: Funkamateure, Pfadfinder, Prepper, Rätsel- und Escape-Room-Fans, Neugierige. |
| Monetarisierung | Klein (Einmalkauf, Premium-Lektionen). |
| Virales Potenzial | Mittel: TikTok-Clips wie „Ich lerne Morse in 7 Tagen“ oder Nachrichten per Morse-Vibration an Freunde senden. |

**Fazit:** Kleines, gut abgrenzbares Projekt, schnell fertig. Eignet sich ideal, um App-Entwicklung und Store-Release einmal komplett durchzuspielen.

## Umsetzungsideen
- **Kern: Timing-Erkennung**
  - Dauer von Druck und Pause messen; Punkt und Strich trennen über adaptive Schwelle (gleitender Mittelwert des Nutzertempos).
  - Pausen > 3 Einheiten ergeben eine Buchstabengrenze, Pausen > 7 Einheiten eine Wortgrenze.
- **Visualisierung**: Morse-Baum (binärer Baum), in dem der aktuelle Pfad bei jedem Druck aufleuchtet. So sieht man sofort, welche Buchstaben noch möglich sind. Genau das ist der Lerneffekt der Geräte.
- **Feedback**: Ton (Sinus 600–700 Hz) und Haptik, die bei jedem Druck mitlaufen.
- **Lernmodus**: Koch-Methode (mit 2 Buchstaben starten, neue freischalten ab 90 % Trefferquote), Farnsworth-Timing.
- **Extras**: Hörtraining, Morse per Taschenlampe senden, Morse-Chat zwischen zwei Handys.
- **Tech**: Flutter oder React Native, sonst nichts.
- **MVP**: Taste, Live-Dekodierung, Morse-Baum, Buchstaben-Übungen.
