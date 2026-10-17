# If Life Partner: mobile app

The customer app for the house, built with Expo (SDK 57), Expo Router and React Native.
It runs on iOS, Android and the web from one code base.

## Run

The app reads the demo customer from the backend, so start the stack first (`docker compose up` in the repo root).

```sh
cp .env.example .env  # set EXPO_PUBLIC_API_URL and EXPO_PUBLIC_API_TOKEN (CUSTOMER_TOKEN in the root .env)
npm install
npx expo start        # then press i (iOS), a (Android) or w (web), or scan the QR code with Expo Go
```

On a phone in Expo Go, `EXPO_PUBLIC_API_URL` must be the computer's LAN address with the backend port, for example `http://<lan-ip>:8000`, not `localhost`. Restart Expo with `--clear` after changing `.env`.

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
- `src/lib/`: the store (loads from and saves to the backend), the API client (`api.ts`, `types.ts`), the translations (`i18n.ts`) and the design tokens (`theme.ts`).
- `src/data/mock.ts`: static UI pieces only (types, onboarding questions). The customer's data comes from `GET /v1/me/app`; its source is `data/demo-person.json` in the repo root.
- `__tests__/`: Jest tests (`jest-expo`, `expo-router/testing-library`). They use `test-support/fakeApi.ts`, which serves a recorded backend response.
