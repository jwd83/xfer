# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

**xfer** is a peer-to-peer file transfer web application that enables direct file sharing between users without uploading to a server. The application uses WebRTC for P2P connections via the [secure-file-transfer](https://github.com/jeremyckahn/secure-file-transfer) library.

## Architecture

### Two-Mode System

The application operates in two distinct modes based on URL parameters:

1. **Sender Mode (Default)**
   - User selects a file from their local filesystem
   - System generates a unique shareable link containing connection parameters
   - Establishes P2P connection when receiver arrives
   - Streams file directly to receiver

2. **Receiver Mode (Link-based)**
   - User arrives with a unique link from sender
   - Extracts connection parameters from URL
   - Establishes P2P connection with sender
   - Downloads file directly via P2P transfer

### Key Technical Components

- **P2P Connection Layer**: Uses secure-file-transfer library for WebRTC-based transfers
- **Link Generation**: Encodes connection parameters in URL for receiver mode
- **File Transfer State**: Manages sender/receiver coordination and transfer progress
- **Debug Console**: Verbose logging component for P2P connection troubleshooting

## Development Commands

- `npm run dev` - Start Vite development server (handles module bundling)
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Development Guidelines

### UI/UX Requirements

- Dark mode styling throughout
- Simple, clear instructions for both modes
- Debugging console at bottom of page with verbose P2P logs
- Handle unreliable connections gracefully with appropriate user feedback

### State Management

The application state should clearly distinguish between sender and receiver modes. Connection state, transfer progress, and error handling must be managed separately for each mode.

### Testing Considerations

P2P functionality requires two clients for integration testing. Consider:
- Testing sender mode UI and link generation independently
- Testing receiver mode URL parsing independently
- Manual or automated multi-client testing for actual P2P transfers
- Error scenarios: connection failures, timeouts, network interruptions
