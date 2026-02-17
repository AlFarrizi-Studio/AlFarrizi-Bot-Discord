// Configuration
const CONFIG = {
    apiUrl: 'https://unclaiming-fully-camron.ngrok-free.dev/all',
    refreshInterval: 1000, // 1 Detik
    maxRetries: 3
};

// State
let refreshTimer = null;
let countdownTimer = null;
let countdownValue = 5;
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
    if (megabytes >= 1024) return (megabytes / 1024).toFixed(decimals) + ' GB';
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
    const s = String(status).toLowerCase();
    if (['online', 'healthy', 'good', 'perfect', 'normal'].includes(s)) return 'online';
    if (['warning', 'average', 'poor'].includes(s)) return 'warning';
    if (['error', 'critical', 'bad', 'unhealthy'].includes(s)) return 'critical';
    return 'online';
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
    
    if (percentage > 90) gaugeElement.style.stroke = 'var(--status-critical)';
    else if (percentage > 70) gaugeElement.style.stroke = 'var(--status-warning)';
    else gaugeElement.style.stroke = 'var(--status-online)';
}

function updateTime() {
    const now = new Date();
    elements.lastUpdate.textContent = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function startCountdown() {
    countdownValue = 5;
    updateCountdownDisplay();
    if (countdownTimer) clearInterval(countdownTimer);
    countdownTimer = setInterval(() => {
        countdownValue--;
        if (countdownValue <= 0) countdownValue = 5;
        updateCountdownDisplay();
    }, 1000);
}

function updateCountdownDisplay() {
    elements.refreshCount.textContent = `Next: ${countdownValue}s`;
}

// ==========================================
// DATA RENDERING FUNCTIONS (UPDATED STRUCTURE)
// ==========================================

function renderVersion(data) {
    // NEW: data.server.version.semver
    const version = data.server?.version?.semver || data.version || '--';
    elements.versionDisplay.textContent = version;
}

function renderServerStatus(data) {
    // NEW: data.performance.health
    const health = data.performance?.health || { status: 'Unknown' };
    const uptime = data.performance?.uptime || { formatted: '--' };

    // Server dianggap online jika fetch berhasil
    setBadgeStatus(elements.serverStatus, 'online', 'Online');
    
    // Status kesehatan (Critical, Good, etc.)
    setBadgeStatus(elements.healthyStatus, health.status, health.status);
    
    elements.uptimeDisplay.textContent = uptime.formatted;
}

function renderNetworkData(data) {
    // NEW: data.response_time_ms ( ada di root data)
    const latency = data.response_time_ms;
    
    elements.latencyOverall.textContent = latency;
    elements.latencyAvg.textContent = latency + ' ms'; // Average sama dengan response time
    
    // Logika status sederhana
    let status = 'good';
    if (latency > 300) status = 'poor';
    if (latency > 500) status = 'error';
    
    setLatencyStatus(elements.latencyStatus, status);
}

function renderMemoryData(data) {
    // NEW: data.performance.memory
    const mem = data.performance?.memory;
    if (!mem) return;

    // Parsing "92.26%" -> 92.26
    const percentRaw = parseFloat(mem.usage_percent);
    const percent = isNaN(percentRaw) ? 0 : percentRaw;

    elements.memoryPercent.textContent = percent.toFixed(1);
    updateGauge(elements.memoryGauge, percent);
    
    // Status logic
    let status = 'normal';
    if (percent > 90) status = 'critical';
    else if (percent > 70) status = 'warning';
    
    setMemoryStatus(elements.memoryStatus, status);
    
    // Parsing "85.45 MB"
    elements.memUsed.textContent = mem.used?.formatted || '-- MB';
    elements.memFree.textContent = mem.free?.formatted || '-- GB';
}

function renderCPUData(data) {
    // NEW: data.performance.cpu
    const cpu = data.performance?.cpu;
    if (!cpu) return;

    // Parsing "1651.00%" -> 1651
    const systemLoad = parseFloat(cpu.system_load);
    const lavalinkLoad = parseFloat(cpu.lavalink_load);

    elements.cpuLavalink.textContent = lavalinkLoad.toFixed(2) + '%';
    elements.cpuLavalinkBar.style.width = Math.min(lavalinkLoad, 100) + '%';
    elements.cpuLavalinkBar.classList.toggle('high', lavalinkLoad > 70);

    const systemDisplay = Math.min(systemLoad, 100);
    elements.cpuSystem.textContent = systemLoad.toFixed(2) + '%';
    elements.cpuSystemBar.style.width = systemDisplay + '%';
    elements.cpuSystemBar.classList.toggle('high', systemLoad > 70);

    elements.cpuCores.textContent = cpu.cores;
}

function renderPlayersData(data) {
    // NEW: data.audio_stats.players
    const players = data.audio_stats?.players;
    if (!players) return;

    elements.playersTotal.textContent = players.total;
    elements.playersPlaying.textContent = players.playing;
    elements.playersIdle.textContent = players.idle;
    
    const activity = players.total > 0 ? ((players.playing / players.total) * 100).toFixed(1) : 0;
    elements.playersActivity.textContent = activity + '%';
}

function renderEndpoints(data) {
    // CHECK: Jika endpoints tidak ada di JSON baru, skip atau clear
    if (!data.network || !data.network.endpoints) {
        elements.endpointsGrid.innerHTML = '<div class="empty-state" style="grid-column:1/-1; padding:10px; border:none;">Endpoint data unavailable</div>';
        return;
    }
    
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
    // NEW: data.server.capabilities
    const caps = data.server?.capabilities || { sources: [], filters: [] };

    // 1. Source Managers
    const sourceManagers = caps.sources || [];
    elements.sourceCount.textContent = sourceManagers.length;
    
    elements.sourcesContainer.innerHTML = sourceManagers
        .map(source => {
            const iconPath = `assets/icons/${source.toLowerCase()}.png`;
            return `
                <span class="source-tag">
                    <img src="${iconPath}" class="source-icon" alt="${source}" onerror="this.style.display='none'">
                    ${source}
                </span>
            `;
        })
        .join('');
        
    // 2. Filters
    const audioFilters = caps.filters || [];
    elements.filterCount.textContent = audioFilters.length;
    elements.filtersContainer.innerHTML = audioFilters
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
                    <circle cx="12" cy="12" r="10"/><path d="M8 12h8M12 8v8"/>
                </svg>
                <span>No track playing</span>
            </div>
        `;
        return;
    }
    
    container.innerHTML = '';
    
    tracks.forEach(track => {
        // NEW STRUCTURE MAPPING
        const meta = track.metadata || {};
        const playback = track.playback_state || {};
        
        const title = meta.title || 'Unknown Title';
        const author = meta.author || 'Unknown Artist';
        const artwork = meta.artwork_url || 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f3b5.png';
        const source = meta.source || 'unknown';
        
        const duration = playback.duration?.raw || 0;
        const position = playback.position?.raw || 0;
        
        const card = document.createElement('div');
        card.className = 'track-card';
        
        card.innerHTML = `
            <div class="track-cover">
                <img src="${artwork}" alt="${title}" onerror="this.src='https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f3b5.png'">
                <div class="play-overlay">
                    <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
                </div>
            </div>
            <div class="track-info">
                <span class="track-title" title="${title}">${title}</span>
                <span class="track-artist" title="${author}">${author}</span>
                <div class="track-footer">
                    <span class="track-source">${source}</span>
                    <span class="track-duration">${formatDuration(position)} / ${formatDuration(duration)}</span>
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
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
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

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

window.addEventListener('beforeunload', () => {
    if (refreshTimer) clearInterval(refreshTimer);
    if (countdownTimer) clearInterval(countdownTimer);
});
