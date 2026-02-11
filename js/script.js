/**
 * Akira Status Page - JavaScript
 * Real-time Lavalink Server Status Monitor
 * 
 * @version 2.0.0
 * @author Akira
 */

(function() {
    'use strict';

    // ============================================
    // Configuration
    // ============================================
    const CONFIG = {
        server: {
            host: 'https://understand-nec-our-pushed.trycloudflare.com',
            port: '',
            password: 'AkiraMusic',
            secure: false // Set true if server supports SSL
        },
        websocket: {
            userId: 'akira-status',
            clientName: 'Akira-Status-Page'
        },
        reconnect: {
            maxAttempts: 5,
            baseDelay: 3000,
            maxDelay: 30000
        },
        updateInterval: 30000,
        iconsPath: 'icons/'
    };

    // Build URLs based on page protocol and config
    const isSecurePage = window.location.protocol === 'https:';
    const wsProtocol = CONFIG.server.secure ? 'wss:' : 'ws:';
    const httpProtocol = CONFIG.server.secure ? 'https:' : 'http:';
    
    const URLS = {
        websocket: `${wsProtocol}//${CONFIG.server.host}:${CONFIG.server.port}/v4/websocket`,
        stats: `${httpProtocol}//${CONFIG.server.host}:${CONFIG.server.port}/v4/stats`
    };

    // ============================================
    // Music Sources Data
    // ============================================
    const MUSIC_SOURCES = [
        { name: 'YouTube', icon: 'youtube.png', fallback: '▶️', color: '#FF0000' },
        { name: 'YouTube Music', icon: 'youtube-music.png', fallback: '🎵', color: '#FF0000' },
        { name: 'SoundCloud', icon: 'soundcloud.png', fallback: '☁️', color: '#FF5500' },
        { name: 'Spotify', icon: 'spotify.png', fallback: '🟢', color: '#1DB954' },
        { name: 'Apple Music', icon: 'apple-music.png', fallback: '🍎', color: '#FC3C44' },
        { name: 'Deezer', icon: 'deezer.png', fallback: '🎧', color: '#FEAA2D' },
        { name: 'Tidal', icon: 'tidal.png', fallback: '🌊', color: '#00FFFF' },
        { name: 'Bandcamp', icon: 'bandcamp.png', fallback: '💿', color: '#629AA9' },
        { name: 'Audiomack', icon: 'audiomack.png', fallback: '🎤', color: '#FFA200' },
        { name: 'Gaana', icon: 'gaana.png', fallback: '🎶', color: '#E72C30' },
        { name: 'JioSaavn', icon: 'jiosaavn.png', fallback: '🇮🇳', color: '#2BC5B4' },
        { name: 'Last.fm', icon: 'lastfm.png', fallback: '📻', color: '#D51007' },
        { name: 'Pandora', icon: 'pandora.png', fallback: '📡', color: '#005483' },
        { name: 'VK Music', icon: 'vk-music.png', fallback: '💙', color: '#4C75A3' },
        { name: 'Mixcloud', icon: 'mixcloud.png', fallback: '🎚️', color: '#5000FF' },
        { name: 'NicoVideo', icon: 'nicovideo.png', fallback: '📺', color: '#252525' },
        { name: 'Bilibili', icon: 'bilibili.png', fallback: '📱', color: '#00A1D6' },
        { name: 'Shazam', icon: 'shazam.png', fallback: '🔍', color: '#0088FF' },
        { name: 'Eternal Box', icon: 'eternal-box.png', fallback: '📦', color: '#9B59B6' },
        { name: 'Songlink', icon: 'songlink.png', fallback: '🔗', color: '#1E90FF' },
        { name: 'Qobuz', icon: 'qobuz.png', fallback: '🎼', color: '#0170CC' },
        { name: 'Yandex Music', icon: 'yandex-music.png', fallback: '🟡', color: '#FFCC00' },
        { name: 'Audius', icon: 'audius.png', fallback: '🎪', color: '#CC0FE0' },
        { name: 'Amazon Music', icon: 'amazon-music.png', fallback: '🛒', color: '#00A8E1' },
        { name: 'Anghami', icon: 'anghami.png', fallback: '💜', color: '#9B2FAE' },
        { name: 'Bluesky', icon: 'bluesky.png', fallback: '🦋', color: '#0085FF' },
        { name: 'Letras.mus.br', icon: 'letras.png', fallback: '📝', color: '#FF6B35' },
        { name: 'Piper TTS', icon: 'piper-tts.png', fallback: '🗣️', color: '#4CAF50' },
        { name: 'Google TTS', icon: 'google-tts.png', fallback: '🔊', color: '#4285F4' },
        { name: 'Flowery TTS', icon: 'flowery-tts.png', fallback: '🌸', color: '#FF69B4' },
        { name: 'URL Stream', icon: 'unified.png', fallback: '🔄', color: '#6366F1' }
    ];

    // ============================================
    // State Management
    // ============================================
    const state = {
        ws: null,
        isConnected: false,
        connectionMode: 'connecting', // 'websocket', 'simulation', 'offline'
        reconnectAttempts: 0,
        reconnectTimeout: null,
        lastPingTime: null,
        uptimeMs: 0,
        uptimeInterval: null,
        simulationInterval: null,
        startTime: Date.now()
    };

    // ============================================
    // DOM Elements Cache
    // ============================================
    const elements = {};
    const elementIds = [
        'connectionBar', 'statusDot', 'statusText', 'connectionModeText',
        'pingValue', 'pingWave', 'pingStatus',
        'uptimeDays', 'uptimeHours', 'uptimeMinutes', 'uptimeSeconds',
        'totalPlayers', 'playingPlayersText', 'playersProgress',
        'cpuCores', 'systemLoadText', 'systemLoadProgress',
        'processLoadText', 'processLoadProgress',
        'memoryUsageText', 'memoryProgress',
        'memoryUsed', 'memoryFree', 'memoryAllocated', 'memoryReservable',
        'framesSent', 'framesNulled', 'framesDeficit', 'framesExpected',
        'lastUpdate', 'sourcesGrid', 'sourcesCount', 'toastContainer',
        'refreshBtn', 'updateInterval'
    ];

    function cacheElements() {
        elementIds.forEach(id => {
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
        if (!bytes || bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Format uptime milliseconds to time components
     */
    function formatUptime(ms) {
        if (!ms || ms < 0) ms = 0;
        const totalSeconds = Math.floor(ms / 1000);
        const days = Math.floor(totalSeconds / 86400);
        const hours = Math.floor((totalSeconds % 86400) / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        return {
            days: String(days).padStart(2, '0'),
            hours: String(hours).padStart(2, '0'),
            minutes: String(minutes).padStart(2, '0'),
            seconds: String(seconds).padStart(2, '0')
        };
    }

    /**
     * Format number with locale
     */
    function formatNumber(num) {
        if (num === undefined || num === null || isNaN(num)) return '--';
        return num.toLocaleString();
    }

    /**
     * Safe element text update
     */
    function setText(elementId, text) {
        if (elements[elementId]) {
            elements[elementId].textContent = text;
        }
    }

    /**
     * Safe element style update
     */
    function setStyle(elementId, property, value) {
        if (elements[elementId]) {
            elements[elementId].style[property] = value;
        }
    }

    /**
     * Show toast notification
     */
    function showToast(message, type = 'info', duration = 3000) {
        if (!elements.toastContainer) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <span class="toast-icon">${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span>
            <span class="toast-message">${message}</span>
        `;

        elements.toastContainer.appendChild(toast);

        // Trigger animation
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        // Remove after duration
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    /**
     * Debounce function
     */
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // ============================================
    // UI Update Functions
    // ============================================

    /**
     * Initialize music sources grid
     */
    function initMusicSources() {
        if (!elements.sourcesGrid) return;

        const fragment = document.createDocumentFragment();

        MUSIC_SOURCES.forEach((source, index) => {
            const item = document.createElement('div');
            item.className = 'source-item';
            item.setAttribute('data-source', source.name);
            item.style.animationDelay = `${0.02 * index}s`;

            item.innerHTML = `
                <div class="source-icon" style="background: ${source.color}15;">
                    <img 
                        src="${CONFIG.iconsPath}${source.icon}" 
                        alt="${source.name}"
                        class="source-icon-img"
                        loading="lazy"
                        onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
                    >
                    <span class="source-icon-fallback" style="display:none;">${source.fallback}</span>
                </div>
                <span class="source-name">${source.name}</span>
            `;

            fragment.appendChild(item);
        });

        elements.sourcesGrid.innerHTML = '';
        elements.sourcesGrid.appendChild(fragment);

        if (elements.sourcesCount) {
            elements.sourcesCount.textContent = `${MUSIC_SOURCES.length} Sources`;
        }
    }

    /**
     * Update connection status display
     */
    function updateStatus(status) {
        const statusClasses = ['online', 'offline', 'connecting'];
        const statusConfig = {
            online: { text: 'Operational', icon: '✓' },
            offline: { text: 'Offline', icon: '✕' },
            connecting: { text: 'Connecting...', icon: '◌' }
        };

        [elements.connectionBar, elements.statusDot, elements.statusText].forEach(el => {
            if (el) {
                statusClasses.forEach(cls => el.classList.remove(cls));
                el.classList.add(status);
            }
        });

        setText('statusText', statusConfig[status]?.text || status);
    }

    /**
     * Update connection mode display
     */
    function updateConnectionMode(mode) {
        state.connectionMode = mode;
        const modeTexts = {
            websocket: 'Live',
            simulation: 'Demo',
            offline: 'Offline',
            connecting: 'Connecting'
        };
        setText('connectionModeText', modeTexts[mode] || mode);
    }

    /**
     * Update ping display with color coding
     */
    function updatePing(ping) {
        if (!elements.pingValue) return;

        const pingNum = parseInt(ping) || 0;
        setText('pingValue', pingNum);

        // Remove all classes and add appropriate one
        elements.pingValue.className = 'ping-value';
        
        let status = 'Good';
        let colorClass = 'good';
        
        if (pingNum < 50) {
            status = 'Excellent';
            colorClass = 'good';
        } else if (pingNum < 100) {
            status = 'Good';
            colorClass = 'good';
        } else if (pingNum < 200) {
            status = 'Fair';
            colorClass = 'medium';
        } else {
            status = 'Poor';
            colorClass = 'bad';
        }

        elements.pingValue.classList.add(colorClass);
        setText('pingStatus', status);

        // Update wave colors
        if (elements.pingWave) {
            const colors = {
                good: '#10b981',
                medium: '#f59e0b',
                bad: '#ef4444'
            };
            const color = colors[colorClass];
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
        setText('uptimeDays', uptime.days);
        setText('uptimeHours', uptime.hours);
        setText('uptimeMinutes', uptime.minutes);
        setText('uptimeSeconds', uptime.seconds);
        state.uptimeMs += 1000;
    }

    /**
     * Reset all stats to default state
     */
    function resetStats() {
        const defaults = {
            pingValue: '--',
            pingStatus: '--',
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

        Object.entries(defaults).forEach(([key, value]) => setText(key, value));

        // Reset progress bars
        ['playersProgress', 'systemLoadProgress', 'processLoadProgress', 'memoryProgress'].forEach(id => {
            setStyle(id, 'width', '0%');
        });

        // Clear uptime interval
        if (state.uptimeInterval) {
            clearInterval(state.uptimeInterval);
            state.uptimeInterval = null;
        }
    }

    /**
     * Update all stats from data
     */
    function updateStats(data) {
        if (!data) return;

        // Players
        if (data.players !== undefined) {
            setText('totalPlayers', formatNumber(data.players));
        }

        if (data.playingPlayers !== undefined) {
            setText('playingPlayersText', `${formatNumber(data.playingPlayers)} playing`);
            const percentage = data.players > 0 ? (data.playingPlayers / Math.max(data.players, 1)) * 100 : 0;
            setStyle('playersProgress', 'width', `${Math.min(percentage, 100)}%`);
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

            setText('memoryUsed', formatBytes(used));
            setText('memoryFree', formatBytes(free));
            setText('memoryAllocated', formatBytes(allocated));
            setText('memoryReservable', formatBytes(reservable));
            setText('memoryUsageText', `${formatBytes(used)} / ${formatBytes(allocated)}`);

            const memoryPercentage = allocated > 0 ? (used / allocated) * 100 : 0;
            setStyle('memoryProgress', 'width', `${Math.min(memoryPercentage, 100)}%`);
        }

        // CPU
        if (data.cpu) {
            setText('cpuCores', `${data.cpu.cores || '--'} Cores`);

            const systemLoad = (data.cpu.systemLoad || 0) * 100;
            const lavalinkLoad = (data.cpu.lavalinkLoad || data.cpu.processLoad || 0) * 100;

            setText('systemLoadText', `${systemLoad.toFixed(1)}%`);
            setStyle('systemLoadProgress', 'width', `${Math.min(systemLoad, 100)}%`);

            setText('processLoadText', `${lavalinkLoad.toFixed(1)}%`);
            setStyle('processLoadProgress', 'width', `${Math.min(lavalinkLoad, 100)}%`);
        }

        // Frame Stats
        if (data.frameStats) {
            setText('framesSent', formatNumber(data.frameStats.sent || 0));
            setText('framesNulled', formatNumber(data.frameStats.nulled || 0));
            setText('framesDeficit', formatNumber(data.frameStats.deficit || 0));
            setText('framesExpected', formatNumber(data.frameStats.expected || 0));
        }

        // Update timestamp
        setText('lastUpdate', new Date().toLocaleString('id-ID', {
            day: '2-digit',
            month: '2-digit', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        }));
    }

    // ============================================
    // WebSocket Connection
    // ============================================

    /**
     * Check if WebSocket connection is possible
     */
    function canConnectWebSocket() {
        // If page is HTTPS and server is not secure, connection will be blocked
        if (isSecurePage && !CONFIG.server.secure) {
            console.warn('Cannot connect to insecure WebSocket from HTTPS page');
            return false;
        }
        return true;
    }

    /**
     * Connect to WebSocket server
     */
    function connectWebSocket() {
        // Clear any existing reconnect timeout
        if (state.reconnectTimeout) {
            clearTimeout(state.reconnectTimeout);
            state.reconnectTimeout = null;
        }

        // Check if connection is possible
        if (!canConnectWebSocket()) {
            console.log('WebSocket connection not possible from HTTPS, using simulation mode');
            startSimulation();
            return;
        }

        updateStatus('connecting');
        updateConnectionMode('connecting');
        console.log('Attempting WebSocket connection to:', URLS.websocket);

        try {
            state.ws = new WebSocket(URLS.websocket);

            state.ws.onopen = handleWebSocketOpen;
            state.ws.onmessage = handleWebSocketMessage;
            state.ws.onclose = handleWebSocketClose;
            state.ws.onerror = handleWebSocketError;

        } catch (error) {
            console.error('WebSocket construction error:', error);
            handleConnectionFailure();
        }
    }

    function handleWebSocketOpen() {
        console.log('WebSocket connected successfully');
        state.isConnected = true;
        state.reconnectAttempts = 0;
        state.lastPingTime = Date.now();
        
        updateStatus('online');
        updateConnectionMode('websocket');
        showToast('Connected to Lavalink server', 'success');

        // Stop simulation if running
        stopSimulation();
    }

    function handleWebSocketMessage(event) {
        try {
            const data = JSON.parse(event.data);
            
            // Calculate ping from message timing
            if (state.lastPingTime) {
                const ping = Date.now() - state.lastPingTime;
                updatePing(ping);
            }
            state.lastPingTime = Date.now();

            // Handle different message types
            switch (data.op) {
                case 'stats':
                    updateStats(data);
                    break;
                case 'ready':
                    console.log('Lavalink ready:', data);
                    break;
                case 'playerUpdate':
                    // Handle player updates if needed
                    break;
                case 'event':
                    // Handle events if needed
                    break;
                default:
                    console.log('Received message:', data.op);
            }
        } catch (error) {
            console.error('Error parsing WebSocket message:', error);
        }
    }

    function handleWebSocketClose(event) {
        console.log(`WebSocket closed: ${event.code} - ${event.reason || 'No reason'}`);
        state.isConnected = false;
        state.ws = null;

        updateStatus('offline');
        updateConnectionMode('offline');
        
        // Attempt reconnect or fall back to simulation
        if (state.reconnectAttempts < CONFIG.reconnect.maxAttempts) {
            attemptReconnect();
        } else {
            console.log('Max reconnection attempts reached, starting simulation');
            startSimulation();
        }
    }

    function handleWebSocketError(error) {
        console.error('WebSocket error:', error);
        // Error handling is done in onclose
    }

    function handleConnectionFailure() {
        state.isConnected = false;
        updateStatus('offline');
        
        if (state.reconnectAttempts < CONFIG.reconnect.maxAttempts) {
            attemptReconnect();
        } else {
            startSimulation();
        }
    }

    /**
     * Attempt to reconnect with exponential backoff
     */
    function attemptReconnect() {
        state.reconnectAttempts++;
        const delay = Math.min(
            CONFIG.reconnect.baseDelay * Math.pow(1.5, state.reconnectAttempts - 1),
            CONFIG.reconnect.maxDelay
        );

        console.log(`Reconnecting in ${(delay / 1000).toFixed(1)}s... (attempt ${state.reconnectAttempts}/${CONFIG.reconnect.maxAttempts})`);
        updateConnectionMode('connecting');

        state.reconnectTimeout = setTimeout(() => {
            if (canConnectWebSocket()) {
                connectWebSocket();
            } else {
                startSimulation();
            }
        }, delay);
    }

    // ============================================
    // Simulation Mode (Demo/Fallback)
    // ============================================

    /**
     * Start simulation mode
     */
    function startSimulation() {
        if (state.simulationInterval) return; // Already running

        console.log('Starting simulation mode');
        updateStatus('online');
        updateConnectionMode('simulation');
        showToast('Running in demo mode', 'info');

        // Generate initial data
        generateSimulatedStats();

        // Update periodically
        state.simulationInterval = setInterval(generateSimulatedStats, CONFIG.updateInterval);
    }

    /**
     * Stop simulation mode
     */
    function stopSimulation() {
        if (state.simulationInterval) {
            clearInterval(state.simulationInterval);
            state.simulationInterval = null;
        }
    }

    /**
     * Generate simulated statistics
     */
    function generateSimulatedStats() {
        // Use time-based seed for consistent-ish randomness
        const seed = Math.floor(Date.now() / 60000); // Changes every minute
        const pseudoRandom = (min, max, offset = 0) => {
            const x = Math.sin(seed + offset) * 10000;
            const rand = x - Math.floor(x);
            return min + rand * (max - min);
        };

        const simulatedData = {
            op: 'stats',
            players: Math.floor(pseudoRandom(5, 50, 1)),
            playingPlayers: Math.floor(pseudoRandom(2, 30, 2)),
            uptime: Date.now() - state.startTime + pseudoRandom(86400000, 604800000, 3), // 1-7 days
            memory: {
                used: Math.floor(pseudoRandom(150, 400, 4)) * 1000000,
                free: Math.floor(pseudoRandom(100, 300, 5)) * 1000000,
                allocated: Math.floor(pseudoRandom(400, 600, 6)) * 1000000,
                reservable: Math.floor(pseudoRandom(800, 1200, 7)) * 1000000
            },
            cpu: {
                cores: 4,
                systemLoad: pseudoRandom(0.1, 0.5, 8),
                lavalinkLoad: pseudoRandom(0.05, 0.3, 9)
            },
            frameStats: {
                sent: Math.floor(pseudoRandom(50000, 150000, 10)),
                nulled: Math.floor(pseudoRandom(0, 50, 11)),
                deficit: Math.floor(pseudoRandom(0, 20, 12)),
                expected: Math.floor(pseudoRandom(50000, 150000, 13))
            }
        };

        // Ensure playingPlayers <= players
        if (simulatedData.playingPlayers > simulatedData.players) {
            simulatedData.playingPlayers = simulatedData.players;
        }

        updateStats(simulatedData);
        updatePing(Math.floor(pseudoRandom(20, 80, 14)));
    }

    // ============================================
    // Event Handlers
    // ============================================

    /**
     * Handle refresh button click
     */
    function handleRefresh() {
        console.log('Manual refresh triggered');
        
        // Reset state
        state.reconnectAttempts = 0;
        stopSimulation();
        
        if (state.ws) {
            state.ws.close();
        }

        resetStats();
        
        // Try connecting again
        setTimeout(() => {
            if (canConnectWebSocket()) {
                connectWebSocket();
            } else {
                startSimulation();
            }
        }, 500);

        showToast('Refreshing connection...', 'info');
    }

    /**
     * Handle visibility change (tab focus)
     */
    function handleVisibilityChange() {
        if (document.visibilityState === 'visible') {
            console.log('Page visible, checking connection');
            if (!state.isConnected && !state.simulationInterval) {
                state.reconnectAttempts = 0;
                if (canConnectWebSocket()) {
                    connectWebSocket();
                } else {
                    startSimulation();
                }
            }
        }
    }

    /**
     * Handle online/offline events
     */
    function handleOnline() {
        console.log('Network connection restored');
        showToast('Network connection restored', 'success');
        if (!state.isConnected) {
            state.reconnectAttempts = 0;
            if (canConnectWebSocket()) {
                connectWebSocket();
            }
        }
    }

    function handleOffline() {
        console.log('Network connection lost');
        showToast('Network connection lost', 'error');
        updateStatus('offline');
        updateConnectionMode('offline');
    }

    // ============================================
    // Initialization
    // ============================================

    /**
     * Initialize the application
     */
    function init() {
        console.log('🎵 Initializing Akira Status Page...');
        console.log(`📍 Page protocol: ${window.location.protocol}`);
        console.log(`🔗 WebSocket URL: ${URLS.websocket}`);
        console.log(`🌐 Can connect WebSocket: ${canConnectWebSocket()}`);

        // Cache DOM elements
        cacheElements();

        // Initialize music sources
        initMusicSources();

        // Set update interval display
        setText('updateInterval', `${CONFIG.updateInterval / 1000}s`);

        // Bind event listeners
        if (elements.refreshBtn) {
            elements.refreshBtn.addEventListener('click', (e) => {
                e.preventDefault();
                handleRefresh();
            });
        }

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Start connection
        if (canConnectWebSocket()) {
            connectWebSocket();
            
            // Fallback to simulation if WebSocket doesn't connect in 5s
            setTimeout(() => {
                if (!state.isConnected && !state.simulationInterval) {
                    console.log('WebSocket connection timeout, starting simulation');
                    startSimulation();
                }
            }, 5000);
        } else {
            // Start simulation immediately for HTTPS pages
            console.log('Starting in simulation mode (HTTPS page with insecure WebSocket)');
            startSimulation();
        }

        console.log('✅ Akira Status Page initialized');
    }

    // ============================================
    // Start Application
    // ============================================

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Export for debugging
    window.AkiraStatus = {
        state,
        CONFIG,
        URLS,
        refresh: handleRefresh,
        startSimulation,
        stopSimulation,
        isSecurePage,
        canConnectWebSocket
    };

})();


