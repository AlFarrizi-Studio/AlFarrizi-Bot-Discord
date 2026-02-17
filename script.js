// Configuration
const CONFIG = {
    apiUrl: 'https://unclaiming-fully-camron.ngrok-free.dev/all',
    refreshInterval: 1000, // 1 Detik
    maxRetries: 3
};

// State
let refreshTimer = null;
let countdownTimer = null;
let countdownValue = 1;
let retryCount = 0;

// DOM Elements Cache
const elements = {
    lastUpdate: document.getElementById('lastUpdate'),
    versionDisplay: document.getElementById('versionDisplay'),
    serverStatus: document.getElementById('serverStatus'),
    healthyStatus: document.getElementById('healthyStatus'),
    uptimeDisplay: document.getElementById('uptimeDisplay'),
    latencyOverall: document.getElementById('latencyOverall'),
    latencyAvg: document.getElementById('latencyAvg'),
    latencyStatus: document.getElementById('latencyStatus'),
    memoryPercent: document.getElementById('memoryPercent'),
    memoryGauge: document.getElementById('memoryGauge'),
    memoryStatus: document.getElementById('memoryStatus'),
    memUsed: document.getElementById('memUsed'),
    memFree: document.getElementById('memFree'),
    cpuLavalink: document.getElementById('cpuLavalink'),
    cpuLavalinkBar: document.getElementById('cpuLavalinkBar'),
    cpuSystem: document.getElementById('cpuSystem'),
    cpuSystemBar: document.getElementById('cpuSystemBar'),
    cpuCores: document.getElementById('cpuCores'),
    playersTotal: document.getElementById('playersTotal'),
    playersPlaying: document.getElementById('playersPlaying'),
    playersIdle: document.getElementById('playersIdle'),
    playersActivity: document.getElementById('playersActivity'),
    endpointsGrid: document.getElementById('endpointsGrid'),
    sourcesContainer: document.getElementById('sourcesContainer'),
    sourceCount: document.getElementById('sourceCount'),
    filtersContainer: document.getElementById('filtersContainer'),
    filterCount: document.getElementById('filterCount'),
    refreshCount: document.getElementById('refreshCount'),
    tracksContainer: document.getElementById('tracksContainer'),
    playerCountBadge: document.getElementById('playerCountBadge')
};

// Utility Functions
function formatBytes(megabytes, decimals = 2) {
    if (megabytes >= 1024) {
        return (megabytes / 1024).toFixed(decimals) + ' GB';
    }
    return megabytes.toFixed(decimals) + ' MB';
}

function formatDuration(ms) {
    if (!ms || ms <= 0) return '00:00';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function getStatusClass(status) {
    const statusMap = {
        'online': 'online',
        'offline': 'offline',
        'healthy': 'healthy',
        'unhealthy': 'unhealthy',
        'true': 'healthy',
        'false': 'unhealthy',
        'good': 'good',
        'poor': 'poor',
        'error': 'error',
        'normal': 'normal',
        'critical': 'critical',
        'high': 'high'
    };
    return statusMap[String(status).toLowerCase()] || '';
}

function setBadgeStatus(element, status, text = null) {
    element.className = 'status-badge ' + getStatusClass(status);
    element.textContent = text || status;
}

function setLatencyStatus(element, status) {
    element.className = 'latency-status ' + getStatusClass(status);
    element.textContent = status.toUpperCase();
}

function setMemoryStatus(element, status) {
    element.className = 'memory-status ' + getStatusClass(status);
    element.textContent = status.toUpperCase();
}

function updateGauge(gaugeElement, percentage) {
    const circumference = 314;
    const offset = circumference - (percentage / 100) * circumference;
    gaugeElement.style.strokeDashoffset = Math.max(0, offset);
    
    if (percentage > 90) {
        gaugeElement.style.stroke = 'var(--status-critical)';
    } else if (percentage > 70) {
        gaugeElement.style.stroke = 'var(--status-warning)';
    } else {
        gaugeElement.style.stroke = 'var(--status-online)';
    }
}

function updateTime() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('id-ID', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
    });
    elements.lastUpdate.textContent = timeStr;
}

function startCountdown() {
    countdownValue = 1;
    updateCountdownDisplay();
    
    if (countdownTimer) clearInterval(countdownTimer);
    
    countdownTimer = setInterval(() => {
        countdownValue--;
        if (countdownValue <= 0) countdownValue = 1;
        updateCountdownDisplay();
    }, 1000);
}

function updateCountdownDisplay() {
    elements.refreshCount.textContent = `Next: ${countdownValue}s`;
}

// Data Rendering Functions
function renderVersion(data) {
    elements.versionDisplay.textContent = data.version || '--';
}

function renderServerStatus(data) {
    const { status, statistics } = data;
    
    setBadgeStatus(elements.serverStatus, status.server, status.server);
    setBadgeStatus(elements.healthyStatus, status.healthy ? 'healthy' : 'unhealthy', 
        status.healthy ? 'Healthy' : 'Unhealthy');
    
    elements.uptimeDisplay.textContent = statistics.uptime.formatted;
}

function renderNetworkData(data) {
    const { network } = data;
    
    elements.latencyOverall.textContent = network.latency.overall_ms;
    elements.latencyAvg.textContent = network.latency.average_ms.toFixed(2) + ' ms';
    setLatencyStatus(elements.latencyStatus, network.latency.status);
}

function renderMemoryData(data) {
    const { memory } = data.statistics;
    
    elements.memoryPercent.textContent = memory.usage.percentage.toFixed(1);
    updateGauge(elements.memoryGauge, memory.usage.percentage);
    setMemoryStatus(elements.memoryStatus, memory.usage.status);
    
    elements.memUsed.textContent = formatBytes(memory.used.megabytes);
    elements.memFree.textContent = formatBytes(memory.free.megabytes);
}

function renderCPUData(data) {
    const { cpu } = data.statistics;
    
    const lavalinkLoad = cpu.lavalink.load_percentage;
    const systemLoad = cpu.system.load_percentage;
    
    elements.cpuLavalink.textContent = lavalinkLoad + '%';
    elements.cpuLavalinkBar.style.width = Math.min(lavalinkLoad, 100) + '%';
    elements.cpuLavalinkBar.classList.toggle('high', lavalinkLoad > 70);
    
    const systemDisplay = Math.min(systemLoad, 100);
    elements.cpuSystem.textContent = systemLoad + '%';
    elements.cpuSystemBar.style.width = systemDisplay + '%';
    elements.cpuSystemBar.classList.toggle('high', systemLoad > 70);
    
    elements.cpuCores.textContent = cpu.cores;
}

function renderPlayersData(data) {
    const { players } = data.statistics;
    
    elements.playersTotal.textContent = players.total;
    elements.playersPlaying.textContent = players.playing;
    elements.playersIdle.textContent = players.idle;
    elements.playersActivity.textContent = (players.activity_rate * 100).toFixed(1) + '%';
}

function renderEndpoints(data) {
    const { endpoints } = data.network;
    const grid = elements.endpointsGrid;
    grid.innerHTML = '';
    
    Object.entries(endpoints).forEach(([name, info]) => {
        const item = document.createElement('div');
        item.className = `endpoint-item ${info.status}`;
        
        item.innerHTML = `
            <span class="endpoint-name">/${name}</span>
            <div class="endpoint-latency">
                <span class="endpoint-ms mono">${info.latency_ms}ms</span>
                <span class="endpoint-status-dot ${info.status}"></span>
            </div>
        `;
        
        grid.appendChild(item);
    });
}

function renderFeatures(data) {
    const { features } = data.information;
    
    // Sources
    elements.sourceCount.textContent = features.source_managers.length;
    elements.sourcesContainer.innerHTML = features.source_managers
        .map(source => `<span class="source-tag">${source}</span>`)
        .join('');
        
    // Filters
    elements.filterCount.textContent = features.filters.length;
    elements.filtersContainer.innerHTML = features.filters
        .map(filter => `<span class="filter-tag">${filter}</span>`)
        .join('');
}

function renderNowPlaying(data) {
    const tracks = data.now_playing;
    const container = elements.tracksContainer;
    
    elements.playerCountBadge.textContent = `${tracks.length} Active`;
    
    if (!tracks || tracks.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:48px;height:48px;opacity:0.5">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M8 12h8M12 8v8"/>
                </svg>
                <span>No track playing</span>
            </div>
        `;
        return;
    }
    
    container.innerHTML = '';
    
    tracks.forEach(track => {
        const info = track.info || {};
        const title = info.title || 'Unknown Title';
        const author = info.author || 'Unknown Artist';
        const duration = info.length || 0;
        const artwork = info.artworkUrl || 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f3b5.png';
        const source = track.info.sourceName || 'unknown';
        
        const card = document.createElement('div');
        card.className = 'track-card';
        
        card.innerHTML = `
            <div class="track-cover">
                <img src="${artwork}" alt="${title}" onerror="this.src='https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f3b5.png'">
                <div class="play-overlay">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5,3 19,12 5,21"/>
                    </svg>
                </div>
            </div>
            <div class="track-info">
                <span class="track-title" title="${title}">${title}</span>
                <span class="track-artist" title="${author}">${author}</span>
                <div class="track-footer">
                    <span class="track-source">${source}</span>
                    <span class="track-duration">${formatDuration(duration)}</span>
                </div>
            </div>
        `;
        
        container.appendChild(card);
    });
}

// Main Data Fetch
async function fetchData() {
    try {
        const response = await fetch(CONFIG.apiUrl, {
            headers: {
                'ngrok-skip-browser-warning': 'true',
                'Accept': 'application/json',
                'User-Agent': 'AlFarrizi-Monitor/1.0'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success && result.data) {
            renderVersion(result.data);
            renderServerStatus(result.data);
            renderNetworkData(result.data);
            renderMemoryData(result.data);
            renderCPUData(result.data);
            renderPlayersData(result.data);
            renderEndpoints(result.data);
            renderFeatures(result.data);
            renderNowPlaying(result.data);
            
            updateTime();
            retryCount = 0;
        }
    } catch (error) {
        console.error('Fetch error:', error);
        retryCount++;
        
        if (retryCount >= CONFIG.maxRetries) {
            elements.serverStatus.textContent = 'ERROR';
            elements.serverStatus.className = 'status-badge offline';
            elements.healthyStatus.textContent = 'RETRY';
            elements.healthyStatus.className = 'status-badge unhealthy';
        }
    }
}

// Initialization
function init() {
    fetchData();
    refreshTimer = setInterval(fetchData, CONFIG.refreshInterval);
    startCountdown();
    updateTime();
    setInterval(updateTime, 1000);
}

// Start when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (refreshTimer) clearInterval(refreshTimer);
    if (countdownTimer) clearInterval(countdownTimer);
});
