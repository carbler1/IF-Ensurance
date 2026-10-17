# If Life Partner: mobile app

The customer app for the house, built with Expo (SDK 57), Expo Router and React Native.
It runs on iOS, Android and the web from one code base.

## Run

```sh
npm install
npx expo start        # then press i (iOS), a (Android) or w (web), or scan the QR code with Expo Go
```

## Web demo (Docker)

`docker compose up mobile` from the repo root serves a web build of the app at http://localhost:8082. On a wide screen the app sits in a phone-sized frame. It shows the look and the flow for a demo; the phone app is the real product.

## Check

```sh
npm run typecheck
npm test
npx expo-doctor
```

## Layout

- `src/app/`: routes. Each file is a screen; `_layout.tsx` holds the store, fonts, the stack and the tab bar.
- `src/components/`: shared UI (`ui.tsx`), the tab bar, onboarding, the risk score preview.
- `src/lib/`: the in-memory store, the translations (`i18n.ts`) and the design tokens (`theme.ts`).
- `src/data/mock.ts`: all mock data. Phase 1 has no backend calls.
- `__tests__/`: Jest tests (`jest-expo`, `expo-router/testing-library`).
