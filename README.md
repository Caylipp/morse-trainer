# Morse Trainer

[Deutsche Version](README.de.md)

A mobile app for learning Morse code that **visualizes every key press live**: dot or dash, the current letter, and its path through the Morse tree. Built with Expo (React Native, TypeScript). Runs on iOS, Android and the web.

<p>
  <img src="docs/taste.png" width="220" alt="Key with live decoding and Morse tree">
  <img src="docs/lernen.png" width="220" alt="Koch method sending practice">
  <img src="docs/text.png" width="220" alt="Text to Morse and code table">
</p>

## Features

| Tab | What it does |
|---|---|
| **Key** | Large Morse key with live decoding. The Morse tree highlights the current path and the characters that are still possible; there is a pause bar until the letter ends and an estimated speed (WPM). |
| **Learn** | Koch method for **sending**: start with K and M; a new character unlocks at 90 % accuracy over the last 20 attempts. |
| **Listen** | Koch method for **receiving** with Farnsworth timing, with progress tracked separately. |
| **Text** | Converts text to Morse and plays it as tone, vibration or screen flashes, plus a code table. |
| **Settings** | Speed, adaptive timing, pause tolerance, Farnsworth, pitch, haptics, 5 accent colors × light/dark, languages DE/EN/VI. |

## Engineering notes

- **Adaptive decoder**: dot/dash are separated by running means of press durations; when the last 16 presses contain two clearly separate lengths, the means are found with 2-means clustering, so the decoder locks onto the user's own rhythm within a few characters.
- **Low-latency sidetone**: an always-running oscillator (`react-native-audio-api`) whose gain is toggled by the key, instead of starting a sound file per press, which was noticeably delayed. It shares one audio engine with the Web Audio API version.
- **Pure, tested core**: `src/lib/` (Morse table and tree, decoder, PARIS/Farnsworth timing, Koch progression, WAV synthesis) has no UI dependencies and is covered by Jest tests.

```
src/app         screens (Expo Router)       src/lib     pure logic, tested
src/audio       tone, haptics, playback     src/hooks   useKeyer: decoder + key + tone
src/components  key, Morse tree, UI         src/i18n    de/en/vi
```

## Run

```bash
npm install
npx expo start        # scan the QR code with Expo Go
npm run check         # typecheck, lint, tests
```
