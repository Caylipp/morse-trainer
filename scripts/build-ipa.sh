#!/bin/sh
# Baut eine unsignierte iOS-IPA (Release) – z. B. für LiveContainer, SideStore oder AltStore.
# Diese signieren die App beim Import selbst. Ergebnis: dist/MorseTrainer.ipa
set -eu
cd "$(dirname "$0")/.."

npx expo prebuild --platform ios --no-install >/dev/null
(cd ios && pod install >/dev/null)

xcodebuild \
  -workspace ios/MorseTrainer.xcworkspace \
  -scheme MorseTrainer \
  -configuration Release \
  -sdk iphoneos \
  -destination 'generic/platform=iOS' \
  -derivedDataPath ios/build \
  CODE_SIGNING_ALLOWED=NO CODE_SIGNING_REQUIRED=NO CODE_SIGN_IDENTITY="" \
  | grep -E "error:|BUILD SUCCEEDED|BUILD FAILED" || true

APP=ios/build/Build/Products/Release-iphoneos/MorseTrainer.app
[ -d "$APP" ] || { echo "Build fehlgeschlagen: $APP fehlt" >&2; exit 1; }

rm -rf dist/ipa && mkdir -p dist/ipa/Payload
cp -R "$APP" dist/ipa/Payload/
(cd dist/ipa && zip -qry ../MorseTrainer.ipa Payload)
rm -rf dist/ipa
echo "Fertig: dist/MorseTrainer.ipa ($(du -h dist/MorseTrainer.ipa | cut -f1))"
