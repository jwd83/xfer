# P2P File Share MVP — Updated Plan (GitHub Pages + Deno Deploy)

## overview
a lightweight p2p file sharing app built with webRTC.
the app lets a user select a file and send a share link to a friend.
the link connects the two browsers directly for file transfer — no file data ever touches a server.

frontend is hosted on **github pages** (static),
and a tiny **signaling relay** (no file data) is hosted on **deno deploy** from the same repo.

---

## goals
- simple, privacy-focused file transfer
- one-click deployment: github pages + deno deploy
- fully client-side file handling
- minimal server (signaling only, no storage or logging)
- clean and responsive UI

---

## architecture overview
### frontend (github pages)
- serves static assets: `index.html`, `style.css`, `app.js`
- handles:
  - file selection
  - webRTC setup (STUN + signaling connection)
  - UI and progress updates
  - file sending/receiving over RTCDataChannel

### backend (deno deploy)
- minimal websocket relay service for signaling
- forwards SDP offers/answers and ICE candidates between peers
- ephemeral: no data stored, no logs

### network components
- **STUN**: `stun:stun.l.google.com:19302` (public)
- **Signaling**: custom websocket relay on Deno Deploy
- **Data transfer**: direct browser-to-browser via RTCDataChannel

---

## connection flow
1. **sender opens app**
   - chooses file → app generates UUID session ID
   - creates a share link (`/share/<uuid>`)
   - opens WebSocket connection to signaling server
   - creates WebRTC offer and sends to server with the session ID

2. **receiver opens link**
   - connects to same signaling server with session ID
   - receives offer → creates answer → sends it back
   - signaling server relays messages between the two

3. **p2p connection established**
   - both browsers connect directly (via STUN-assisted NAT traversal)
   - file transferred via RTCDataChannel in chunks

4. **after transfer**
   - peers disconnect
   - signaling session closed
   - no persistent data remains anywhere

---

## repository layout
```
p2p-share/
│
├── public/                     # frontend (github pages)
│   ├── index.html
│   ├── style.css
│   └── app.js
│
├── deno/                       # backend (deno deploy)
│   └── server.js
│
├── .github/
│   └── workflows/
│       ├── deploy-pages.yml    # builds + deploys frontend to github pages
│       └── deploy-deno.yml     # deploys websocket relay to deno deploy
│
├── package.json                # optional tooling
└── README.md
```

---

## signaling server (deno/server.js)
```js
// deno deploy-compatible signaling relay
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const peers = new Map(); // session_id -> Set of WebSockets

serve((req) => {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  const { socket, response } = Deno.upgradeWebSocket(req);
  if (!id) return new Response("missing id", { status: 400 });

  socket.onopen = () => {
    if (!peers.has(id)) peers.set(id, new Set());
    peers.get(id).add(socket);
  };

  socket.onmessage = (e) => {
    for (const peer of peers.get(id) ?? [])
      if (peer !== socket) peer.send(e.data);
  };

  socket.onclose = () => {
    peers.get(id)?.delete(socket);
    if (peers.get(id)?.size === 0) peers.delete(id);
  };

  return response;
});
```

this service:
- accepts websocket connections with `?id=<session>`
- relays all messages between sockets with the same id
- never stores any data after both peers disconnect

---

## github pages deployment
- enable github pages → serve from `/public`
- optional: add GitHub Action for automatic deployment

---

## deno deploy deployment
- connect repo to deno deploy dashboard
- set entrypoint: `deno/server.js`
- auto-deploy on push to `main`

---

## mvp checklist
- [ ] webRTC setup with google STUN server
- [ ] deno websocket signaling relay working
- [ ] frontend can generate + share uuid links
- [ ] successful file transfer between peers
- [ ] simple ui and progress indicator
- [ ] deploy workflows to github + deno

---

## optional v2 ideas
- multiple file transfers
- qr code for link sharing
- encrypted connections (e2e key exchange)
- drag-and-drop upload
- nicer connection animations

---

## summary
this configuration gives:
- full github pages hosting for static assets
- deno deploy for signaling relay
- no file storage, logs, or personal data
- a fast, serverless-style p2p experience.
