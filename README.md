# 🔗 P2P File Share

A lightweight, privacy-focused peer-to-peer file sharing application built with WebRTC. Transfer files directly between browsers with no uploads, no storage, and complete privacy.

## ✨ Features

- **Direct P2P Transfer**: Files are transferred directly between browsers using WebRTC
- **Zero Server Storage**: No file data ever touches a server - only signaling messages
- **Privacy First**: Your files remain completely private during transfer
- **Simple Sharing**: Share a link to instantly connect and transfer files
- **Real-time Progress**: See transfer progress with a clean UI
- **No Installation**: Works entirely in the browser

## 🏗️ Architecture

### Frontend (GitHub Pages)
The static frontend is hosted on GitHub Pages and handles:
- File selection and UI
- WebRTC peer connection setup
- File transfer via RTCDataChannel
- Progress tracking

### Backend (Deno Deploy)
A minimal WebSocket signaling relay hosted on Deno Deploy:
- Relays WebRTC signaling messages (SDP offers/answers, ICE candidates)
- No file data passes through the server
- Ephemeral - no data stored after connections close

## 🚀 Deployment

### GitHub Pages Deployment

GitHub Pages deployment is straightforward and automated via GitHub Actions.

#### Setup Steps:

1. **Enable GitHub Pages**:
   - Go to your repository settings
   - Navigate to **Pages** section
   - Under **Build and deployment**, select **GitHub Actions** as the source

2. **Push to Main Branch**:
   ```bash
   git add .
   git commit -m "Initial deployment"
   git push origin main
   ```

3. **Automatic Deployment**:
   - The workflow in `.github/workflows/deploy-pages.yml` will automatically trigger
   - Your frontend will be deployed to `https://<username>.github.io/<repository-name>/`

That's it! The GitHub Pages deployment is fully automated.

---

### Deno Deploy Deployment (Detailed Guide)

Deno Deploy hosts the WebSocket signaling server. This guide walks through the complete setup process.

#### Prerequisites:

1. A [Deno Deploy](https://deno.com/deploy) account (free tier available)
2. Your repository pushed to GitHub

#### Step-by-Step Deployment:

##### 1. Create a Deno Deploy Project

1. Go to [https://dash.deno.com/projects](https://dash.deno.com/projects)
2. Click **"New Project"**
3. You'll be presented with options to link a GitHub repository or deploy manually

##### 2. Link Your GitHub Repository

**Option A: Automatic GitHub Integration (Recommended)**

1. Click **"Deploy from GitHub"**
2. Authorize Deno Deploy to access your GitHub account
3. Select your repository from the list
4. Configure the deployment:
   - **Project Name**: Choose a name (e.g., `p2p-file-share-signaling`)
   - **Production Branch**: `main`
   - **Entrypoint**: `deno/server.js`
   - **Install Step**: Leave empty (no build needed)
5. Click **"Link"**

**Option B: Manual Deployment with GitHub Actions**

If you prefer GitHub Actions to handle deployment:

1. In Deno Deploy dashboard, create a new **"Empty Project"**
2. Note your **Project Name** (you'll need this)
3. Generate an **Access Token**:
   - Go to [Account Settings → Access Tokens](https://dash.deno.com/account#access-tokens)
   - Click **"New Access Token"**
   - Give it a name (e.g., "GitHub Actions Deploy")
   - Copy the token (you'll only see it once!)

4. Add the token to GitHub Secrets:
   - Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions**
   - Click **"New repository secret"**
   - Name: `DENO_DEPLOY_TOKEN`
   - Value: Paste the token from step 3

5. Update `.github/workflows/deploy-deno.yml`:
   - Replace `"your-project-name"` with your actual Deno Deploy project name (line 27)

6. Push your changes:
   ```bash
   git add .github/workflows/deploy-deno.yml
   git commit -m "Configure Deno Deploy"
   git push origin main
   ```

##### 3. Verify Deployment

1. In the Deno Deploy dashboard, click on your project
2. You should see a deployment in progress or completed
3. Your signaling server URL will be: `https://<your-project-name>.deno.dev`
4. Test the WebSocket connection:
   ```bash
   curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" \
        -H "Sec-WebSocket-Version: 13" -H "Sec-WebSocket-Key: test" \
        "https://<your-project-name>.deno.dev?id=test"
   ```
   You should see a `101 Switching Protocols` response if successful.

##### 4. Configure Frontend

Update `public/app.js` to point to your Deno Deploy URL:

```javascript
// Line 3 in public/app.js
const SIGNALING_SERVER = 'wss://xfer.jwd83.deno.dev';
```

Replace with your actual Deno Deploy project URL.

**Important**: Use `wss://` (not `https://`) for WebSocket connections.

##### 5. Commit and Deploy Frontend

```bash
git add public/app.js
git commit -m "Update signaling server URL"
git push origin main
```

This will trigger both deployments:
- Frontend to GitHub Pages
- Signaling server to Deno Deploy (if using GitHub Actions)

#### Deployment Options Comparison

| Method | Pros | Cons |
|--------|------|------|
| **GitHub Integration** | • Simpler setup<br>• Direct GitHub integration<br>• Automatic deployments | • Requires GitHub OAuth |
| **GitHub Actions** | • More control<br>• Works with private repos<br>• Can add custom steps | • Requires access token setup<br>• More configuration |

#### Monitoring and Logs

1. **View Logs**:
   - Go to your project in Deno Deploy dashboard
   - Click on **"Logs"** tab
   - See real-time WebSocket connections and errors

2. **View Metrics**:
   - Click on **"Metrics"** tab
   - Monitor request counts, response times, and errors

3. **Deployments**:
   - Click on **"Deployments"** tab
   - See deployment history and rollback if needed

#### Troubleshooting Deno Deploy

**Issue: Deployment fails with "Entry point not found"**
- **Solution**: Ensure the entrypoint path is `deno/server.js` (relative to repository root)

**Issue: WebSocket connections fail**
- **Solution**: Verify you're using `wss://` (not `ws://`) in production
- Check browser console for CORS or connection errors
- Verify the server is deployed and accessible

**Issue: "Failed to upgrade WebSocket"**
- **Solution**: Check Deno Deploy logs for errors
- Ensure you're passing the `?id=<session-id>` parameter

**Issue: GitHub Actions deployment fails**
- **Solution**: Verify `DENO_DEPLOY_TOKEN` is correctly set in GitHub Secrets
- Confirm project name matches in `.github/workflows/deploy-deno.yml`
- Check Actions logs for specific error messages

#### Environment Variables (Optional)

To use environment variables in Deno Deploy:

1. Go to your project → **Settings** → **Environment Variables**
2. Add variables (e.g., `ALLOWED_ORIGINS` for CORS)
3. Access in `deno/server.js`:
   ```javascript
   const allowedOrigins = Deno.env.get("ALLOWED_ORIGINS");
   ```

#### Custom Domains (Optional)

To use a custom domain:

1. Go to your project → **Settings** → **Domains**
2. Click **"Add Domain"**
3. Follow DNS configuration instructions
4. Update `SIGNALING_SERVER` in `public/app.js` to use your custom domain

---

## 🧪 Testing Locally

### Test the Frontend Locally

```bash
# Serve the public directory with any static file server
npx serve public

# Or use Python
python -m http.server 8000 --directory public
```

Visit `http://localhost:8000`

### Test the Signaling Server Locally

```bash
# Install Deno if you haven't already
# Visit https://deno.land/#installation

# Run the server
deno run --allow-net deno/server.js
```

The server will start on `http://localhost:8000`

Update `public/app.js` to use local server:
```javascript
const SIGNALING_SERVER = 'ws://localhost:8000';
```

### Test End-to-End

1. Open two browser windows/tabs
2. In the first window, select a file and copy the share link
3. Paste the link in the second window
4. The file transfer should begin automatically

---

## 📁 Project Structure

```
p2p-share/
│
├── public/                     # Frontend (GitHub Pages)
│   ├── index.html             # Main UI
│   ├── style.css              # Styling
│   └── app.js                 # WebRTC logic
│
├── deno/                       # Backend (Deno Deploy)
│   └── server.js              # WebSocket signaling relay
│
├── .github/
│   └── workflows/
│       ├── deploy-pages.yml   # GitHub Pages deployment
│       └── deploy-deno.yml    # Deno Deploy deployment
│
├── plan.md                     # Original project plan
└── README.md                   # This file
```

---

## 🔧 Configuration

### Update Signaling Server URL

Edit `public/app.js` line 3:
```javascript
const SIGNALING_SERVER = 'wss://xfer.jwd83.deno.dev';
```

### Adjust Chunk Size

Edit `public/app.js` line 5 to change transfer chunk size:
```javascript
const CHUNK_SIZE = 16384; // 16KB chunks
```

Larger chunks = faster transfers but may cause issues with large files.

---

## 🔐 Security & Privacy

- **End-to-End**: Files are transferred directly between peers
- **No Server Storage**: The signaling server only relays WebRTC messages
- **Temporary Sessions**: Session IDs are ephemeral and deleted after disconnect
- **No Logging**: No file metadata or transfer data is logged
- **STUN Only**: Uses public STUN servers for NAT traversal (no TURN relay)

**Note**: While file data doesn't touch the server, WebRTC metadata and signaling messages do. For maximum privacy, consider:
- Encrypting files before sharing
- Running your own STUN server
- Using a VPN

---

## 🚧 Limitations

- **NAT Traversal**: May fail in some restrictive network environments (would need TURN server)
- **File Size**: Browser memory limitations apply (tested up to 2GB)
- **Browser Support**: Requires modern browsers with WebRTC support
- **Connection Time**: Peer must be online when you share the link

---

## 🛠️ Future Enhancements

Potential v2 features:
- Multiple file transfers
- QR code generation for links
- End-to-end encryption with key exchange
- Drag-and-drop file upload
- Connection status animations
- TURN server support for restricted networks
- Mobile app (React Native/Flutter)

---

## 📄 License

MIT License - feel free to use this project for any purpose.

---

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request.

---

## 📞 Support

For issues or questions:
- Check the [Troubleshooting](#troubleshooting-deno-deploy) section
- Review Deno Deploy logs in the dashboard
- Open a GitHub issue

---

## 🙏 Acknowledgments

- **WebRTC** for peer-to-peer technology
- **Deno Deploy** for serverless WebSocket hosting
- **GitHub Pages** for static site hosting
- **STUN servers** provided by Google
