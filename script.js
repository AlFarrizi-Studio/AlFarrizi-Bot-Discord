/**
 * Server Monitor Dashboard - Mapped for Lavalink JSON
 */

const CONFIG = {
    apiUrl: 'https://unclaiming-fully-camron.ngrok-free.dev/all',
    updateInterval: 1000,
    networkChartPoints: 60
};

const state = {
    isConnected: false,
    pingHistory: [],
};

const DOM = {
    connectionStatus: document.getElementById('connectionStatus'),
    statusText: document.querySelector('.status-text'),
    timestamp: document.getElementById('timestamp'),
    lastSync: document.getElementById('lastSync'),
    
    pingValue: document.getElementById('pingValue'),
    pingBars: document.getElementById('pingBars'),
    pingStatus: document.getElementById('pingStatus'),
    
    uptimeDays: document.getElementById('uptimeDays'),
    uptimeHours: document.getElementById('uptimeHours'),
    uptimeMins: document.getElementById('uptimeMins'),
    uptimeSecs: document.getElementById('uptimeSecs'),
    uptimePercent: document.getElementById('uptimePercent'),
    uptimeStatus: document.getElementById('uptimeStatus'),
    
    cpuValue: document.getElementById('cpuValue'),
    cpuGaugeFill: document.getElementById('cpuGaugeFill'),
    cpuCores: document.getElementById('cpuCores'),
    cpuStatus: document.getElementById('cpuStatus'),
    
    memoryUsed: document.getElementById('memoryUsed'),
    memoryTotal: document.getElementById('memoryTotal'),
    memoryPercent: document.getElementById('memoryPercent'),
    memoryUsedBar: document.getElementById('memoryUsedBar'),
    memoryCachedBar: document.getElementById('memoryCachedBar'),
    memoryStatus: document.getElementById('memoryStatus'),
    
    // Disk & Network static (tidak ada di JSON)
    diskUsed: document.getElementById('diskUsed'),
    diskTotal: document.getElementById('diskTotal'),
    diskFree: document.getElementById('diskFree'),
    diskPercent: document.getElementById('diskPercent'),
    diskGaugeFill: document.getElementById('diskGaugeFill'),
    diskStatus: document.getElementById('diskStatus'),
    networkCard: document.querySelector('.network-card'),
};

// Utilities
function padZero(num) { return String(num).padStart(2, '0'); }

function getStatusClass(value, thresholds) {
    if (value < thresholds.good) return 'stat-good';
    if (value < thresholds.warn) return 'stat-warn';
    return 'stat-bad';
}

function updateConnectionStatus(status, message) {
    const el = DOM.connectionStatus;
    el.classList.remove('connected', 'disconnected');
    
    if (status === 'connected') {
        el.classList.add('connected');
        DOM.statusText.textContent = 'Connected';
    } else if (status === 'error') {
        el.classList.add('disconnected');
        DOM.statusText.textContent = message || 'Error';
    } else {
        DOM.statusText.textContent = 'Connecting...';
    }
}

// Fetch Data
async function fetchData() {
    try {
        const response = await fetch(CONFIG.apiUrl, {
            headers: { 'ngrok-skip-browser-warning': 'true' }
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const json = await response.json();
        
        if (!json.success || !json.data) throw new Error('Invalid JSON structure');
        
        state.isConnected = true;
        updateConnectionStatus('connected');
        handleServerData(json.data); // Kirim objek data saja

    } catch (err) {
        console.error('Fetch error:', err);
        state.isConnected = false;
        updateConnectionStatus('error', 'Connection Failed');
    }
}

function handleServerData(data) {
    updateTimestamp();

    // 1. PING
    // Ambil dari network.latency.overall_ms
    if (data.network && data.network.latency) {
        updatePing(data.network.latency.overall_ms);
    }

    // 2. UPTIME
    // Ambil dari statistics.uptime.seconds
    if (data.statistics && data.statistics.uptime) {
        updateUptime(data.statistics.uptime.seconds);
    }

    // 3. CPU
    // Ambil dari statistics.cpu
    if (data.statistics && data.statistics.cpu) {
        const cpuData = data.statistics.cpu;
        const cores = cpuData.cores || 1;
        // Load percentage di JSON Anda 1464 (ini artinya 14.64% atau load average?)
        // Asumsi: 1464 adalah nilai mentah. Jika dibagi 100 = 14.64%.
        // Atau jika itu System Load (misal 14.64 pada 20 core), maka persentase = (14.64 / 20) * 100 = 73%
        // Saya akan asumsikan ini Load Percentage mentah yang perlu dibagi 100, ATAU pakai logic:
        let rawLoad = cpuData.system.load_percentage;
        
        // Jika nilai > 100, kemungkinan adalah 14.64 jika dibagi 100.
        // Tapi karena status "high" dan core 20, kemungkinan besar ini adalah Load Average * 100.
        // Contoh: Load 14.64 pada 20 Core = 73% Usage.
        let cpuPercent = (rawLoad / 100) / cores * 100; 
        
        // Cap di 100% untuk tampilan
        updateCPU(Math.min(cpuPercent, 100), cores);
    }

    // 4. MEMORY
    // Ambil dari statistics.memory
    if (data.statistics && data.statistics.memory) {
        const mem = data.statistics.memory;
        // Kita pakai percentage yang sudah dihitung JSON: 95.04
        const percent = mem.usage.percentage;
        
        // Used: digunakan untuk display. Kita ambil dari allocated megabytes biar masuk akal
        // Total: reservable (max heap)
        updateMemory({
            used: mem.allocated.megabytes, 
            total: mem.reservable.megabytes,
            percent: percent
        });
    }
    
    // Hide Network I/O card karena tidak ada data speed di JSON
    if (DOM.networkCard) DOM.networkCard.style.display = 'none';
    
    // Set Disk to N/A
    DOM.diskUsed.textContent = "N/A";
    DOM.diskTotal.textContent = "N/A";
    DOM.diskFree.textContent = "N/A";
    DOM.diskPercent.textContent = "--";
    DOM.diskStatus.textContent = "No Data";
    DOM.diskStatus.className = "stat-info";
}

function updateTimestamp() {
    const now = new Date();
    DOM.timestamp.textContent = now.toLocaleTimeString('id-ID');
    DOM.lastSync.textContent = now.toLocaleTimeString('id-ID');
}

function updatePing(ms) {
    const val = Math.round(ms);
    DOM.pingValue.textContent = val;
    
    const cls = getStatusClass(val, { good: 100, warn: 300 }); // Threshold lebih tinggi untuk Lavalink
    DOM.pingStatus.className = cls;
    DOM.pingStatus.textContent = cls === 'stat-good' ? 'Excellent' : cls === 'stat-warn' ? 'OK' : 'High Latency';
    
    state.pingHistory.push(val);
    if (state.pingHistory.length > 10) state.pingHistory.shift();
    
    const bars = DOM.pingBars.querySelectorAll('.bar');
    const max = Math.max(...state.pingHistory, 100);
    bars.forEach((bar, i) => {
        const v = state.pingHistory[i] || 0;
        bar.style.height = `${Math.max(4, (v / max) * 40)}px`;
        bar.classList.remove('active', 'warning', 'danger');
        if (v > 0) {
            if (v < 100) bar.classList.add('active');
            else if (v < 300) bar.classList.add('warning');
            else bar.classList.add('danger');
        }
    });
}

function updateUptime(seconds) {
    const sec = parseInt(seconds);
    DOM.uptimeDays.textContent = padZero(Math.floor(sec / 86400));
    DOM.uptimeHours.textContent = padZero(Math.floor((sec % 86400) / 3600));
    DOM.uptimeMins.textContent = padZero(Math.floor((sec % 3600) / 60));
    DOM.uptimeSecs.textContent = padZero(sec % 60);
    DOM.uptimePercent.textContent = '100%'; // Asumsi online
    DOM.uptimeStatus.className = 'stat-good';
    DOM.uptimeStatus.textContent = 'Online';
}

function updateCPU(val, cores) {
    DOM.cpuValue.textContent = Math.round(val);
    DOM.cpuCores.textContent = cores;
    
    const arc = 251.33;
    DOM.cpuGaugeFill.setAttribute('stroke-dasharray', `${(val / 100) * arc} ${arc}`);
    
    const cls = getStatusClass(val, { good: 60, warn: 85 });
    DOM.cpuStatus.className = cls;
    DOM.cpuStatus.textContent = cls === 'stat-good' ? 'Normal' : cls === 'stat-warn' ? 'Load High' : 'Critical';
}

function updateMemory(data) {
    const usedGB = (data.used / 1024).toFixed(2); // Convert MB to GB
    const totalGB = (data.total / 1024).toFixed(2); // Convert MB to GB
    
    DOM.memoryUsed.textContent = usedGB + ' GB';
    DOM.memoryTotal.textContent = totalGB + ' GB';
    DOM.memoryPercent.textContent = Math.round(data.percent) + '%';
    
    DOM.memoryUsedBar.style.width = `${data.percent}%`;
    DOM.memoryCachedBar.style.width = '0%'; // Reset cached

    const cls = getStatusClass(data.percent, { good: 70, warn: 90 });
    DOM.memoryStatus.className = cls;
    DOM.memoryStatus.textContent = cls === 'stat-good' ? 'Healthy' : cls === 'stat-warn' ? 'High' : 'Critical';
}

function init() {
    console.log('Dashboard Initializing (Lavalink Mode)');
    
    // Initialize Ping Bars
    const bars = DOM.pingBars.querySelectorAll('.bar');
    bars.forEach(b => b.style.height = '4px');
    
    fetchData();
    setInterval(fetchData, CONFIG.updateInterval);
    
    setInterval(updateTimestamp, 1000);
    updateTimestamp();
}

document.addEventListener('DOMContentLoaded', init);
