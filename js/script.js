// script.js
/**
 * Akira Status Page - JavaScript
 * Real-time Lavalink Server Status Monitor
 * 
 * @version 2.1.0
 * @author Akira
 */

(function() {
    'use strict';

    // ============================================
    // Configuration
    // ============================================
    const CONFIG = {
        server: {
            // Cloudflare Tunnel URL (tanpa protocol)
            host: 'understand-nec-our-pushed.trycloudflare.com',
            password: 'AkiraMusic',
            secure: true // Cloudflare Tunnel selalu HTTPS/WSS
        },
        websocket: {
            userId: 'akira-status-' + Date.now(),
            clientName: 'Akira-Status-Page/2.1.0'
        },
        reconnect: {
            maxAttempts: 10,
            baseDelay: 2000,
            maxDelay: 30000
        },
        updateInterval: 5000, // Poll setiap 5 detik jika WS gagal
        httpFallback: true, // Gunakan HTTP polling jika WS gagal
        iconsPath: 'icons/'
    };

    // Build URLs - Cloudflare Tunnel selalu secure
    const URLS = {
        websocket: `wss://${CONFIG.server.host}/v4/websocket`,
        stats: `https://${CONFIG.server.host}/v4/stats`,
        info: `https://${CONFIG.server.host}/v4/info`,
        version: `https://${CONFIG.server.host}/version`
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
        connectionMode: 'connecting', // 'websocket', 'http-polling', 'offline'
        reconnectAttempts: 0,
        reconnectTimeout: null,
        httpPollInterval: null,
        lastPingTime: null,
        pingLatency: 0,
        uptimeMs: 0,
        uptimeInterval: null,
        startTime: Date.now(),
        serverInfo: null,
        lastStats: null,
        wsConnectStartTime: null
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
        'refreshBtn', 'updateInterval', 'serverAddress'
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
    function showToast(message, type = 'info', duration = 4000) {
        if (!elements.toastContainer) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };

        toast.innerHTML = `
            <span class="toast-icon">${icons[type] || icons.info}</span>
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
            websocket: '🟢 WebSocket Live',
            'http-polling': '🔄 HTTP Polling',
            offline: '🔴 Offline',
            connecting: '🟡 Connecting...'
        };
        setText('connectionModeText', modeTexts[mode] || mode);
    }

    /**
     * Update ping display with color coding
     */
    function updatePing(ping) {
        if (!elements.pingValue) return;

        const pingNum = parseInt(ping) || 0;
        state.pingLatency = pingNum;
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

        state.lastStats = data;

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
    // HTTP API Functions (Fallback & Primary)
    // ============================================

    /**
     * Fetch stats via HTTP API
     */
    async function fetchStats() {
        const startTime = performance.now();
        
        try {
            const response = await fetch(URLS.stats, {
                method: 'GET',
                headers: {
                    'Authorization': CONFIG.server.password,
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            const latency = Math.round(performance.now() - startTime);
            
            updatePing(latency);
            updateStats(data);
            
            return data;
        } catch (error) {
            console.error('Failed to fetch stats:', error);
            throw error;
        }
    }

    /**
     * Fetch server info
     */
    async function fetchServerInfo() {
        try {
            const response = await fetch(URLS.info, {
                method: 'GET',
                headers: {
                    'Authorization': CONFIG.server.password,
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                state.serverInfo = await response.json();
                console.log('Server info:', state.serverInfo);
                return state.serverInfo;
            }
        } catch (error) {
            console.warn('Could not fetch server info:', error);
        }
        return null;
    }

    /**
     * Check server availability
     */
    async function checkServerAvailability() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const response = await fetch(URLS.version, {
                method: 'GET',
                signal: controller.signal,
                headers: {
                    'Authorization': CONFIG.server.password
                }
            });

            clearTimeout(timeoutId);
            return response.ok;
        } catch (error) {
            console.warn('Server availability check failed:', error);
            return false;
        }
    }

    /**
     * Start HTTP polling
     */
    function startHttpPolling() {
        if (state.httpPollInterval) return;

        console.log('Starting HTTP polling mode');
        updateStatus('online');
        updateConnectionMode('http-polling');

        // Initial fetch
        fetchStats().catch(console.error);
        fetchServerInfo().catch(console.error);

        // Start polling interval
        state.httpPollInterval = setInterval(async () => {
            try {
                await fetchStats();
            } catch (error) {
                console.error('HTTP poll failed:', error);
                // Don't stop polling on single failure
            }
        }, CONFIG.updateInterval);
    }

    /**
     * Stop HTTP polling
     */
    function stopHttpPolling() {
        if (state.httpPollInterval) {
            clearInterval(state.httpPollInterval);
            state.httpPollInterval = null;
        }
    }

    // ============================================
    // WebSocket Connection
    // ============================================

    /**
     * Connect to WebSocket server
     */
    function connectWebSocket() {
        // Clear any existing reconnect timeout
        if (state.reconnectTimeout) {
            clearTimeout(state.reconnectTimeout);
            state.reconnectTimeout = null;
        }

        // Close existing connection
        if (state.ws) {
            state.ws.close();
            state.ws = null;
        }

        updateStatus('connecting');
        updateConnectionMode('connecting');
        console.log('Attempting WebSocket connection to:', URLS.websocket);

        state.wsConnectStartTime = performance.now();

        try {
            state.ws = new WebSocket(URLS.websocket);

            // Set timeout for connection
            const connectTimeout = setTimeout(() => {
                if (state.ws && state.ws.readyState === WebSocket.CONNECTING) {
                    console.warn('WebSocket connection timeout');
                    state.ws.close();
                }
            }, 10000);

            state.ws.onopen = () => {
                clearTimeout(connectTimeout);
                handleWebSocketOpen();
            };
            
            state.ws.onmessage = handleWebSocketMessage;
            state.ws.onclose = (event) => {
                clearTimeout(connectTimeout);
                handleWebSocketClose(event);
            };
            state.ws.onerror = handleWebSocketError;

        } catch (error) {
            console.error('WebSocket construction error:', error);
            handleConnectionFailure();
        }
    }

    function handleWebSocketOpen() {
        const connectTime = Math.round(performance.now() - state.wsConnectStartTime);
        console.log(`WebSocket connected successfully in ${connectTime}ms`);
        
        state.isConnected = true;
        state.reconnectAttempts = 0;
        state.lastPingTime = Date.now();
        
        updateStatus('online');
        updateConnectionMode('websocket');
        updatePing(connectTime);
        showToast('Connected to Lavalink server via WebSocket', 'success');

        // Stop HTTP polling if running
        stopHttpPolling();

        // Fetch initial server info
        fetchServerInfo().catch(console.error);
    }

    function handleWebSocketMessage(event) {
        try {
            const data = JSON.parse(event.data);
            
            // Calculate ping from message timing
            const now = Date.now();
            if (state.lastPingTime) {
                // Use a rolling average for smoother ping display
                const instantPing = now - state.lastPingTime;
                const smoothedPing = Math.round((state.pingLatency * 0.7) + (instantPing * 0.3));
                updatePing(Math.min(smoothedPing, 1000)); // Cap at 1000ms
            }
            state.lastPingTime = now;

            // Handle different message types
            switch (data.op) {
                case 'stats':
                    updateStats(data);
                    break;
                case 'ready':
                    console.log('Lavalink ready:', data);
                    showToast(`Lavalink ready - Session: ${data.sessionId?.substring(0, 8)}...`, 'info');
                    break;
                case 'playerUpdate':
                    // Handle player updates if needed
                    console.debug('Player update:', data);
                    break;
                case 'event':
                    console.debug('Event received:', data);
                    break;
                default:
                    console.debug('Unknown message op:', data.op, data);
            }
        } catch (error) {
            console.error('Error parsing WebSocket message:', error);
        }
    }

    function handleWebSocketClose(event) {
        console.log(`WebSocket closed: Code ${event.code} - ${event.reason || 'No reason provided'}`);
        state.isConnected = false;
        state.ws = null;

        // Determine if this is a clean close or error
        const wasClean = event.wasClean;
        const code = event.code;

        // Codes: 1000 = normal, 1001 = going away, 1006 = abnormal, 4xxx = Lavalink specific
        if (code === 1000 || code === 1001) {
            console.log('WebSocket closed normally');
        } else if (code === 1006) {
            console.warn('WebSocket closed abnormally (connection lost)');
        } else if (code >= 4000) {
            console.warn(`Lavalink error code: ${code}`);
            showToast(`Lavalink error: ${event.reason || `Code ${code}`}`, 'error');
        }

        // Attempt reconnect
        if (state.reconnectAttempts < CONFIG.reconnect.maxAttempts) {
            attemptReconnect();
        } else if (CONFIG.httpFallback) {
            console.log('Max WebSocket attempts reached, falling back to HTTP polling');
            showToast('Switched to HTTP polling mode', 'warning');
            startHttpPolling();
        } else {
            updateStatus('offline');
            updateConnectionMode('offline');
            showToast('Connection lost - please refresh', 'error');
        }
    }

    function handleWebSocketError(error) {
        console.error('WebSocket error:', error);
        // Error handling is primarily done in onclose
    }

    function handleConnectionFailure() {
        state.isConnected = false;
        
        if (state.reconnectAttempts < CONFIG.reconnect.maxAttempts) {
            attemptReconnect();
        } else if (CONFIG.httpFallback) {
            startHttpPolling();
        } else {
            updateStatus('offline');
            updateConnectionMode('offline');
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
        updateStatus('connecting');
        updateConnectionMode('connecting');

        state.reconnectTimeout = setTimeout(() => {
            connectWebSocket();
        }, delay);
    }

    // ============================================
    // Event Handlers
    // ============================================

    /**
     * Handle refresh button click
     */
    async function handleRefresh() {
        console.log('Manual refresh triggered');
        
        // Reset state
        state.reconnectAttempts = 0;
        stopHttpPolling();
        
        if (state.ws) {
            state.ws.close();
        }

        resetStats();
        showToast('Refreshing connection...', 'info');
        
        // Check server first
        const isAvailable = await checkServerAvailability();
        
        if (isAvailable) {
            // Try WebSocket first
            setTimeout(() => {
                connectWebSocket();
                
                // If WebSocket doesn't connect in 5s, fallback to HTTP
                setTimeout(() => {
                    if (!state.isConnected && !state.httpPollInterval) {
                        console.log('WebSocket timeout, falling back to HTTP');
                        startHttpPolling();
                    }
                }, 5000);
            }, 500);
        } else {
            showToast('Server is not reachable', 'error');
            updateStatus('offline');
            updateConnectionMode('offline');
        }
    }

    /**
     * Handle visibility change (tab focus)
     */
    function handleVisibilityChange() {
        if (document.visibilityState === 'visible') {
            console.log('Page visible, checking connection');
            
            // If not connected, try to reconnect
            if (!state.isConnected && !state.httpPollInterval) {
                state.reconnectAttempts = 0;
                connectWebSocket();
                
                // Fallback to HTTP if needed
                setTimeout(() => {
                    if (!state.isConnected && !state.httpPollInterval) {
                        startHttpPolling();
                    }
                }, 5000);
            }
        }
    }

    /**
     * Handle online/offline events
     */
    function handleOnline() {
        console.log('Network connection restored');
        showToast('Network connection restored', 'success');
        
        if (!state.isConnected && !state.httpPollInterval) {
            state.reconnectAttempts = 0;
            connectWebSocket();
        }
    }

    function handleOffline() {
        console.log('Network connection lost');
        showToast('Network connection lost', 'error');
        updateStatus('offline');
        updateConnectionMode('offline');
        
        stopHttpPolling();
        if (state.ws) {
            state.ws.close();
        }
    }

    // ============================================
    // Initialization
    // ============================================

    /**
     * Initialize the application
     */
    async function init() {
        console.log('🎵 Initializing Akira Status Page v2.1.0...');
        console.log(`📍 Server: ${CONFIG.server.host}`);
        console.log(`🔐 Secure: ${CONFIG.server.secure}`);
        console.log(`🔗 WebSocket URL: ${URLS.websocket}`);
        console.log(`📊 Stats URL: ${URLS.stats}`);

        // Cache DOM elements
        cacheElements();

        // Initialize music sources
        initMusicSources();

        // Update server address display
        setText('serverAddress', CONFIG.server.host);

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

        // Check server availability first
        console.log('Checking server availability...');
        const isAvailable = await checkServerAvailability();
        
        if (isAvailable) {
            console.log('✅ Server is available, connecting...');
            
            // Try WebSocket first
            connectWebSocket();
            
            // Fallback to HTTP polling if WebSocket doesn't connect
            setTimeout(() => {
                if (!state.isConnected && !state.httpPollInterval) {
                    console.log('WebSocket connection timeout, trying HTTP polling');
                    startHttpPolling();
                }
            }, 8000);
        } else {
            console.log('❌ Server not available');
            updateStatus('offline');
            updateConnectionMode('offline');
            showToast('Server is not reachable. Please check the connection.', 'error');
            
            // Retry check every 30 seconds
            setInterval(async () => {
                if (!state.isConnected && !state.httpPollInterval) {
                    const available = await checkServerAvailability();
                    if (available) {
                        showToast('Server is back online!', 'success');
                        connectWebSocket();
                    }
                }
            }, 30000);
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
        fetchStats,
        fetchServerInfo,
        checkServerAvailability,
        startHttpPolling,
        stopHttpPolling,
        connectWebSocket
    };

})();
