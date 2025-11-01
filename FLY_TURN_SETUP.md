# Fly.io Free TURN Server Setup

## Why Fly.io?
- Free tier: 3 shared VMs, 160GB bandwidth/month
- Supports UDP (required for TURN)
- Easy deployment via CLI
- Actually works unlike Railway

---

## Step 1: Install flyctl

**Windows (PowerShell):**
```powershell
iwr https://fly.io/install.ps1 -useb | iex
```

**Or download from:** https://fly.io/docs/hands-on/install-flyctl/

---

## Step 2: Sign Up & Login

```bash
flyctl auth signup
# OR if you have an account
flyctl auth login
```

---

## Step 3: Create TURN Server Files

Create a new directory for the TURN server:

```bash
mkdir turn-server
cd turn-server
```

### Create `Dockerfile`:

```dockerfile
FROM coturn/coturn:latest

# Copy config
COPY turnserver.conf /etc/coturn/turnserver.conf

# Expose ports
EXPOSE 3478/tcp
EXPOSE 3478/udp
EXPOSE 49152-65535/udp

CMD ["-c", "/etc/coturn/turnserver.conf"]
```

### Create `turnserver.conf`:

```conf
listening-port=3478
fingerprint
lt-cred-mech
use-auth-secret
static-auth-secret=REPLACE_WITH_RANDOM_SECRET
realm=turn
verbose
no-multicast-peers
no-loopback-peers
no-tls
no-dtls
```

**Generate a secret:**
```bash
openssl rand -hex 32
```
Replace `REPLACE_WITH_RANDOM_SECRET` with the output.

### Create `fly.toml`:

```toml
app = "xfer-turn"

[build]
  dockerfile = "Dockerfile"

[env]
  PORT = "3478"

[[services]]
  internal_port = 3478
  protocol = "udp"

  [[services.ports]]
    port = 3478

[[services]]
  internal_port = 3478
  protocol = "tcp"

  [[services.ports]]
    port = 3478
```

---

## Step 4: Deploy

```bash
flyctl launch --no-deploy
flyctl deploy
```

Get your app's IP:
```bash
flyctl ips list
```

---

## Step 5: Update Your App

Edit `public/app.js`:

```javascript
const ICE_SERVERS = [
    { urls: 'stun:stun.l.google.com:19302' },
    {
        urls: [
            'turn:YOUR_FLY_IP:3478?transport=udp',
            'turn:YOUR_FLY_IP:3478?transport=tcp'
        ],
        username: 'user',
        credential: 'YOUR_SECRET'
    }
];
```

---

## Cost

**Free tier includes:**
- 3 shared-cpu VMs (256MB RAM each)
- 160GB outbound bandwidth/month
- Should be enough for moderate personal use

**If you exceed free tier:**
- ~$2-5/month depending on usage
- Still way cheaper than most alternatives

---

## Troubleshooting

Check logs:
```bash
flyctl logs
```

Check if TURN is responding:
```bash
flyctl ssh console
nc -u -v localhost 3478
```
