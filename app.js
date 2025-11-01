import { fileTransfer } from 'secure-file-transfer';

// Debug logging utility
class DebugLogger {
    constructor() {
        this.logsContainer = document.getElementById('debug-logs');
    }

    log(message, type = 'info') {
        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;
        
        const timestamp = new Date().toLocaleTimeString();
        entry.innerHTML = `<span class="log-timestamp">[${timestamp}]</span>${message}`;
        
        this.logsContainer.appendChild(entry);
        this.logsContainer.scrollTop = this.logsContainer.scrollHeight;
    }

    info(message) { this.log(message, 'info'); }
    success(message) { this.log(message, 'success'); }
    warning(message) { this.log(message, 'warning'); }
    error(message) { this.log(message, 'error'); }
    clear() { this.logsContainer.innerHTML = ''; }
}

const logger = new DebugLogger();

// Initialize clear logs button
document.getElementById('clear-logs').addEventListener('click', () => {
    logger.clear();
    logger.info('Logs cleared');
});

// Determine mode based on URL parameters
const urlParams = new URLSearchParams(window.location.search);
const transferData = urlParams.get('x');
const isReceiverMode = !!transferData;

logger.info(`Application initialized in ${isReceiverMode ? 'RECEIVER' : 'SENDER'} mode`);

if (isReceiverMode) {
    initReceiverMode();
} else {
    initSenderMode();
}

// Sender Mode Implementation
function initSenderMode() {
    document.getElementById('sender-mode').classList.remove('hidden');
    document.getElementById('receiver-mode').classList.add('hidden');
    
    logger.info('Sender mode initialized');
    
    const fileInput = document.getElementById('file-input');
    const fileName = document.getElementById('file-name');
    const linkContainer = document.getElementById('link-container');
    const transferLink = document.getElementById('transfer-link');
    const copyButton = document.getElementById('copy-button');
    const statusBox = document.getElementById('sender-status');
    
    let selectedFile = null;
    let transfer = null;
    
    fileInput.addEventListener('change', async (e) => {
        selectedFile = e.target.files[0];
        if (!selectedFile) return;
        
        fileName.textContent = selectedFile.name;
        logger.info(`File selected: ${selectedFile.name} (${formatFileSize(selectedFile.size)})`);
        
        try {
            await setupSender(selectedFile);
        } catch (error) {
            logger.error(`Failed to setup sender: ${error.message}`);
            statusBox.textContent = `Error: ${error.message}`;
            statusBox.classList.remove('hidden');
        }
    });
    
    async function setupSender(file) {
        logger.info('Setting up P2P connection as sender...');
        
        // Generate encryption password
        const password = generateId();
        logger.info('Generated encryption password');
        
        try {
            // Create magnet URI using secure-file-transfer
            statusBox.textContent = 'Generating secure transfer link...';
            statusBox.classList.remove('hidden');
            
            logger.info('Creating magnet URI...');
            const magnetUri = await fileTransfer.offer([file], password);
            logger.success('Magnet URI created successfully');
            
            // Encode magnetUri and password together in base64
            const transferData = JSON.stringify({ magnet: magnetUri, key: password });
            const encoded = btoa(transferData);
            logger.info(`Encoded transfer data (${encoded.length} chars)`);
            
            const link = `${window.location.origin}${window.location.pathname}?x=${encoded}`;
            
            transferLink.value = link;
            linkContainer.classList.remove('hidden');
            
            logger.success('Transfer link generated successfully');
            logger.info('Waiting for receiver to connect...');
            logger.warning('Keep this page open until transfer completes');
            statusBox.textContent = 'Waiting for receiver to connect...';
            
            // Note: fileTransfer.offer() doesn't provide progress callbacks
            // The transfer happens when receiver calls download()
        } catch (error) {
            logger.error(`Failed to create magnet URI: ${error.message}`);
            statusBox.textContent = `Error: ${error.message}`;
            throw error;
        }
    }
    
    copyButton.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(transferLink.value);
            copyButton.textContent = 'Copied!';
            logger.success('Link copied to clipboard');
            setTimeout(() => {
                copyButton.textContent = 'Copy';
            }, 2000);
        } catch (error) {
            logger.error('Failed to copy link to clipboard');
        }
    });
}

// Receiver Mode Implementation
function initReceiverMode() {
    document.getElementById('sender-mode').classList.add('hidden');
    document.getElementById('receiver-mode').classList.remove('hidden');
    
    logger.info('Receiver mode initialized');
    
    const statusBox = document.getElementById('receiver-status');
    const downloadContainer = document.getElementById('download-container');
    const downloadButton = document.getElementById('download-button');
    
    // Decode transfer data from URL
    let magnetUri, password;
    try {
        const decoded = atob(transferData);
        const data = JSON.parse(decoded);
        magnetUri = data.magnet;
        password = data.key;
        logger.info('Transfer data decoded successfully');
        logger.info(`Magnet URI: ${magnetUri.substring(0, 50)}...`);
    } catch (error) {
        logger.error('Failed to decode transfer data');
        statusBox.textContent = 'Error: Invalid transfer link';
        return;
    }
    
    async function startDownload() {
        try {
            logger.info('Starting download from sender...');
            statusBox.textContent = 'Connecting to sender and downloading file...';
            
            // Download file using secure-file-transfer
            // doSave: true will automatically save to disk
            await fileTransfer.download(magnetUri, password, { doSave: true });
            
            logger.success('File downloaded successfully!');
            statusBox.textContent = 'File downloaded! Check your downloads folder.';
            
        } catch (error) {
            logger.error(`Download failed: ${error.message}`);
            statusBox.textContent = `Error: ${error.message}`;
        }
    }
    
    // Auto-start download
    startDownload();
}

// Utility functions
function generateId() {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
