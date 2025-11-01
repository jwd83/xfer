# TURN Server Setup for Cross-Network File Transfers

## Current Status
The app works on the same network but fails across different networks because free TURN servers are unreliable.

## Why You Need TURN
- **STUN** (current): Helps peers discover their public IP - works on same network or permissive NATs
- **TURN** (needed): Relays traffic when direct connection fails - required for most cross-network scenarios

## Option 1: Deploy Your Own TURN Server (Recommended)

### Requirements
- A VPS with a public IP (DigitalOcean, AWS, etc.)
- Ubuntu/Debian recommended
- Open ports: 3478 (UDP/TCP), 49152-65535 (UDP)

### Steps

1. **Install coTURN:**
```bash
sudo apt update
sudo apt install coturn -y
```

2. **Configure `/etc/turnserver.conf`:**
```conf
listening-port=3478
fingerprint
lt-cred-mech
use-auth-secret
static-auth-secret=YOUR_SECRET_KEY_HERE
realm=yourdomain.com
total-quota=100
bps-capacity=0
stale-nonce
no-loopback-peers
no-multicast-peers
```

3. **Enable and start:**
```bash
sudo systemctl enable coturn
sudo systemctl start coturn
```

4. **Update `public/app.js`:**
```javascript
const ICE_SERVERS = [
    { urls: 'stun:stun.l.google.com:19302' },
    {
        urls: [
            'turn:your-server-ip:3478?transport=udp',
            'turn:your-server-ip:3478?transport=tcp'
        ],
        username: 'user',
        credential: 'YOUR_SECRET_KEY_HERE'
    }
];
```

## Option 2: Twilio TURN (Paid)

1. Sign up at https://www.twilio.com/stun-turn
2. Get your credentials
3. Update `public/app.js` with Twilio's ICE servers

## Option 3: Accept Limitations

The current setup works for:
- ✅ Same network (WiFi/LAN)
- ✅ Some permissive NAT configurations
- ❌ Restrictive NATs/firewalls

## Testing

After setting up TURN, you should see in the console:
```
ICE candidate type: relay | Protocol: udp
```

If you only see `host` and `srflx`, TURN isn't working.
