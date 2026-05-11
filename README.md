# qa-ai-challenge

Scaffold for the Storyful Senior QA Automation (AI-First) hiring challenge.

This repo contains a small, intentionally-imperfect "Content Verification Workbench" — an Nx monorepo with an Express API and a React + Vite web app. **You will not modify the application.** Your task is to build a Playwright e2e project and an evaluator library around it. Your full instructions were sent in the challenge email.

## Prerequisites

- Node 20 or later
- npm 10+ (ships with Node 20)
- Ports `3333` (API) and `4200` (web) free

## Setup

```bash
npm install
```

That's it.

## Run

Both apps in one command:

```bash
npm run dev
```

Or one at a time, in separate terminals:

```bash
npm run dev:api    # http://localhost:3333
npm run dev:web    # http://localhost:4200
```

Smoke-check the API (in another terminal while it's running):

```bash
npm run smoke
```

## Project structure

```
qa-ai-challenge/
├── apps/
│   ├── verification-api/         Express API (port 3333)
│   │   └── src/{main,state,lib/{classifier,auth,serializers},routes/*}.ts
│   ├── verification-web/         React + Vite UI (port 4200)
│   │   └── src/{App,LoginPage,api,auth,main}.tsx + styles.css
│   └── verification-e2e/         Playwright e2e harness — your tests live here
│       └── src/*.spec.ts
├── libs/
│   ├── shared/                   Shared TS types
│   └── test-data/                Golden dataset loader + JSON
├── scripts/smoke.mjs             Tiny health-check script
├── nx.json
├── tsconfig.base.json
└── package.json
```

## Nx commands

```bash
npx nx serve verification-api
npx nx serve verification-web
npx nx build verification-api
npx nx build verification-web
npx nx run-many --target=serve --parallel=2
```

## End-to-end tests

The Playwright harness is pre-wired at `apps/verification-e2e`. One-time setup (downloads the Chromium binary):

```bash
npm run e2e:init
```

Then write your tests in `apps/verification-e2e/src/*.spec.ts` and run:

```bash
npm run e2e
```

Playwright traces, screenshots, and the HTML report land under `dist/.playwright/apps/verification-e2e/`. Configure additional browsers, retries, and reporters in `apps/verification-e2e/playwright.config.ts`.

## API surface (port 3333)

| Method | Path                | Auth      | Notes                                     |
| ------ | ------------------- | --------- | ----------------------------------------- |
| GET    | `/health`           | Public    | Liveness                                  |
| POST   | `/api/analyze`      | Required  | Body: `{ input: string }` → analysis      |
| GET    | `/api/history`      | Required  | `?limit=N` (default 10)                   |
| GET    | `/api/result/:id`   | Required  | Single analysis or 404                    |
| POST   | `/api/reset`        | Required  | Clears state                              |

## Authentication

The web app gates access behind a sign-in screen. There are two hardcoded users:

| Username   | Password      |
| ---------- | ------------- |
| `qa-tester`| `password123` |
| `admin`    | `admin123`    |

There is **no** `POST /api/auth/login` endpoint.

## Resetting local state

State is in-memory. Either `POST /api/reset` or restart `dev:api`.
