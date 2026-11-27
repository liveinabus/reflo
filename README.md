# Reflo development setup

Reflo starts with an Android house-visit prototype. The first field test is to download a small area, open the installed app in airplane mode, and verify that both the map and an edited property review survive an app restart.

## Stack

| Area | Choice |
| --- | --- |
| Mobile | Expo SDK 57, React Native and TypeScript |
| Mobile maps | MapLibre React Native 11 and a tile source that permits offline downloads |
| Local records | Expo SQLite for pins, notes and review scores |
| Web | React, Vite and MapLibre GL JS when the Android workflow is proven |
| Android builds | Expo development build, standalone preview APK and Google Play AAB |

The Android prototype displays OpenFreeMap Liberty. Set `EXPO_PUBLIC_MAP_STYLE_URL` in a local Expo environment file or in the EAS build environment to override the style. Long-press the map or use **Drop a pin** to save a house. Tap its pin or list row to edit it. House records are stored on the device in SQLite.

**Download this area** explains why offline packs are unavailable. [OpenFreeMap's public service terms](https://openfreemap.org/tos/) require no more than 3,000 tiles, 50 MB, and four parallel requests per download, plus a unique app User-Agent. The installed MapLibre React Native offline interface cannot enforce the per-download byte and request limits or set that download User-Agent. The full offline basemap test is pending. House persistence can be tested separately in airplane mode.

## Bootstrap on Windows

Use PowerShell 7 with Node.js and npm. From the repository root, run the setup once npm registry access is available.

```powershell
./setup-mobile.ps1
Set-Location mobile
npx.cmd tsc --noEmit
```

The script creates `mobile/`, installs Expo-managed packages, adds the MapLibre plugin, and copies the Android EAS build profiles. Keep the generated `package-lock.json` in source control. The provisional Android package is `nl.reflo.app`.

For local Android builds, install a JDK and configure the Android SDK for the selected Expo version. Connect an emulator or USB-debuggable Android phone and run `npx.cmd expo run:android` from `mobile/`. For subsequent JavaScript edits, use `npx.cmd expo start --dev-client`. MapLibre requires a development build with its native module.

For a cloud development build, sign in with `npx.cmd eas-cli@latest login` and link `mobile/` to your Expo project with `npx.cmd eas-cli@latest init`. From `mobile/`, use the matching profile.

| Profile | Command | Purpose |
| --- | --- | --- |
| Development | `npx.cmd eas-cli@latest build -p android --profile development` | Install a development client and iterate with Metro |
| Preview | `npx.cmd eas-cli@latest build -p android --profile preview` | Install a standalone APK and field-test without Metro |
| Production | `npx.cmd eas-cli@latest build -p android --profile production` | Produce a signed AAB after setting up release credentials |

The web app, sync, hosting and Play submission follow the Android field test. Keep test property data on-device during the prototype.
