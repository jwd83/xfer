// Deno Deploy-compatible WebSocket signaling relay for P2P file sharing
// No file data passes through this server - only WebRTC signaling messages

const peers = new Map(); // session_id -> Set of WebSockets

Deno.serve((req) => {
  const upgrade = req.headers.get("upgrade") || "";
  
  // Check if this is a WebSocket upgrade request
  if (upgrade.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket connection", { status: 426 });
  }

  const url = new URL(req.url);
  const id = url.searchParams.get("id");

  if (!id) {
    return new Response("Missing session ID parameter", { status: 400 });
  }

  try {
    const { socket, response } = Deno.upgradeWebSocket(req);

    socket.onopen = () => {
      if (!peers.has(id)) {
        peers.set(id, new Set());
      }
      peers.get(id).add(socket);
      console.log(`Peer joined session: ${id}`);
      
      // Notify other peers that a new peer joined
      const sessionPeers = peers.get(id);
      const notification = JSON.stringify({ type: 'peer-joined' });
      for (const peer of sessionPeers) {
        if (peer !== socket && peer.readyState === WebSocket.OPEN) {
          peer.send(notification);
        }
      }
    };

    socket.onmessage = (e) => {
      console.log(`Message in session ${id}:`, e.data);
      // Relay message to all other peers in the same session
      const sessionPeers = peers.get(id);
      console.log(`Session has ${sessionPeers?.size || 0} peers`);
      if (sessionPeers) {
        let relayed = 0;
        for (const peer of sessionPeers) {
          if (peer !== socket && peer.readyState === WebSocket.OPEN) {
            peer.send(e.data);
            relayed++;
          }
        }
        console.log(`Relayed to ${relayed} peer(s)`);
      }
    };

    socket.onclose = () => {
      const sessionPeers = peers.get(id);
      if (sessionPeers) {
        sessionPeers.delete(socket);
        if (sessionPeers.size === 0) {
          peers.delete(id);
          console.log(`Session closed: ${id}`);
        }
      }
    };

    socket.onerror = (err) => {
      console.error(`WebSocket error in session ${id}:`, err);
    };

    return response;
  } catch (err) {
    console.error("Failed to upgrade WebSocket:", err);
    return new Response("WebSocket upgrade failed", { status: 500 });
  }
});
