# AGENTS.md

This file provides shared guidance for coding agents working in this repository.

## Project Overview

This is a Vite/React birthday celebration app using React Three Fiber for the 3D scene. It displays a birthday cake, candles, balloons, stars, confetti, and a personalized birthday message.

The app supports these URL parameters for the recipient name:

1. Plain text via `?name=`
2. Encrypted value via `?n_enc=`
3. Encrypted value via `?n_cnt=`

## Commands

- Install dependencies: `npm install`
- Start dev server: `npm run dev`
- Build for production: `npm run build`

Run `npm run build` before committing UI, TypeScript, or dependency changes.

## Architecture

### Core Files

- `index.html` - Vite HTML entry.
- `src/main.tsx` - React entry point.
- `src/App.tsx` - Main app state, long-press candle extinguish interaction, celebration timeline, and message display flow.
- `src/state/blowState.ts` - Mutable per-frame animation state (extinguish, blow strength, room light). Read it inside `useFrame`; do not move it into React state.
- `src/components/Scene.tsx` - Scene composition, dark-room/room lighting, camera rig, and background bokeh.
- `src/components/BirthdayCake.tsx` - Procedural cake (lathe tiers, piping, strawberries, plate) and candle placement.
- `src/components/Candles.tsx` - Instanced candles, shader flames, glow halos, embers, smoke, and the aggregated candle light.
- `src/components/Balloons.tsx` - 3D balloons.
- `src/components/Table.tsx` - Tablecloth and blob shadows.
- `src/components/CTAOverlay.tsx` - Initial instruction overlay.
- `src/components/MessageCard.tsx` - Final birthday message.
- `src/hooks/useGiftName.ts` - URL name parsing and decryption.
- `src/hooks/useConfetti.ts` - Confetti trigger.
- `src/data/messages.ts` - Birthday message text.

### Supporting Files

- `encrypt/` - Usage guide and URL generator page (name, encrypted name, and age parameters). `npm run build` copies it to `dist/encrypt/`.
- `vite.config.ts` - Vite configuration for GitHub Pages under `/happybirthday/`.
- `src/index.css` - Tailwind and global styles.

## Interaction Flow

1. App starts in `idle`.
2. User long-presses the screen.
3. While holding, `progress` drives `extinguish` from `0` to `1`.
4. Candles go out front-to-back as `extinguish` passes each candle's threshold; flames lean while blowing, then leave smoke and embers. Releasing early keeps extinguished candles out and resumes from the same progress.
5. At completion the room stays dark briefly (`DARK_PAUSE_SEC`), then room lights come on with confetti and music, followed by the message card.

## Agent Rules

- Keep the GitHub Pages base path as `/happybirthday/`.
- Preserve support for `?name=`, `?n_enc=`, and `?n_cnt=`.
- Do not reintroduce the old DOM implementation files: `script.js`, `style.css`, `three-scene.js`, or `birthday-cake.png`.
- Avoid adding postprocessing bloom unless black rendering issues are explicitly re-tested.
- Glow is faked with additive halo sprites in `Candles.tsx`; keep candle rendering instanced so `?age=200` stays fast on phones.
- Prefer small, focused visual changes and verify with `npm run build`.
