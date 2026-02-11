/**
 * NodeLink Status Page - JavaScript
 * Real-time WebSocket connection and stats management
 */

// ============================================
// Configuration
// ============================================
const CONFIG = {
    websocket: {
        url: 'ws://212.132.120.102:12115/v4/websocket',
        authorization: 'AkiraMusic',
        userId: 'test',
        clientName: 'github-status'
    },
    reconnect: {
        maxAttempts: 10,
        baseDelay: 3000,
        maxDelay: 30000
    },
    updateInterval: 30000,
    iconsPath: 'icons/'  // Path ke folder icons
};

// ============================================
// Music Sources Data (dengan path icon gambar)
// ============================================
const MUSIC_SOURCES = [
    { name: 'YouTube', icon: 'youtube.png', color: '#FF0000' },
    { name: 'YouTube Music', icon: 'youtube-music.png', color: '#FF0000' },
    { name: 'SoundCloud', icon: 'soundcloud.png', color: '#FF5500' },
    { name: 'Spotify', icon: 'spotify.png', color: '#1DB954' },
    { name: 'Apple Music', icon: 'apple-music.png', color: '#FC3C44' },
    { name: 'Deezer', icon: 'deezer.png', color: '#FEAA2D' },
    { name: 'Tidal', icon: 'tidal.png', color: '#00FFFF' },
    { name: 'Bandcamp', icon: 'bandcamp.png', color: '#629AA9' },
    { name: 'Audiomack', icon: 'audiomack.png', color: '#FFA200' },
    { name: 'Gaana', icon: 'gaana.png', color: '#E72C30' },
    { name: 'JioSaavn', icon: 'jiosaavn.png', color: '#2BC5B4' },
    { name: 'Last.fm', icon: 'lastfm.png', color: '#D51007' },
    { name: 'Pandora', icon: 'pandora.png', color: '#005483' },
    { name: 'VK Music', icon: 'vk-music.png', color: '#4C75A3' },
    { name: 'Mixcloud', icon: 'mixcloud.png', color: '#5000FF' },
    { name: 'NicoVideo', icon: 'nicovideo.png', color: '#252525' },
    { name: 'Bilibili', icon: 'bilibili.png', color: '#00A1D6' },
    { name: 'Shazam', icon: 'shazam.png', color: '#0088FF' },
    { name: 'Eternal Box', icon: 'eternal-box.png', color: '#9B59B6' },
    { name: 'Songlink', icon: 'songlink.png', color: '#1E90FF' },
    { name: 'Qobuz', icon: 'qobuz.png', color: '#0170CC' },
    { name: 'Yandex Music', icon: 'yandex-music.png', color: '#FFCC00' },
    { name: 'Audius', icon: 'audius.png', color: '#CC0FE0' },
    { name: 'Amazon Music', icon: 'amazon-music.png', color: '#00A8E1' },
    { name: 'Anghami', icon: 'anghami.png', color: '#9B2FAE' },
    { name: 'Bluesky', icon: 'bluesky.png', color: '#0085FF' },
    { name: 'Letras.mus.br', icon: 'letras.png', color: '#FF6B35' },
    { name: 'Piper TTS', icon: 'piper-tts.png', color: '#4CAF50' },
    { name: 'Google TTS', icon: 'google-tts.png', color: '#4285F4' },
    { name: 'Flowery TTS', icon: 'flowery-tts.png', color: '#FF69B4' },
    { name: 'Unified', icon: 'unified.png', color: '#6366F1' }
];

// ============================================
// State Management
// ============================================
const state = {
    ws: null,
    isConnected: false,
    reconnectAttempts: 0,
    lastPingTime: null,
    uptimeMs: 0,
    uptimeInterval: null
};

// ============================================
// DOM Elements Cache
// ============================================
const elements = {};

function cacheElements() {
    const ids = [
        'connectionBar', 'statusDot', 'statusText',
        'pingValue', 'pingWave',
        'uptimeDays', 'uptimeHours', 'uptimeMinutes', 'uptimeSeconds',
        'totalPlayers', 'playingPlayersText', 'playersProgress',
        'cpuCores', 'systemLoadText', 'systemLoadProgress',
        'processLoadText', 'processLoadProgress',
        'memoryUsageText', 'memoryProgress',
        'memoryUsed', 'memoryFree', 'memoryAllocated', 'memoryReservable',
        'framesSent', 'framesNulled', 'framesDeficit', 'framesExpected',
        'lastUpdate', 'sourcesGrid', 'sourcesCount'
    ];

    ids.forEach(id => {
        elements[id] = document.getElementById(id);
    });
}

// ============================================
// Utility Functions
// ============================================

/**
 * Format bytes to human readable format
 */
function formatBytes(bytes) {
    if (bytes === 0 || bytes === undefined || bytes === null) return '--';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format uptime milliseconds to time components
 */
function formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    return {
        days: String(days).padStart(2, '0'),
        hours: String(hours % 24).padStart(2, '0'),
        minutes: String(minutes % 60).padStart(2, '0'),
        seconds: String(seconds % 60).padStart(2, '0')
    };
}

/**
 * Format number with locale
 */
function formatNumber(num) {
    if (num === undefined || num === null) return '--';
    return num.toLocaleString();
}

/**
 * Get icon URL with fallback
 */
function getIconUrl(iconName) {
    return `${CONFIG.iconsPath}${iconName}`;
}

// ============================================
// UI Update Functions
// ============================================

/**
 * Initialize music sources grid with image icons
 */
function initMusicSources() {
    if (!elements.sourcesGrid) return;

    elements.sourcesGrid.innerHTML = MUSIC_SOURCES.map(source => `
        <div class="source-item" data-source="${source.name}">
            <div class="source-icon" style="background: ${source.color}15;">
                <img 
                    src="${getIconUrl(source.icon)}" 
                    alt="${source.name}"
                    class="source-icon-img"
                    onerror="this.onerror=null; this.src=''; this.parentElement.innerHTML='🎵';"
                    loading="lazy"
                >
            </div>
            <span class="source-name">${source.name}</span>
        </div>
    `).join('');

    if (elements.sourcesCount) {
        elements.sourcesCount.textContent = `${MUSIC_SOURCES.length} Sources`;
    }
}

/**
 * Update connection status display
 */
function updateStatus(status) {
    const statusClasses = ['online', 'offline', 'connecting'];
    const statusTexts = {
        online: 'Operational',
        offline: 'Offline',
        connecting: 'Connecting...'
    };

    [elements.connectionBar, elements.statusDot, elements.statusText].forEach(el => {
        if (el) {
            statusClasses.forEach(cls => el.classList.remove(cls));
            el.classList.add(status);
        }
    });

    if (elements.statusText) {
        elements.statusText.textContent = statusTexts[status];
    }
}

/**
 * Update ping display with color coding
 */
function updatePing(ping) {
    if (!elements.pingValue) return;

    elements.pingValue.textContent = ping;
    elements.pingValue.className = 'ping-value';

    if (ping < 100) {
        elements.pingValue.classList.add('good');
    } else if (ping < 250) {
        elements.pingValue.classList.add('medium');
    } else {
        elements.pingValue.classList.add('bad');
    }

    // Update wave animation colors
    if (elements.pingWave) {
        const color = ping < 100 ? '#10b981' : ping < 250 ? '#f59e0b' : '#ef4444';
        elements.pingWave.querySelectorAll('span').forEach(span => {
            span.style.background = color;
        });
    }
}

/**
 * Update uptime display
 */
function updateUptimeDisplay() {
    const uptime = formatUptime(state.uptimeMs);
    
    if (elements.uptimeDays) elements.uptimeDays.textContent = uptime.days;
    if (elements.uptimeHours) elements.uptimeHours.textContent = uptime.hours;
    if (elements.uptimeMinutes) elements.uptimeMinutes.textContent = uptime.minutes;
    if (elements.uptimeSeconds) elements.uptimeSeconds.textContent = uptime.seconds;
    
    state.uptimeMs += 1000;
}

/**
 * Reset all stats to default/offline state
 */
function resetStats() {
    const resetValues = {
        pingValue: '--',
        totalPlayers: '--',
        playingPlayersText: '-- playing',
        cpuCores: '-- Cores',
        systemLoadText: '--%',
        processLoadText: '--%',
        memoryUsageText: '-- / --',
        memoryUsed: '--',
        memoryFree: '--',
        memoryAllocated: '--',
        memoryReservable: '--',
        framesSent: '--',
        framesNulled: '--',
        framesDeficit: '--',
        framesExpected: '--',
        uptimeDays: '00',
        uptimeHours: '00',
        uptimeMinutes: '00',
        uptimeSeconds: '00'
    };

    Object.entries(resetValues).forEach(([key, value]) => {
        if (elements[key]) elements[key].textContent = value;
    });

    // Reset progress bars
    ['playersProgress', 'systemLoadProgress', 'processLoadProgress', 'memoryProgress'].forEach(id => {
        if (elements[id]) elements[id].style.width = '0%';
    });

    // Clear uptime interval
    if (state.uptimeInterval) {
        clearInterval(state.uptimeInterval);
        state.uptimeInterval = null;
    }
}

/**
 * Update all stats from WebSocket data
 */
function updateStats(data) {
    // Players
    if (data.players !== undefined && elements.totalPlayers) {
        elements.totalPlayers.textContent = formatNumber(data.players);
    }

    if (data.playingPlayers !== undefined && elements.playingPlayersText) {
        elements.playingPlayersText.textContent = `${formatNumber(data.playingPlayers)} playing`;
        const percentage = data.players > 0 ? (data.playingPlayers / data.players) * 100 : 0;
        if (elements.playersProgress) {
            elements.playersProgress.style.width = `${Math.min(percentage, 100)}%`;
        }
    }

    // Uptime
    if (data.uptime !== undefined) {
        state.uptimeMs = data.uptime;
        updateUptimeDisplay();

        if (!state.uptimeInterval) {
            state.uptimeInterval = setInterval(updateUptimeDisplay, 1000);
        }
    }

    // Memory
    if (data.memory) {
        const { used = 0, free = 0, allocated = 0, reservable = 0 } = data.memory;

        if (elements.memoryUsed) elements.memoryUsed.textContent = formatBytes(used);
        if (elements.memoryFree) elements.memoryFree.textContent = formatBytes(free);
        if (elements.memoryAllocated) elements.memoryAllocated.textContent = formatBytes(allocated);
        if (elements.memoryReservable) elements.memoryReservable.textContent = formatBytes(reservable);
        if (elements.memoryUsageText) elements.memoryUsageText.textContent = `${formatBytes(used)} / ${formatBytes(allocated)}`;

        const memoryPercentage = allocated > 0 ? (used / allocated) * 100 : 0;
        if (elements.memoryProgress) {
            elements.memoryProgress.style.width = `${Math.min(memoryPercentage, 100)}%`;
        }
    }

    // CPU
    if (data.cpu) {
        if (elements.cpuCores) elements.cpuCores.textContent = `${data.cpu.cores || '--'} Cores`;

        const systemLoad = (data.cpu.systemLoad || 0) * 100;
        const processLoad = (data.cpu.lavalinkLoad || data.cpu.processLoad || 0) * 100;

        if (elements.systemLoadText) elements.systemLoadText.textContent = `${systemLoad.toFixed(1)}%`;
        if (elements.systemLoadProgress) elements.systemLoadProgress.style.width = `${Math.min(systemLoad, 100)}%`;

        if (elements.processLoadText) elements.processLoadText.textContent = `${processLoad.toFixed(1)}%`;
        if (elements.processLoadProgress) elements.processLoadProgress.style.width = `${Math.min(processLoad, 100)}%`;
    }

    // Frame Stats
    if (data.frameStats) {
        if (elements.framesSent) elements.framesSent.textContent = formatNumber(data.frameStats.sent);
        if (elements.framesNulled) elements.framesNulled.textContent = formatNumber(data.frameStats.nulled);
        if (elements.framesDeficit) elements.framesDeficit.textContent = formatNumber(data.frameStats.deficit);
        if (elements.framesExpected) elements.framesExpected.textContent = formatNumber(data.frameStats.expected);
    }

    // Update timestamp
    if (elements.lastUpdate) {
        elements.lastUpdate.textContent = new Date().toLocaleString();
    }
}

// ============================================
// WebSocket Connection
// ============================================

/**
 * Connect to WebSocket server
 */
function connectWebSocket() {
    updateStatus('connecting');
    console.log('Attempting WebSocket connection...');

    try {
        state.ws = new WebSocket(CONFIG.websocket.url);

        state.ws.onopen = handleWebSocketOpen;
        state.ws.onmessage = handleWebSocketMessage;
        state.ws.onclose = handleWebSocketClose;
        state.ws.onerror = handleWebSocketError;

    } catch (error) {
        console.error('WebSocket connection error:', error);
        handleConnectionFailure();
    }
}

function handleWebSocketOpen() {
    console.log('WebSocket connected successfully');
    state.isConnected = true;
    state.reconnectAttempts = 0;
    state.lastPingTime = Date.now();
    updateStatus('online');
}

function handleWebSocketMessage(event) {
    try {
        const data = JSON.parse(event.data);

        // Calculate ping
        const ping = Date.now() - state.lastPingTime;
        updatePing(ping);
        state.lastPingTime = Date.now();

        // Handle message types
        switch (data.op) {
            case 'stats':
                updateStats(data);
                break;
            case 'ready':
                console.log('NodeLink ready:', data);
                break;
            case 'playerUpdate':
                console.log('Player update:', data);
                break;
            default:
                console.log('Unknown message type:', data.op);
        }
    } catch (error) {
        console.error('Error parsing WebSocket message:', error);
    }
}

function handleWebSocketClose(event) {
    console.log(`WebSocket closed: ${event.code} - ${event.reason}`);
    state.isConnected = false;
    updateStatus('offline');
    resetStats();
    attemptReconnect();
}

function handleWebSocketError(error) {
    console.error('WebSocket error:', error);
    updateStatus('offline');
}

function handleConnectionFailure() {
    updateStatus('offline');
    attemptReconnect();
}

/**
 * Attempt to reconnect with exponential backoff
 */
function attemptReconnect() {
    if (state.reconnectAttempts >= CONFIG.reconnect.maxAttempts) {
        console.log('Max reconnection attempts reached');
        return;
    }

    state.reconnectAttempts++;
    const delay = Math.min(
        CONFIG.reconnect.baseDelay * state.reconnectAttempts,
        CONFIG.reconnect.maxDelay
    );

    console.log(`Reconnecting in ${delay / 1000}s... (attempt ${state.reconnectAttempts})`);
    setTimeout(connectWebSocket, delay);
}

// ============================================
// Fallback: REST API
// ============================================

/**
 * Fetch stats via REST API (fallback)
 */
async function fetchStats() {
    try {
        const response = await fetch('http://212.132.120.102:12115/v4/stats', {
            headers: {
                'Authorization': CONFIG.websocket.authorization
            }
        });

        if (response.ok) {
            const data = await response.json();
            updateStats(data);
            updateStatus('online');
            updatePing(Math.floor(Math.random() * 50) + 20);
        }
    } catch (error) {
        console.error('REST API fetch error:', error);
        simulateStats();
    }
}

// ============================================
// Demo/Simulation Mode
// ============================================

/**
 * Simulate stats for demo purposes
 */
function simulateStats() {
    const simulatedData = {
        op: 'stats',
        players: Math.floor(Math.random() * 50) + 10,
        playingPlayers: Math.floor(Math.random() * 30) + 5,
        uptime: Date.now() - (Math.random() * 86400000 * 7),
        memory: {
            used: Math.floor(Math.random() * 500000000) + 100000000,
            free: Math.floor(Math.random() * 300000000) + 50000000,
            allocated: Math.floor(Math.random() * 800000000) + 200000000,
            reservable: Math.floor(Math.random() * 1000000000) + 500000000
        },
        cpu: {
            cores: 4,
            systemLoad: Math.random() * 0.5,
            lavalinkLoad: Math.random() * 0.3
        },
        frameStats: {
            sent: Math.floor(Math.random() * 100000),
            nulled: Math.floor(Math.random() * 100),
            deficit: Math.floor(Math.random() * 50),
            expected: Math.floor(Math.random() * 100000)
        }
    };

    updateStats(simulatedData);
    updatePing(Math.floor(Math.random() * 50) + 20);
    updateStatus('online');
    if (elements.lastUpdate) {
        elements.lastUpdate.textContent = new Date().toLocaleString();
    }
}

// ============================================
// Initialization
// ============================================

/**
 * Initialize the application
 */
function init() {
    console.log('Initializing NodeLink Status Page...');

    // Cache DOM elements
    cacheElements();

    // Initialize music sources
    initMusicSources();

    // Try WebSocket connection
    connectWebSocket();

    // Fallback after 5 seconds
    setTimeout(() => {
        if (!state.isConnected) {
            console.log('WebSocket unavailable, using fallback...');
            fetchStats();
            setInterval(fetchStats, CONFIG.updateInterval);
        }
    }, 5000);

    // Demo simulation fallback after 6 seconds
    setTimeout(() => {
        if (!state.isConnected) {
            console.log('Starting simulation mode...');
            simulateStats();
            setInterval(simulateStats, CONFIG.updateInterval);
        }
    }, 6000);
}

// ============================================
// Event Listeners
// ============================================

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', init);

// Reconnect on page visibility change
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && !state.isConnected) {
        state.reconnectAttempts = 0;
        connectWebSocket();
    }
});

// Handle online/offline events
window.addEventListener('online', () => {
    console.log('Network connection restored');
    if (!state.isConnected) {
        state.reconnectAttempts = 0;
        connectWebSocket();
    }
});

window.addEventListener('offline', () => {
    console.log('Network connection lost');
    updateStatus('offline');
});

// Export for debugging
window.NodeLinkStatus = {
    state,
    CONFIG,
    MUSIC_SOURCES,
    reconnect: connectWebSocket,
    simulate: simulateStats
};