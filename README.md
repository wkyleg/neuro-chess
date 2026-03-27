# Neuro Chess

[![Deploy](https://github.com/wkyleg/neuro-chess/actions/workflows/deploy.yml/badge.svg)](https://github.com/wkyleg/neuro-chess/actions/workflows/deploy.yml)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript)](tsconfig.json)

**[Play Now](https://wkyleg.github.io/neuro-chess/)** | [Elata Biosciences](https://elata.io)

A chess trainer that tracks your neural and physiological state in real time. Play against Stockfish while EEG and webcam sensors measure how stress, focus, and calm shape every move you make. Post-game analysis correlates your brain state with chess performance.

## Features

- **Stockfish 16 engine** — adjustable difficulty (Easy / Medium / Hard) running via WASM Web Worker
- **Real-time EEG integration** via Muse headband (Web Bluetooth) using the [Elata SDK](https://docs.elata.bio/sdk/overview)
- **Webcam heart rate (rPPG)** — heart rate and HRV via facial video analysis, no wearables needed
- **Live neuro HUD** — EEG band powers, calm/arousal percentages, HR, HRV, respiration rate, signal quality displayed during play
- **Comprehensive post-game analysis** — 10+ charts correlating neural state with chess performance (calm per move, EEG bands, heart rate timeline, material balance, thinking time, and more)
- **Classical music player** — 10 bundled public domain piano recordings (Bach, Beethoven, Chopin, Debussy, Satie, Prokofiev)
- **Cold War bunker aesthetic** — Windows 98 chrome via 98.css with an institutional green/beige color palette

## Tech Stack

- **React 19** + **TypeScript** (strict mode) — component-based UI
- **Vite 6** — fast dev server with WASM and top-level await support
- **Zustand** — lightweight state management for game and neuro state
- **chess.js** + **react-chessboard** — chess logic and board rendering
- **Stockfish 16** — WASM chess engine via Web Worker
- **Recharts** — data visualization for post-game analysis
- **Tailwind CSS 4** + **98.css** — retro-styled responsive layout
- **Vitest** + **jsdom** — unit tests
- **Biome** — formatting and linting
- **Elata SDK** — `@elata-biosciences/eeg-web`, `eeg-web-ble`, `rppg-web`

## Quick Start

```bash
pnpm install
pnpm dev          # dev server on http://localhost:3002
pnpm build        # tsc + vite build → dist/
pnpm preview      # serve production build
pnpm test         # vitest (watch mode)
pnpm typecheck    # tsc --noEmit
pnpm lint         # biome check (read-only)
pnpm format       # biome format --write
```

## Neurotech Devices

| Device | Protocol | Browser Support |
|--------|----------|----------------|
| Webcam (rPPG heart rate) | getUserMedia | All modern browsers |
| Muse S headband (EEG) | Web Bluetooth | Chrome, Edge, Brave |

Connect devices on the setup page before starting a game, or skip to play without sensors. Mock/simulated signals are available in settings for development.

## Repository Structure

```
src/
├── pages/
│   ├── HomePage.tsx         # Landing page
│   ├── SetupPage.tsx        # Device connection before play
│   ├── PlayPage.tsx         # Chess board + neuro HUD + tabbed panel
│   ├── AnalysisPage.tsx     # Post-game charts and statistics
│   └── SettingsPage.tsx     # Difficulty, signal mode, device config
├── components/
│   ├── MusicPlayer.tsx      # Classical music player (10 bundled tracks)
│   ├── DeviceConnect.tsx    # Webcam + EEG connection UI
│   ├── SignalQuality.tsx    # Signal strength indicator
│   └── NeuroPanel.tsx       # Neuro metrics display panel
├── lib/
│   ├── gameStore.ts         # Zustand store for chess state + neuro per move
│   ├── gameStore.test.ts    # Unit tests for game logic
│   └── stockfishEngine.ts   # Stockfish WASM Web Worker wrapper
├── neuro/
│   ├── neuroManager.ts      # Orchestrates EEG + rPPG providers
│   ├── eegProvider.ts       # Elata EEG SDK integration
│   ├── rppgProvider.ts      # Elata rPPG SDK integration
│   ├── store.ts             # Zustand store for neuro signals
│   ├── hooks.ts             # React hooks (useNeuroSignals, etc.)
│   ├── NeuroProvider.tsx    # React context provider
│   └── simulatedEegSource.ts # Mock EEG data for development
└── test/
    └── setup.ts             # Vitest setup (mocks for AudioContext, localStorage)

public/
├── music/                   # 10 public domain classical piano MP3s
└── stockfish/               # Stockfish 16 WASM + JS files
```

## How It Works

1. **Setup** — Connect your webcam and/or EEG headband (or skip for sensorless play)
2. **Play** — Move pieces against Stockfish while the bottom HUD displays live neural metrics
3. **Analyze** — After the game ends, review comprehensive charts showing how your brain state correlated with chess performance

The neuro HUD displays EEG band powers (delta, theta, alpha, beta, gamma), calmness state, alpha peak frequency, heart rate, HRV, respiration rate, and arousal — all updating in real time during play. Each move records a full neural snapshot for post-game analysis.

## License

[ISC](LICENSE) — Copyright (c) 2024-2026 Elata Biosciences
