# Deployment aufs iPhone

Die App ist fertig konfiguriert (Icon, Splash, Bundle-ID `com.philipphoang.morsetrainer`,
keine Berechtigungen, Export-Compliance gesetzt). Es fehlen nur Schritte, die an deine
Apple-ID bzw. dein iPhone gebunden sind.

Es gibt zwei Wege. **Empfehlung: Weg B**, sobald du die App dauerhaft nutzen oder
weitergeben willst; Weg A, wenn du sie heute kostenlos ausprobieren willst.

---

## Weg A – Kostenlos per Kabel (Xcode, gilt 7 Tage)

Einmalig:

1. **Xcode → Settings → Accounts → „+“ → Apple ID** und mit deiner Apple-ID anmelden.
   (Legt automatisch ein kostenloses „Personal Team“ an.) Dann dein Team auswählen →
   **„Manage Certificates…“ → „+“ → „Apple Development“**. Damit liegt das
   Entwicklerzertifikat im Schlüsselbund, das der Build-Befehl braucht.
2. **iPhone per USB-Kabel verbinden**, entsperren und „Diesem Computer vertrauen“ bestätigen.
3. Auf dem iPhone **Entwicklermodus** einschalten:
   *Einstellungen → Datenschutz & Sicherheit → Entwicklermodus* → an → Neustart → bestätigen.
   (Der Punkt erscheint erst, nachdem das iPhone einmal mit Xcode verbunden war.)

Installieren:

```bash
cd ~/projects/morse-trainer
npm run ios:device
```

Der Befehl fragt nach dem Gerät und ggf. dem Team (dein Name, „Personal Team“) und
installiert eine **Release-Version** – sie läuft ohne Mac und ohne Dev-Server.
Der erste Build dauert 20–40 Minuten, danach geht es deutlich schneller.

Falls macOS nach dem Schlüsselbund-Passwort fragt („codesign möchte … verwenden“):
dein Mac-Passwort eingeben und **„Immer erlauben“** wählen.

Beim ersten Start: *Einstellungen → Allgemein → VPN & Geräteverwaltung →
Entwickler-App → „Vertrauen“*.

**Einschränkung:** Mit kostenlosem Account läuft die App nach 7 Tagen ab. Dann einfach
`npm run ios:device` erneut ausführen (Daten bleiben erhalten).

---

## Weg B – TestFlight / App Store (dauerhaft, Apple Developer Program)

Einmalig:

1. **Apple Developer Program** beitreten (99 €/Jahr): <https://developer.apple.com/programs/enroll/>
   Die Freischaltung dauert meist wenige Stunden bis zwei Tage.
2. **Expo-Konto** anlegen (kostenlos): <https://expo.dev/signup>
3. Im Terminal anmelden:
   ```bash
   cd ~/projects/morse-trainer
   npx eas-cli@latest login
   npx eas-cli@latest init          # verknüpft das Projekt mit deinem Expo-Konto
   ```

Bauen und hochladen:

```bash
npm run build:ios    # Cloud-Build; fragt einmal nach Apple-ID + 2FA-Code,
                     # Zertifikate und Profile legt EAS automatisch an
npm run submit:ios   # lädt den Build zu App Store Connect / TestFlight hoch
```

Beim ersten `submit` legt EAS die App in App Store Connect an. Danach:

4. **TestFlight-App** auf dem iPhone installieren.
5. In <https://appstoreconnect.apple.com> → *Morse-Trainer → TestFlight* → dich als
   internen Tester hinzufügen. Die Einladung kommt per Mail → in TestFlight installieren.

Für eine öffentliche Veröffentlichung im App Store zusätzlich: Texte aus
[`store/app-store.md`](store/app-store.md) übernehmen, Screenshots aus
[`store/screenshots/`](store/screenshots/) hochladen, die Datenschutzerklärung
([`PRIVACY.md`](PRIVACY.md)) unter einer öffentlichen URL bereitstellen und zur
Prüfung einreichen.

### Updates

Version in `app.json` (`expo.version`) erhöhen, dann erneut `npm run build:ios` und
`npm run submit:ios`. Die Build-Nummer zählt EAS automatisch hoch.

---

## Lokal prüfen (ohne iPhone)

```bash
npm run check    # Typecheck, Lint, Tests
npm run ios:sim  # Release-Build im iOS-Simulator
```
