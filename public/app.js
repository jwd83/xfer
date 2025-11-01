// P2P File Share - WebRTC Client
// Version: 2025-11-01-v9
// Configuration - update this with your Deno Deploy URL
const VERSION = '2025-11-01-v9';
const SIGNALING_SERVER = 'wss://xfer.jwd83.deno.net';
const ICE_SERVERS = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' }
];
const CHUNK_SIZE = 16384; // 16KB chunks for data channel


// State
let peerConnection = null;
let dataChannel = null;
let signalingSocket = null;
let selectedFile = null;
let sessionId = null;
let isSender = false;
let receivedChunks = [];
let receivedSize = 0;
let totalSize = 0;
let iceCandidateQueue = [];

// DOM Elements
const fileInput = document.getElementById('file-input');
const selectFileBtn = document.getElementById('select-file-btn');
const fileSelected = document.getElementById('file-selected');
const fileName = document.getElementById('file-name');
const fileSize = document.getElementById('file-size');
const shareLinkSection = document.getElementById('share-link-section');
const shareLink = document.getElementById('share-link');
const copyLinkBtn = document.getElementById('copy-link-btn');
const waitingSection = document.getElementById('waiting-section');
const sendMode = document.getElementById('send-mode');
const receiveMode = document.getElementById('receive-mode');
const receiveInfo = document.getElementById('receive-info');
const receiveFileName = document.getElementById('receive-file-name');
const receiveFileSize = document.getElementById('receive-file-size');
const transferSection = document.getElementById('transfer-section');
const transferStatus = document.getElementById('transfer-status');
const progressFill = document.getElementById('progress-fill');
const progressPercent = document.getElementById('progress-percent');
const progressBytes = document.getElementById('progress-bytes');
const completeSection = document.getElementById('complete-section');
const errorSection = document.getElementById('error-section');
const errorMessage = document.getElementById('error-message');
const resetBtn = document.getElementById('reset-btn');
const retryBtn = document.getElementById('retry-btn');

// Initialize
function init() {
    console.log('🚀 P2P File Share -', VERSION);
    
    // Check if we're receiving a file (has session ID in URL)
    const urlParams = new URLSearchParams(window.location.search);
    sessionId = urlParams.get('id');

    if (sessionId) {
        // Receiver mode
        console.log('📥 RECEIVER MODE');
        isSender = false;
        sendMode.classList.add('hidden');
        receiveMode.classList.remove('hidden');
        initReceiver();
    } else {
        // Sender mode
        console.log('📤 SENDER MODE');
        isSender = true;
        sessionId = generateSessionId();
        setupSenderUI();
    }
}

// Generate random session ID
function generateSessionId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Setup sender UI
function setupSenderUI() {
    selectFileBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelect);
    copyLinkBtn.addEventListener('click', copyShareLink);
    resetBtn.addEventListener('click', () => location.reload());
    retryBtn.addEventListener('click', () => location.reload());
}

// Handle file selection
function handleFileSelect(e) {
    selectedFile = e.target.files[0];
    if (!selectedFile) return;

    fileName.textContent = selectedFile.name;
    fileSize.textContent = formatBytes(selectedFile.size);
    fileSelected.classList.remove('hidden');
    
    // Show share link
    const url = `${window.location.origin}${window.location.pathname}?id=${sessionId}`;
    shareLink.value = url;
    shareLinkSection.classList.remove('hidden');
    waitingSection.classList.remove('hidden');

    // Initialize sender connection
    initSender();
}

// Copy share link to clipboard
function copyShareLink() {
    shareLink.select();
    navigator.clipboard.writeText(shareLink.value);
    copyLinkBtn.textContent = 'Copied!';
    setTimeout(() => {
        copyLinkBtn.textContent = 'Copy';
    }, 2000);
}

// Initialize sender
async function initSender() {
    try {
        await connectSignaling();
        // Wait for peer-joined event before creating connection
    } catch (err) {
        showError(`Failed to initialize: ${err.message}`);
    }
}

// Initialize receiver
async function initReceiver() {
    try {
        await connectSignaling();
        // Receiver waits for offer before setting up peer connection
    } catch (err) {
        showError(`Failed to connect: ${err.message}`);
    }
}

// Connect to signaling server
function connectSignaling() {
    return new Promise((resolve, reject) => {
        const wsUrl = `${SIGNALING_SERVER}?id=${sessionId}`;
        signalingSocket = new WebSocket(wsUrl);

        signalingSocket.onopen = () => {
            resolve();
        };

        signalingSocket.onmessage = async (event) => {
            const message = JSON.parse(event.data);
            console.log('⬇️ Received signaling:', message.type);
            await handleSignalingMessage(message);
        };

        signalingSocket.onerror = (err) => {
            reject(new Error('Signaling connection failed'));
        };

        signalingSocket.onclose = () => {};
        
    });
}

// Send signaling message
function sendSignalingMessage(message) {
    if (signalingSocket && signalingSocket.readyState === WebSocket.OPEN) {
        console.log('⬆️ Sending signaling:', message.type);
        signalingSocket.send(JSON.stringify(message));
    } else {
        console.error('❌ Cannot send', message.type, '- socket not open');
    }
}

// Handle signaling messages
async function handleSignalingMessage(message) {
    switch (message.type) {
        case 'peer-joined':
            await handlePeerJoined();
            break;
        case 'offer':
            await handleOffer(message.offer);
            break;
        case 'answer':
            await handleAnswer(message.answer);
            break;
        case 'ice-candidate':
            await handleIceCandidate(message.candidate);
            break;
    }
}

// Handle peer joined notification
async function handlePeerJoined() {
    if (isSender && !peerConnection) {
        await setupPeerConnection(true);
    }
}

// Setup WebRTC peer connection
async function setupPeerConnection(createOffer) {
    peerConnection = new RTCPeerConnection({
        iceServers: ICE_SERVERS,
        iceTransportPolicy: 'all',
        iceCandidatePoolSize: 10,
        bundlePolicy: 'max-bundle',
        rtcpMuxPolicy: 'require'
    });

    // ICE candidate handling
    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            console.log('ICE candidate type:', event.candidate.type, '| Protocol:', event.candidate.protocol);
            sendSignalingMessage({
                type: 'ice-candidate',
                candidate: event.candidate
            });
        } else {
            console.log('ICE gathering complete');
        }
    };

    // Connection state changes
    peerConnection.onconnectionstatechange = () => {
        console.log('Connection state:', peerConnection.connectionState);
        if (peerConnection.connectionState === 'failed') {
            showError('Connection failed. Please try again.');
        }
    };

    // ICE connection state
    peerConnection.oniceconnectionstatechange = () => {
        console.log('ICE connection state:', peerConnection.iceConnectionState);
        if (peerConnection.iceConnectionState === 'failed') {
            console.error('ICE connection failed - likely NAT/firewall issue');
        }
    };

    if (createOffer) {
        // Sender creates data channel
        dataChannel = peerConnection.createDataChannel('fileTransfer');
        setupDataChannel();

        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        sendSignalingMessage({ type: 'offer', offer });
    } else {
        // Receiver waits for data channel
        peerConnection.ondatachannel = (event) => {
            dataChannel = event.channel;
            setupDataChannel();
        };
    }
}

// Setup data channel
function setupDataChannel() {
    dataChannel.binaryType = 'arraybuffer';

    dataChannel.onopen = () => {
        if (isSender) {
            // Send file metadata first
            const metadata = {
                type: 'metadata',
                name: selectedFile.name,
                size: selectedFile.size,
                mimeType: selectedFile.type
            };
            dataChannel.send(JSON.stringify(metadata));
            
            // Start sending file
            sendFile();
        }
    };

    dataChannel.onmessage = (event) => {
        if (isSender) return;

        if (typeof event.data === 'string') {
            // Metadata message
            const metadata = JSON.parse(event.data);
            if (metadata.type === 'metadata') {
                handleFileMetadata(metadata);
            }
        } else {
            // File chunk
            handleFileChunk(event.data);
        }
    };

    dataChannel.onerror = (err) => {
        showError('Data channel error');
    };

    dataChannel.onclose = () => {};
}

// Handle offer (receiver)
async function handleOffer(offer) {
    // Create peer connection if it doesn't exist (receiver)
    if (!peerConnection) {
        await setupPeerConnection(false);
    }
    
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    sendSignalingMessage({ type: 'answer', answer });
}

// Handle answer (sender)
async function handleAnswer(answer) {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
}

// Handle ICE candidate
async function handleIceCandidate(candidate) {
    try {
        if (peerConnection) {
            if (peerConnection.remoteDescription) {
                await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
                // Process queued candidates
                while (iceCandidateQueue.length > 0) {
                    const queuedCandidate = iceCandidateQueue.shift();
                    await peerConnection.addIceCandidate(new RTCIceCandidate(queuedCandidate));
                }
            } else {
                // Queue candidate until remote description is set
                iceCandidateQueue.push(candidate);
            }
        }
    } catch (err) {
        console.error('Error adding ICE candidate:', err);
    }
}

// Send file in chunks
async function sendFile() {
    sendMode.classList.add('hidden');
    transferSection.classList.remove('hidden');
    transferStatus.textContent = 'Sending file...';

    const fileSize = selectedFile.size;
    let offset = 0;

    const reader = new FileReader();

    reader.onload = (e) => {
        if (dataChannel.readyState === 'open') {
            dataChannel.send(e.target.result);
            offset += e.target.result.byteLength;

            // Update progress
            const progress = (offset / fileSize) * 100;
            updateProgress(progress, offset, fileSize);

            if (offset < fileSize) {
                readSlice(offset);
            } else {
                // Transfer complete
                setTimeout(() => {
                    transferSection.classList.add('hidden');
                    completeSection.classList.remove('hidden');
                }, 500);
            }
        }
    };

    const readSlice = (o) => {
        const slice = selectedFile.slice(o, o + CHUNK_SIZE);
        reader.readAsArrayBuffer(slice);
    };

    readSlice(0);
}

// Handle file metadata (receiver)
function handleFileMetadata(metadata) {
    totalSize = metadata.size;
    receiveFileName.textContent = metadata.name;
    receiveFileSize.textContent = formatBytes(metadata.size);
    receiveInfo.classList.remove('hidden');
    
    // Show transfer UI
    receiveMode.classList.add('hidden');
    transferSection.classList.remove('hidden');
    transferStatus.textContent = 'Receiving file...';
}

// Handle file chunk (receiver)
function handleFileChunk(chunk) {
    receivedChunks.push(chunk);
    receivedSize += chunk.byteLength;

    // Update progress
    const progress = (receivedSize / totalSize) * 100;
    updateProgress(progress, receivedSize, totalSize);

    // Check if complete
    if (receivedSize >= totalSize) {
        completeFileTransfer();
    }
}

// Complete file transfer (receiver)
function completeFileTransfer() {
    const blob = new Blob(receivedChunks);
    const url = URL.createObjectURL(blob);
    
    // Trigger download
    const a = document.createElement('a');
    a.href = url;
    a.download = receiveFileName.textContent;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Show complete UI
    setTimeout(() => {
        transferSection.classList.add('hidden');
        completeSection.classList.remove('hidden');
    }, 500);
}

// Update progress UI
function updateProgress(percent, current, total) {
    progressFill.style.width = `${percent}%`;
    progressPercent.textContent = `${Math.round(percent)}%`;
    progressBytes.textContent = `${formatBytes(current)} / ${formatBytes(total)}`;
}

// Format bytes to human readable
function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

// Show error
function showError(message) {
    sendMode.classList.add('hidden');
    receiveMode.classList.add('hidden');
    transferSection.classList.add('hidden');
    errorSection.classList.remove('hidden');
    errorMessage.textContent = message;
}

// Start app
init();
