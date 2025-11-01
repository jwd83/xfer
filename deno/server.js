// Deno Deploy-compatible WebSocket signaling relay for P2P file sharing
// No file data passes through this server - only WebRTC signaling messages
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const peers = new Map(); // session_id -> Set of WebSockets

serve((req) => {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

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
    };

    socket.onmessage = (e) => {
      // Relay message to all other peers in the same session
      const sessionPeers = peers.get(id);
      if (sessionPeers) {
        for (const peer of sessionPeers) {
          if (peer !== socket && peer.readyState === WebSocket.OPEN) {
            peer.send(e.data);
          }
        }
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
