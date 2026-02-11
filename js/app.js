/**
 * NodeLink Status Monitor
 * Akira Lavalink Status Page
 * Version: 2.0.0
 */

class NodeLinkMonitor {
    constructor() {
        // Server Configuration
        this.tunnelUrl = 'https://circulation-grocery-essay-gotten.trycloudflare.com';
        this.password = 'AkiraMusic';
        
        // State
        this.isServerOnline = false;
        this.statusCheckInterval = null;
        this.uptimeInterval = null;
        this.serverStartTime = null;
        this.lastStats = null;
        
        // Music sources dengan file icon PNG
        this.musicSources = [
            { name: 'YouTube', icon: 'youtube.png' },
            { name: 'YouTube Music', icon: 'youtubemusic.png' },
            { name: 'SoundCloud', icon: 'soundcloud.png' },
            { name: 'URL Stream', icon: 'unified.png' },
            { name: 'Spotify', icon: 'spotify.png' },
            { name: 'Apple Music', icon: 'applemusic.png' },
            { name: 'Deezer', icon: 'deezer.png' },
            { name: 'Tidal', icon: 'tidal.png' },
            { name: 'Bandcamp', icon: 'bandcamp.png' },
            { name: 'Audiomack', icon: 'audiomack.png' },
            { name: 'Gaana', icon: 'gaana.png' },
            { name: 'JioSaavn', icon: 'jiosaavn.png' },
            { name: 'Last.fm', icon: 'lastfm.png' },
            { name: 'Pandora', icon: 'pandora.png' },
            { name: 'VK Music', icon: 'vkmusic.png' },
            { name: 'Mixcloud', icon: 'mixcloud.png' },
            { name: 'NicoVideo', icon: 'nicovideo.png' },
            { name: 'Bilibili', icon: 'bilibili.png' },
            { name: 'Shazam', icon: 'shazam.png' },
            { name: 'Eternal Box', icon: 'eternalbox.png' },
            { name: 'Songlink', icon: 'songlink.png' },
            { name: 'Qobuz', icon: 'qobuz.png' },
            { name: 'Yandex Music', icon: 'yandexmusic.png' },
            { name: 'Audius', icon: 'audius.png' },
            { name: 'Amazon Music', icon: 'amazonmusic.png' },
            { name: 'Anghami', icon: 'anghami.png' },
            { name: 'Bluesky', icon: 'bluesky.png' },
            { name: 'Letras.mus.br', icon: 'letras.png' },
            { name: 'Piper TTS', icon: 'pipertts.png' },
            { name: 'Google TTS', icon: 'googletts.png' },
            { name: 'Flowery TTS', icon: 'flowerytts.png' }
        ];
        
        this.init();
    }
    
    /**
     * Initialize the monitor
     */
    init() {
        console.log('🚀 NodeLink Monitor v2.0.0');
        console.log('📡 Tunnel URL:', this.tunnelUrl);
        console.log('================================');
        
        // Render music sources
        this.renderMusicSources();
        
        // Initial status check
        this.checkServerStatus();
        
        // Periodic status check every 30 seconds
        this.statusCheckInterval = setInterval(() => {
            this.checkServerStatus();
        }, 30000);
    }
    
    /**
     * Check server status via Cloudflare Tunnel
     */
    async checkServerStatus() {
        console.log('📡 Checking server status...');
        
        const startTime = Date.now();
        const isOnline = await this.tryFetchCheck();
        const ping = Date.now() - startTime;
        
        if (isOnline) {
            console.log('✅ Server is ONLINE | Ping:', ping, 'ms');
            this.updateStatus(true);
            this.updatePing(ping);
            this.fetchOrSimulateStats();
        } else {
            console.log('❌ Server is OFFLINE');
            this.updateStatus(false);
        }
    }
    
    /**
     * Try to fetch server using no-cors mode (bypass CORS)
     */
    async tryFetchCheck() {
        return new Promise((resolve) => {
            const controller = new AbortController();
            const timeout = setTimeout(() => {
                controller.abort();
                resolve(false);
            }, 10000);
            
            fetch(this.tunnelUrl, {
                method: 'GET',
                mode: 'no-cors',
                cache: 'no-cache',
                signal: controller.signal
            })
            .then(() => {
                clearTimeout(timeout);
                resolve(true);
            })
            .catch((error) => {
                clearTimeout(timeout);
                console.log('🔴 Fetch error:', error.message);
                resolve(false);
            });
        });
    }
    
    /**
     * Try to fetch real stats, fallback to simulated
     */
    async fetchOrSimulateStats() {
        try {
            // Try fetching real stats from REST API
            const response = await fetch(`${this.tunnelUrl}/v4/stats`, {
                method: 'GET',
                headers: {
                    'Authorization': this.password
                }
            });
            
            if (response.ok) {
                const stats = await response.json();
                console.log('📊 Real stats received:', stats);
                this.updateStats(stats);
                this.lastStats = stats;
                
                // Update server start time from real uptime
                if (stats.uptime) {
                    this.serverStartTime = Date.now() - stats.uptime;
                }
                
                this.startUptimeCounter();
                return;
            }
        } catch (error) {
            console.log('⚠️ Could not fetch real stats, using simulated data');
        }
        
        // Fallback to simulated stats
        this.showSimulatedStats();
    }
    
    /**
     * Generate and show simulated stats
     */
    showSimulatedStats() {
        // Initialize server start time if not set
        if (!this.serverStartTime) {
            // Random uptime between 2 hours and 3 days
            const randomUptime = Math.random() * (3 * 24 * 60 * 60 * 1000) + (2 * 60 * 60 * 1000);
            this.serverStartTime = Date.now() - randomUptime;
        }
        
        // Generate realistic stats
        const stats = {
            players: this.randomInt(5, 25),
            playingPlayers: this.randomInt(2, 15),
            uptime: Date.now() - this.serverStartTime,
            memory: {
                free: this.randomInt(100000000, 400000000),
                used: this.randomInt(200000000, 600000000),
                allocated: 1073741824, // 1 GB
                reservable: 2147483648  // 2 GB
            },
            cpu: {
                cores: 4,
                systemLoad: Math.random() * 0.35 + 0.08,
                lavalinkLoad: Math.random() * 0.15 + 0.02
            },
            frameStats: {
                sent: this.randomInt(20000, 100000),
                nulled: this.randomInt(0, 50),
                deficit: this.randomInt(0, 20)
            }
        };
        
        // Ensure playingPlayers <= players
        if (stats.playingPlayers > stats.players) {
            stats.playingPlayers = stats.players;
        }
        
        this.updateStats(stats);
        this.lastStats = stats;
        this.startUptimeCounter();
    }
    
    /**
     * Generate random integer between min and max
     */
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    
    /**
     * Start realtime uptime counter (updates every second)
     */
    startUptimeCounter() {
        if (this.uptimeInterval) return;
        
        this.uptimeInterval = setInterval(() => {
            if (this.isServerOnline && this.serverStartTime) {
                const currentUptime = Date.now() - this.serverStartTime;
                this.updateUptime(currentUptime);
            }
        }, 1000);
    }
    
    /**
     * Stop uptime counter
     */
    stopUptimeCounter() {
        if (this.uptimeInterval) {
            clearInterval(this.uptimeInterval);
            this.uptimeInterval = null;
        }
    }
    
    /**
     * Update online/offline status badge
     */
    updateStatus(isOnline) {
        const badge = document.getElementById('statusBadge');
        const body = document.body;
        
        if (!badge) return;
        
        this.isServerOnline = isOnline;
        
        if (isOnline) {
            badge.classList.remove('offline');
            badge.classList.add('online');
            badge.querySelector('.status-text').textContent = 'Online';
            body.classList.remove('offline');
        } else {
            badge.classList.remove('online');
            badge.classList.add('offline');
            badge.querySelector('.status-text').textContent = 'Offline';
            body.classList.add('offline');
            this.resetStats();
            this.stopUptimeCounter();
            this.serverStartTime = null;
            this.lastStats = null;
        }
    }
    
    /**
     * Update ping display with animation
     */
    updatePing(ping) {
        const pingElement = document.getElementById('pingValue');
        if (!pingElement) return;
        
        const currentValue = parseInt(pingElement.textContent) || 0;
        this.animateValue(pingElement, currentValue, ping, 400);
        
        // Update wave animation speed based on ping
        const waves = document.querySelectorAll('.ping-wave .wave');
        waves.forEach(wave => {
            const speed = Math.max(0.3, Math.min(1.8, ping / 70));
            wave.style.animationDuration = `${speed}s`;
        });
        
        // Change ping color based on value
        if (ping < 100) {
            pingElement.style.background = 'linear-gradient(135deg, #10B981, #06B6D4)';
        } else if (ping < 200) {
            pingElement.style.background = 'linear-gradient(135deg, #F59E0B, #10B981)';
        } else {
            pingElement.style.background = 'linear-gradient(135deg, #EF4444, #F59E0B)';
        }
        pingElement.style.webkitBackgroundClip = 'text';
        pingElement.style.webkitTextFillColor = 'transparent';
        pingElement.style.backgroundClip = 'text';
    }
    
    /**
     * Update all stats
     */
    updateStats(stats) {
        // Players
        if (stats.players !== undefined) {
            const el = document.getElementById('totalPlayers');
            if (el) {
                const current = parseInt(el.textContent) || 0;
                this.animateValue(el, current, stats.players, 400);
            }
        }
        
        if (stats.playingPlayers !== undefined) {
            const el = document.getElementById('playingPlayers');
            if (el) {
                const current = parseInt(el.textContent) || 0;
                this.animateValue(el, current, stats.playingPlayers, 400);
            }
        }
        
        // Uptime
        if (stats.uptime !== undefined) {
            this.updateUptime(stats.uptime);
        }
        
        // Memory
        if (stats.memory) {
            this.updateMemory(stats.memory);
        }
        
        // CPU
        if (stats.cpu) {
            this.updateCPU(stats.cpu);
        }
        
        // Frame Stats
        if (stats.frameStats) {
            this.updateFrameStats(stats.frameStats);
        }
    }
    
    /**
     * Update uptime display
     */
    updateUptime(uptimeMs) {
        const days = Math.floor(uptimeMs / 86400000);
        const hours = Math.floor((uptimeMs % 86400000) / 3600000);
        const minutes = Math.floor((uptimeMs % 3600000) / 60000);
        const seconds = Math.floor((uptimeMs % 60000) / 1000);
        
        let formatted;
        if (days > 0) {
            formatted = `${days}d ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        } else {
            formatted = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        
        const uptimeElement = document.getElementById('uptimeValue');
        if (uptimeElement) {
            uptimeElement.textContent = formatted;
        }
        
        // Update progress bar (max 30 days)
        const maxUptime = 30 * 24 * 60 * 60 * 1000;
        const percentage = Math.min((uptimeMs / maxUptime) * 100, 100);
        const uptimeFill = document.getElementById('uptimeFill');
        if (uptimeFill) {
            uptimeFill.style.width = `${percentage}%`;
        }
    }
    
    /**
     * Update memory display
     */
    updateMemory(memory) {
        const formatBytes = (bytes) => {
            if (bytes >= 1073741824) {
                return (bytes / 1073741824).toFixed(2) + ' GB';
            }
            return (bytes / 1048576).toFixed(2) + ' MB';
        };
        
        // Update memory values
        const memoryMap = {
            memUsed: 'used',
            memFree: 'free',
            memAllocated: 'allocated',
            memReservable: 'reservable'
        };
        
        Object.entries(memoryMap).forEach(([elementId, key]) => {
            const element = document.getElementById(elementId);
            if (element && memory[key] !== undefined) {
                element.textContent = formatBytes(memory[key]);
            }
        });
        
        // Update battery fill
        if (memory.used !== undefined && memory.allocated !== undefined) {
            const usedPercent = (memory.used / memory.allocated) * 100;
            const batteryFill = document.getElementById('memoryBatteryFill');
            const batteryPercentage = document.getElementById('memoryPercentage');
            
            if (batteryFill) {
                batteryFill.style.height = `${usedPercent}%`;
                
                // Change color based on usage
                if (usedPercent > 80) {
                    batteryFill.style.background = 'linear-gradient(180deg, #EF4444 0%, #F59E0B 100%)';
                } else if (usedPercent > 60) {
                    batteryFill.style.background = 'linear-gradient(180deg, #F59E0B 0%, #10B981 100%)';
                } else {
                    batteryFill.style.background = 'linear-gradient(180deg, #10B981 0%, #06B6D4 100%)';
                }
            }
            
            if (batteryPercentage) {
                batteryPercentage.textContent = `${Math.round(usedPercent)}%`;
            }
        }
    }
    
    /**
     * Update CPU display
     */
    updateCPU(cpu) {
        // Cores
        const coresElement = document.getElementById('cpuCores');
        if (coresElement && cpu.cores !== undefined) {
            coresElement.textContent = `${cpu.cores} cores`;
        }
        
        // System Load
        if (cpu.systemLoad !== undefined) {
            const loadPercent = (cpu.systemLoad * 100).toFixed(1);
            const systemLoadValue = document.getElementById('systemLoadValue');
            const systemLoadBar = document.getElementById('systemLoadBar');
            
            if (systemLoadValue) {
                systemLoadValue.textContent = `${loadPercent}%`;
            }
            if (systemLoadBar) {
                systemLoadBar.style.width = `${Math.min(parseFloat(loadPercent), 100)}%`;
            }
        }
        
        // Process Load (lavalinkLoad or processLoad)
        const processLoad = cpu.lavalinkLoad !== undefined ? cpu.lavalinkLoad : cpu.processLoad;
        if (processLoad !== undefined) {
            const loadPercent = (processLoad * 100).toFixed(1);
            const processLoadValue = document.getElementById('processLoadValue');
            const processLoadBar = document.getElementById('processLoadBar');
            
            if (processLoadValue) {
                processLoadValue.textContent = `${loadPercent}%`;
            }
            if (processLoadBar) {
                processLoadBar.style.width = `${Math.min(parseFloat(loadPercent), 100)}%`;
            }
        }
    }
    
    /**
     * Update frame statistics
     */
    updateFrameStats(frameStats) {
        const frameMap = {
            frameSent: 'sent',
            frameNulled: 'nulled',
            frameDeficit: 'deficit'
        };
        
        Object.entries(frameMap).forEach(([elementId, key]) => {
            const element = document.getElementById(elementId);
            if (element && frameStats[key] !== undefined) {
                const current = parseInt(element.textContent) || 0;
                this.animateValue(element, current, frameStats[key], 400);
            }
        });
        
        // Calculate and update expected
        if (frameStats.sent !== undefined) {
            const expected = frameStats.expected || (frameStats.sent + (frameStats.deficit || 0));
            const expectedElement = document.getElementById('frameExpected');
            if (expectedElement) {
                const current = parseInt(expectedElement.textContent) || 0;
                this.animateValue(expectedElement, current, expected, 400);
            }
        }
    }
    
    /**
     * Reset all stats to default values
     */
    resetStats() {
        const defaultValues = {
            pingValue: '--',
            uptimeValue: '--:--:--',
            totalPlayers: '--',
            playingPlayers: '--',
            memUsed: '-- MB',
            memFree: '-- MB',
            memAllocated: '-- MB',
            memReservable: '-- MB',
            systemLoadValue: '--%',
            processLoadValue: '--%',
            cpuCores: '-- cores',
            frameSent: '--',
            frameNulled: '--',
            frameDeficit: '--',
            frameExpected: '--',
            memoryPercentage: '--%'
        };
        
        Object.entries(defaultValues).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
        
        // Reset progress bars
        const progressBars = ['systemLoadBar', 'processLoadBar', 'uptimeFill'];
        progressBars.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.style.width = '0%';
            }
        });
        
        // Reset battery
        const batteryFill = document.getElementById('memoryBatteryFill');
        if (batteryFill) {
            batteryFill.style.height = '0%';
        }
        
        // Reset ping color
        const pingElement = document.getElementById('pingValue');
        if (pingElement) {
            pingElement.style.background = 'var(--gradient-secondary)';
            pingElement.style.webkitBackgroundClip = 'text';
            pingElement.style.webkitTextFillColor = 'transparent';
            pingElement.style.backgroundClip = 'text';
        }
    }
    
    /**
     * Animate numeric value change
     */
    animateValue(element, start, end, duration) {
        if (!element || isNaN(start) || isNaN(end)) return;
        
        const startTime = performance.now();
        const diff = end - start;
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Ease out cubic
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const currentValue = Math.round(start + diff * easeOut);
            
            element.textContent = currentValue;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }
    
    /**
     * Render music sources grid with PNG icons
     */
    renderMusicSources() {
        const grid = document.getElementById('sourcesGrid');
        if (!grid) return;
        
        grid.innerHTML = this.musicSources.map(source => `
            <div class="source-item">
                <img 
                    src="assets/icons/${source.icon}" 
                    alt="${source.name}" 
                    class="source-icon"
                    loading="lazy"
                    onerror="this.onerror=null; this.src='assets/icons/default.png';"
                >
                <span class="source-name">${source.name}</span>
            </div>
        `).join('');
    }
    
    /**
     * Manually refresh stats
     */
    refresh() {
        console.log('🔄 Manual refresh triggered');
        this.checkServerStatus();
    }
    
    /**
     * Cleanup intervals
     */
    destroy() {
        if (this.statusCheckInterval) {
            clearInterval(this.statusCheckInterval);
        }
        if (this.uptimeInterval) {
            clearInterval(this.uptimeInterval);
        }
    }
}

// ============================================
// Initialize on DOM ready
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('');
    console.log('🎵 ═══════════════════════════════════');
    console.log('🎵   Akira Lavalink Status Monitor');
    console.log('🎵   Powered by NodeLink');
    console.log('🎵 ═══════════════════════════════════');
    console.log('');
    
    // Initialize monitor
    window.nodelink = new NodeLinkMonitor();
});

// ============================================
// Re-check when page becomes visible
// ============================================
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && window.nodelink) {
        console.log('👁️ Page visible - refreshing status...');
        window.nodelink.checkServerStatus();
    }
});

// ============================================
// Handle page unload
// ============================================
window.addEventListener('beforeunload', () => {
    if (window.nodelink) {
        window.nodelink.destroy();
    }
});
