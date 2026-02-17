// Configuration
const CONFIG = {
    apiUrl: 'https://unclaiming-fully-camron.ngrok-free.dev/all',
    refreshInterval: 5000,
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
    refreshCount: document.getElementById('refreshCount')
};

// Utility Functions
function formatBytes(megabytes, decimals = 2) {
    if (megabytes >= 1024) {
        return (megabytes / 1024).toFixed(decimals) + ' GB';
    }
    return megabytes.toFixed(decimals) + ' MB';
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
    
    // Change color based on percentage
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
    countdownValue = 5;
    updateCountdownDisplay();
    
    if (countdownTimer) clearInterval(countdownTimer);
    
    countdownTimer = setInterval(() => {
        countdownValue--;
        updateCountdownDisplay();
        
        if (countdownValue <= 0) {
            countdownValue = 5;
        }
    }, 1000);
}

function updateCountdownDisplay() {
    elements.refreshCount.textContent = `Next: ${countdownValue}s`;
}

// Data Rendering Functions
function renderServerStatus(data) {
    const { status, statistics } = data;
    
    setBadgeStatus(elements.serverStatus, status.server, status.server);
    setBadgeStatus(elements.healthyStatus, status.healthy ? 'healthy' : 'unhealthy', 
        status.healthy ? 'Healthy' : 'Unhealthy');
    
    // Uptime
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
    
    // System load can exceed 100%, cap display at 100%
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
    
    // Source Managers
    elements.sourceCount.textContent = features.source_managers.length + ' sources';
    elements.sourcesContainer.innerHTML = features.source_managers
        .map(source => `<span class="source-tag">${source}</span>`)
        .join('');
    
    // Filters
    elements.filterCount.textContent = features.filters.length + ' filters';
    elements.filtersContainer.innerHTML = features.filters
        .map(filter => `<div class="filter-tag">${filter}</div>`)
        .join('');
}

function renderVersion(data) {
    elements.versionDisplay.textContent = data.version;
}

// Main Data Fetch
async function fetchData() {
    try {
        // FIX: Tambahkan header untuk skip halaman peringatan Ngrok
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
            renderServerStatus(result.data);
            renderNetworkData(result.data);
            renderMemoryData(result.data);
            renderCPUData(result.data);
            renderPlayersData(result.data);
            renderEndpoints(result.data);
            renderFeatures(result.data);
            renderVersion(result.data);
            
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
    // Initial fetch
    fetchData();
    
    // Set up refresh interval
    refreshTimer = setInterval(fetchData, CONFIG.refreshInterval);
    
    // Start countdown display
    startCountdown();
    
    // Update time display
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
