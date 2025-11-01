# xfer

**Simple, secure, peer-to-peer file transfers in your browser.**

[**Try it now →**](https://xfer.jwd.me)

## What is it?

xfer lets you send files directly from one browser to another without uploading to any server. Files are encrypted end-to-end and transferred peer-to-peer using WebRTC.

## Features

- 🚀 **Zero server costs** - Files transfer directly between browsers
- 🔒 **End-to-end encrypted** - Files are encrypted before transmission
- 💰 **Completely free** - No accounts, no limits, no ads
- 📦 **Large file support** - Limited only by browser storage (typically several GB)
- 🌐 **No installation** - Works entirely in the browser
- 🔗 **Simple sharing** - Just share a link

## How it works

1. **Sender** selects a file and gets a shareable link
2. **Receiver** opens the link to start the download
3. Files transfer **directly** between browsers via WebTorrent/WebRTC
4. Both users keep their pages open during transfer

## Technology

Built with:
- [secure-file-transfer](https://github.com/jeremyckahn/secure-file-transfer) - P2P file transfer library
- [WebTorrent](https://webtorrent.io/) - Streaming torrent client for browsers
- [wormhole-crypto](https://github.com/SocketDev/wormhole-crypto) - End-to-end encryption
- Public WebTorrent trackers for peer discovery

## Development

```bash
npm install
npm run dev       # Start dev server
npm run build     # Build for production
```

## License

MIT
