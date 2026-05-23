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
- `src/App.tsx` - Main app state, long-press candle extinguish interaction, and message display flow.
- `src/components/Scene.tsx` - Three.js scene composition, background stars, and lighting.
- `src/components/BirthdayCake.tsx` - Cake and candle placement.
- `src/components/Candle.tsx` - Candle mesh, flame, and flame light.
- `src/components/Flame.tsx` - Shader-based animated flame.
- `src/components/Balloons.tsx` - 3D balloons.
- `src/components/Table.tsx` - Cake table.
- `src/components/CTAOverlay.tsx` - Initial instruction overlay.
- `src/components/MessageCard.tsx` - Final birthday message.
- `src/hooks/useGiftName.ts` - URL name parsing and decryption.
- `src/hooks/useConfetti.ts` - Confetti trigger.
- `src/data/messages.ts` - Birthday message text.

### Supporting Files

- `encrypt/` - Helper page for generating encrypted name parameters.
- `vite.config.ts` - Vite configuration for GitHub Pages under `/happybirthday/`.
- `src/index.css` - Tailwind and global styles.

## Interaction Flow

1. App starts in `idle`.
2. User long-presses the screen.
3. While holding, `progress` drives `extinguish` from `0` to `1`.
4. The flame shrinks toward the wick while continuing to animate.
5. At completion, the app fires confetti and transitions to the message card.

## Agent Rules

- Keep the GitHub Pages base path as `/happybirthday/`.
- Preserve support for `?name=`, `?n_enc=`, and `?n_cnt=`.
- Do not reintroduce the old DOM implementation files: `script.js`, `style.css`, `three-scene.js`, or `birthday-cake.png`.
- Avoid adding postprocessing bloom unless black rendering issues are explicitly re-tested.
- Prefer small, focused visual changes and verify with `npm run build`.
