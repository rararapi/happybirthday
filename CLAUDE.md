# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Vite/React birthday celebration app using React Three Fiber for the 3D scene. It displays a birthday cake, candles, balloons, stars, confetti, and a personalized message.

The app supports these URL parameters for the recipient name:

1. Plain text via `?name=`
2. Encrypted value via `?n_enc=`
3. Encrypted value via `?n_cnt=`

## Development Setup

```bash
npm install
npm run dev
npm run build
```

## Architecture

### Core Files

- `index.html` - Vite HTML entry.
- `src/main.tsx` - React entry point.
- `src/App.tsx` - Main app state, long-press candle extinguish interaction, and message display flow.
- `src/components/Scene.tsx` - Three.js scene composition and lighting.
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

## Deployment

The repository is configured for GitHub Pages with the Vite base path `/happybirthday/`.
