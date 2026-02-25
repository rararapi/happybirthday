# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A static birthday celebration website that displays a personalized birthday message with animations and confetti effects. The site supports two methods for displaying names:
1. Plain text via `?name=` URL parameter
2. Encrypted value via `?n_enc=` URL parameter (for privacy/surprise)

## Development Setup

This is a static HTML/CSS/JavaScript project with no build process. To run locally:

```bash
# Start a local web server (Python example)
python -m http.server 8000

# Or use any static file server
# Then navigate to http://localhost:8000/
```

## Architecture

### Core Files
- **index.html** - Main birthday display page with confetti animation container
- **script.js** - Handles URL parameter parsing, name decryption, and all interactive animations
- **style.css** - Comprehensive styling with multiple CSS animations for effects

### Interactive Features

The site includes multiple engaging visual and audio effects:

1. **Confetti System** - Continuous colorful confetti falling from top (100 particles per burst, every 6 seconds)
2. **Floating Balloons** - 15 balloons that rise from bottom with gentle swaying motion
3. **Fireworks** - Particle-based fireworks triggered by user clicks (30 particles per explosion)
4. **Sparkle Effects** - Continuous golden sparkles appearing randomly across the screen
5. **Birthday Song** - Procedurally generated "Happy Birthday" melody using Web Audio API (triggered on first click)
6. **Text Glow Animation** - Pulsing glow effect alternating between pink and gold

### Animation Implementation

**JavaScript Functions:**
- `startConfetti()` - Creates 100 falling confetti particles with random colors, delays, and durations
- `createBalloons()` - Generates 15 rising balloons with random positioning and timing
- `createFirework(x, y)` - Spawns radial particle explosion at click coordinates
- `launchFireworks()` - Auto-launches 5 fireworks at random positions on page load
- `createSparkles()` - Interval-based sparkle particle generator (every 300ms)
- `playBirthdaySong()` - Synthesizes melody using oscillators and gain nodes

**User Interaction:**
- Click anywhere triggers firework at cursor position
- First click also plays birthday song (10-second cooldown before allowing replay)
- Visual hint message at bottom: "🎉 クリックで花火と音楽！ 🎵"

### Encryption System

The site uses AES-256-CBC encryption (via CryptoJS library) to encode/decode names in URL parameters:

**Encryption parameters:**
- Key: `'12345678901234567890123456789012'` (32 bytes, 256-bit)
- IV: `'1234567890123456'` (16 bytes, 128-bit)
- Mode: CBC with PKCS7 padding
- Encoding: Base64URL (for URL-safe transmission)

**URL parameter handling** (script.js:20-32):
1. First checks `?name=` parameter (displays uppercase)
2. Falls back to `?n_enc=` parameter (decrypts then displays)
3. Returns empty string if neither present

### Important Implementation Details

- The encryption key and IV are hardcoded in script.js:4-5 for both encryption and decryption
- Encrypted values use Base64URL encoding (replacing `+` with `-`, `/` with `_`) for URL compatibility
- The name display is injected into `<span id="name">` element on page load
- External dependency: CryptoJS 4.1.1 from CDN (loaded in index.html:8)

## GitHub Pages Deployment

This repository is configured for GitHub Pages deployment. When generating URLs with encrypted names, account for the repository name in the path (e.g., `/happybirthday/index.html?n_enc=...` instead of `/index.html?n_enc=...`).
