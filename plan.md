# xfer - a Secure File Transfer Prototype

## Goal
Create a minimal, reliable, and secure browser-based peer-to-peer file transfer prototype using **secure-file-transfer** (Jeremy Kahn). Deliverables: a working demo (send/receive UI), README, and an automated test checklist.

## Assumptions
- Both peers use modern browsers (Chrome, Firefox, Edge, Safari recent versions).
- You prefer to avoid running your own STUN/TURN servers. We'll rely on the library's default discovery/relay arrangements and public trackers where necessary.
- Files will be single-file transfers (no multi-user swarm initially).

## Milestones (1–2 day targets each)

### Milestone 1 — Environment & research (1 day)
- Read the secure-file-transfer README and inspect the repo.
- Clone repo locally.
- Identify any external dependencies (trackers, bootstrap servers) the lib uses.
- Create a tiny test matrix describing networks to trial (same LAN, different Wi‑Fi, mobile data).

### Milestone 2 — Minimal demo (1–2 days)
- Build a minimal static page (`index.html`) with:
  - File input for sender
  - A text area to display or paste a transfer link / code for receiver
  - A progress bar and simple logs
- Integrate the secure-file-transfer library via npm or direct bundle (follow repo quickstart).
- Implement a ‘Send’ flow and a ‘Receive’ flow.

### Milestone 3 — Testing & diagnostics (1–2 days)
- Test transfers across the test matrix.
- Log connection types and failure modes (failed to connect, stalls, partial transfers).
- Verify encryption: confirm only recipient who has key can decrypt.
- Add automatic retries and chunked transfer logging.

### Milestone 4 — UX polish & resilience (1–2 days)
- Add UI to show transfer key/passphrase and copy-to-clipboard.
- Add resume support if library supports it, or show clear progress + cancel.
- Add clear error messages (NAT blocked, peer unreachable).

### Milestone 5 — Deployment & README (1 day)
- Package as static site deployable to GitHub Pages.
- Write README with testing notes, known limitations, and privacy/security notes.

## Quickstart (developer steps)
1. Install Node.js (v16+) and npm.
2. Clone the repo:

```bash
git clone https://github.com/jeremyckahn/secure-file-transfer.git
cd secure-file-transfer
npm install
```

3. Start a dev server (or use `serve` for static):

```bash
npm run dev
# or
npx serve .
```

4. Open `index.html` in two different browsers/devices and try sending a file.

## Example skeleton (index.html + JS)
- Create a single-page UI with `file` input + `send` button and a `paste code` field for receiver.
- Use the library's API to create sender and generate a short transfer code or link.
- On receiver, paste the code / link and call the receive API to accept the file.

(Specific code snippets belong in the repo README — implement once you’ve confirmed package imports and API surface from the repo.)

## Testing checklist
- [ ] Send 5MB file across same LAN (success)
- [ ] Send 50MB file across two different networks (Wi‑Fi -> mobile) (success/fail recorded)
- [ ] Transfer between Chrome and Firefox (success)
- [ ] Confirm file integrity via checksum (sha256)
- [ ] Confirm encryption key required to decrypt
- [ ] Try edge cases: cancel mid-send, resume (if supported), simultaneous transfers

## Diagnostics & troubleshooting
- If transfers fail repeatedly between networks, note NAT type and try:
  - Use different network (cellular hotspot)
  - Use a public STUN server (for tests) — e.g. Google STUN (`stun:stun.l.google.com:19302`) to see if it helps
- Capture browser console logs and copy WebRTC stats (if accessible) to help debug.

## Security & privacy notes
- Always treat the generated transfer token/key as sensitive; if the link contains the decryption key, warn users.
- Prefer explicit out-of-band key exchange (e.g., send passphrase separately) for high-sensitivity files.
- Do not store unencrypted files on any server.

## Deployment notes
- GitHub Pages is sufficient: this is a static single-page app.
- If you later need better reliability, add a small signalling server (WebSocket) and optionally a TURN server.
- For production, consider using a paid TURN provider or self-hosting coturn if reliability across restrictive NATs is required.

## Next steps (after MVP)
1. Add resumable transfers and large-file streaming.
2. Add optional cloud relay fallback (user opt-in) for reliability.
3. Add code signing and packaged releases (Electron) for native apps.
4. Add end-to-end encrypted metadata and UX for secure key exchange.

---

### Files to include in repo
- `index.html` — demo UI
- `app.js` — integration code with secure-file-transfer
- `README.md` — instructions and testing notes
- `LICENSE` — pick appropriate license
- `.github/workflows/ci.yml` — optional: run basic tests on push

---

Good luck — once you confirm, I can generate a ready-to-download `plan.md` file packaged for you to download (Markdown file).
