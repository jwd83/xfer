# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

**xfer** is a peer-to-peer file transfer web application that enables direct file sharing between users without uploading to a server. The application uses WebRTC for P2P connections via the [secure-file-transfer](https://github.com/jeremyckahn/secure-file-transfer) library, which internally uses WebTorrent and wormhole-crypto for encrypted transfers.

## Architecture

### Two-Mode System

The application is a **single-page vanilla JavaScript application** that operates in two distinct modes determined by the `?x=` URL parameter:

1. **Sender Mode (Default)** - No URL parameters present
   - User selects a file via `<input type="file">`
   - `fileTransfer.offer()` creates a magnet URI for the file
   - Magnet URI + encryption password are base64-encoded into URL parameter `?x=`
   - Sender page must remain open for transfer (acts as seeder)

2. **Receiver Mode** - `?x=` parameter present
   - URL parameter decoded to extract magnet URI and encryption password
   - `fileTransfer.download()` called automatically on page load
   - File downloaded directly via P2P and saved to browser downloads

### Key Technical Components

- **Single File Application**: All logic in `app.js` (no framework, no modules beyond entry point)
- **Mode Detection**: `new URLSearchParams(window.location.search).get('x')` determines mode
- **Link Encoding**: `JSON.stringify({magnet, key})` → `btoa()` → URL parameter
- **Transfer Library**: `secure-file-transfer` provides `fileTransfer.offer()` and `fileTransfer.download()`
- **Debug Console**: Custom `DebugLogger` class logs all P2P events to on-page console

### Build System

- **Bundler**: Vite with extensive Node.js polyfills for browser compatibility
- **Critical Config**: `vite.config.js` includes polyfills for `buffer`, `stream`, `process`, `util` (required by secure-file-transfer)
- **Output**: Static files in `dist/` directory
- **Deployment**: GitHub Actions deploys to GitHub Pages on push to `master`

## Development Commands

- `npm install` - Install dependencies
- `npm run dev` - Start Vite dev server (localhost:5173)
- `npm run build` - Build for production (output: `dist/`)
- `npm run preview` - Preview production build locally

## Development Guidelines

### Testing P2P Functionality

P2P transfers require two browser instances:
1. Open sender in one browser/tab: `http://localhost:5173`
2. Select file to generate link
3. Open generated link in different browser/tab (or incognito)
4. Keep both tabs open during transfer

### Common Pitfalls

- **Node.js Polyfills**: If `secure-file-transfer` breaks, check that all polyfills in `vite.config.js` are properly configured
- **Transfer Reliability**: WebRTC connections can be flaky; the debug console is essential for troubleshooting
- **Browser Compatibility**: Not all browsers support WebRTC equally; test in Chrome/Firefox

### UI/UX Requirements

- Dark mode styling (see `style.css`)
- Clear mode-specific instructions in `index.html`
- Debug console always visible at bottom with verbose P2P logs
- Graceful error handling for connection failures
