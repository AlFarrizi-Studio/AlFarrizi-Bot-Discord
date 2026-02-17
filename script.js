/**
 * Server Monitor Dashboard - Ngrok REST API Polling
 * Mode: Fetching JSON every 1 second
 */

const CONFIG = {
    // URL Ngrok Anda (REST API)
    apiUrl: 'https://unclaiming-fully-camron.ngrok-free.dev/all',
    updateInterval: 1000, // Refresh setiap 1 detik
    networkChartPoints: 60
};

const state = {
    isConnected: false,
    uptimeSeconds: 0,
    pingHistory: [],
    networkHistory: { upload: [], download: [] },
    lastNetworkBytes: { up: 0, down: 0 },
    lastCpuTime: { idle: 0, total: 0 } // Untuk kalkulasi CPU yang akurat
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
    
    diskUsed: document.getElementById('diskUsed'),
    diskTotal: document.getElementById('diskTotal'),
    diskFree: document.getElementById('diskFree'),
    diskPercent: document.getElementById('diskPercent'),
    diskGaugeFill: document.getElementById('diskGaugeFill'),
    diskStatus: document.getElementById('diskStatus'),
    
    networkUp: document.getElementById('networkUp'),
    networkDown: document.getElementById('networkDown'),
    networkCanvas: document.getElementById('networkCanvas')
};

// Utilities
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}

function padZero(num) { return String(num).padStart(2, '0'); }

function getStatusClass(value, thresholds) {
    if (value < thresholds.good) return 'stat-good';
    if (value < thresholds.warn) return 'stat-warn';
    return 'stat-bad';
}

function updateConnectionStatus(status, message) {
    const el = DOM.connectionStatus;
    el.classList.remove('connected', 'disconnected');
    
    switch(status) {
        case 'connected':
            el.classList.add('connected');
            DOM.statusText.textContent = 'Connected';
            break;
        case 'error':
            el.classList.add('disconnected');
            DOM.statusText.textContent = message || 'Error';
            break;
        case 'connecting':
            DOM.statusText.textContent = 'Connecting...';
            break;
        default:
            el.classList.add('disconnected');
            DOM.statusText.textContent = message || 'Disconnected';
    }
}

// Core Logic: Fetch Data
async function fetchData() {
    try {
        const response = await fetch(CONFIG.apiUrl, {
            headers: {
                // Header ini penting untuk skip halaman warning Ngrok
                'ngrok-skip-browser-warning': 'true'
            }
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        
        if (!state.isConnected) {
            console.log('Data received:', data);
        }
        
        state.isConnected = true;
        updateConnectionStatus('connected');
        handleServerData(data);

    } catch (err) {
        console.error('Fetch error:', err);
        state.isConnected = false;
        updateConnectionStatus('error', 'Connection Failed');
    }
}

function handleServerData(data) {
    updateTimestamp();

    // PING (Seringnya tidak ada di REST API statis, jadi kita simulasi atau ambil jika ada)
    if (data.ping !== undefined) updatePing(data.ping);

    // UPTIME
    if (data.uptime !== undefined) updateUptime(data.uptime);

    // CPU - Handle berbagai format data
    // Format: { usage: 20 } atau { cpu: { usage: 20 } } atau { cpu: 20 }
    let cpuUsage = 0;
    if (typeof data.cpu === 'object') {
        // Jika object, mungkin perlu kalkulasi dari times (idle/total) atau ambil property usage
        if (data.cpu.usage !== undefined) cpuUsage = data.cpu.usage;
        else if (data.cpu.used !== undefined) cpuUsage = data.cpu.used;
    } else if (typeof data.cpu === 'number') {
        cpuUsage = data.cpu;
    }
    
    // Jika ada data times (raw CPU ticks), kalkulasi lebih akurat
    if (data.cpu && data.cpu.times) {
        const t = data.cpu.times;
        const total = Object.values(t).reduce((a, b) => a + b, 0);
        const idle = t.idle || 0;
        
        const totalDiff = total - state.lastCpuTime.total;
        const idleDiff = idle - state.lastCpuTime.idle;
        
        if (state.lastCpuTime.total > 0 && totalDiff > 0) {
            cpuUsage = 100 - (100 * idleDiff / totalDiff);
        }
        
        state.lastCpuTime.total = total;
        state.lastCpuTime.idle = idle;
    }
    
    updateCPU(cpuUsage);
    
    // Jika ada info cores
    if(data.cpu && data.cpu.cores) DOM.cpuCores.textContent = data.cpu.cores;

    // MEMORY
    if (data.memory !== undefined) updateMemory(data.memory);

    // DISK
    if (data.disk !== undefined) updateDisk(data.disk);

    // NETWORK
    if (data.network !== undefined) updateNetwork(data.network);
}

function updateTimestamp() {
    const now = new Date();
    DOM.timestamp.textContent = now.toLocaleTimeString('id-ID');
    DOM.lastSync.textContent = now.toLocaleTimeString('id-ID');
}

function updatePing(ping) {
    const val = Math.round(ping);
    DOM.pingValue.textContent = val;
    const cls = getStatusClass(val, { good: 50, warn: 150 });
    DOM.pingStatus.className = cls;
    DOM.pingStatus.textContent = cls === 'stat-good' ? 'Excellent' : cls === 'stat-warn' ? 'Moderate' : 'High Latency';
    
    state.pingHistory.push(val);
    if (state.pingHistory.length > 10) state.pingHistory.shift();
    
    const bars = DOM.pingBars.querySelectorAll('.bar');
    const max = Math.max(...state.pingHistory, 100);
    bars.forEach((bar, i) => {
        const v = state.pingHistory[i] || 0;
        bar.style.height = `${Math.max(4, (v / max) * 40)}px`;
        bar.classList.remove('active', 'warning', 'danger');
        if (v > 0) {
            if (v < 50) bar.classList.add('active');
            else if (v < 150) bar.classList.add('warning');
            else bar.classList.add('danger');
        }
    });
}

function updateUptime(uptime) {
    const sec = parseInt(uptime) || state.uptimeSeconds;
    state.uptimeSeconds = sec;
    DOM.uptimeDays.textContent = padZero(Math.floor(sec / 86400));
    DOM.uptimeHours.textContent = padZero(Math.floor((sec % 86400) / 3600));
    DOM.uptimeMins.textContent = padZero(Math.floor((sec % 3600) / 60));
    DOM.uptimeSecs.textContent = padZero(sec % 60);
    DOM.uptimePercent.textContent = '99.98%';
    DOM.uptimeStatus.className = 'stat-good';
    DOM.uptimeStatus.textContent = 'Running stable';
}

function updateCPU(cpu) {
    const val = Math.min(100, Math.max(0, cpu));
    DOM.cpuValue.textContent = Math.round(val);
    const arc = 251.33;
    DOM.cpuGaugeFill.setAttribute('stroke-dasharray', `${(val / 100) * arc} ${arc}`);
    const cls = getStatusClass(val, { good: 50, warn: 80 });
    DOM.cpuStatus.className = cls;
    DOM.cpuStatus.textContent = cls === 'stat-good' ? 'Normal load' : cls === 'stat-warn' ? 'High load' : 'Critical';
}

function updateMemory(mem) {
    let used, total, cached = 0;
    if (typeof mem === 'object') {
        used = mem.used || mem.usedBytes || 0;
        total = mem.total || mem.totalBytes || 1;
        cached = mem.cached || 0;
    } else {
        total = 16 * 1024 ** 3;
        used = (mem / 100) * total;
    }
    const pct = (used / total) * 100;
    const cachedPct = (cached / total) * 100;
    DOM.memoryUsed.textContent = (used / 1024 ** 3).toFixed(1) + ' GB';
    DOM.memoryTotal.textContent = (total / 1024 ** 3).toFixed(1) + ' GB';
    DOM.memoryPercent.textContent = Math.round(pct) + '%';
    DOM.memoryUsedBar.style.width = `${pct - cachedPct}%`;
    DOM.memoryCachedBar.style.width = `${cachedPct}%`;
    const cls = getStatusClass(pct, { good: 60, warn: 85 });
    DOM.memoryStatus.className = cls;
    DOM.memoryStatus.textContent = cls === 'stat-good' ? 'Healthy' : cls === 'stat-warn' ? 'High usage' : 'Critical';
}

function updateDisk(disk) {
    let used, total;
    if (typeof disk === 'object') {
        used = disk.used || disk.usedBytes || 0;
        total = disk.total || disk.totalBytes || 1;
    } else {
        total = 500 * 1024 ** 3;
        used = (disk / 100) * total;
    }
    const pct = (used / total) * 100;
    DOM.diskUsed.textContent = (used / 1024 ** 3).toFixed(1) + ' GB';
    DOM.diskTotal.textContent = (total / 1024 ** 3).toFixed(1) + ' GB';
    DOM.diskFree.textContent = ((total - used) / 1024 ** 3).toFixed(1) + ' GB';
    DOM.diskPercent.textContent = Math.round(pct);
    const circ = 314.16;
    DOM.diskGaugeFill.setAttribute('stroke-dasharray', `${(pct / 100) * circ} ${circ}`);
    const cls = getStatusClass(pct, { good: 70, warn: 90 });
    DOM.diskStatus.className = cls;
    DOM.diskStatus.textContent = cls === 'stat-good' ? 'Plenty of space' : cls === 'stat-warn' ? 'Running low' : 'Critical';
}

function updateNetwork(net) {
    let up = 0, down = 0;
    if (typeof net === 'object') {
        up = net.tx || net.upload || net.bytesSent || 0;
        down = net.rx || net.download || net.bytesReceived || 0;
    }
    
    // Calculate speed (delta per second)
    const speedUp = Math.max(0, up - state.lastNetworkBytes.up);
    const speedDown = Math.max(0, down - state.lastNetworkBytes.down);
    
    state.lastNetworkBytes.up = up;
    state.lastNetworkBytes.down = down;
    
    DOM.networkUp.textContent = formatBytes(speedUp) + '/s';
    DOM.networkDown.textContent = formatBytes(speedDown) + '/s';
    
    state.networkHistory.upload.push(speedUp);
    state.networkHistory.download.push(speedDown);
    if (state.networkHistory.upload.length > CONFIG.networkChartPoints) {
        state.networkHistory.upload.shift();
        state.networkHistory.download.shift();
    }
    drawNetworkChart();
}

function drawNetworkChart() {
    const canvas = DOM.networkCanvas;
    const ctx = canvas.getContext('2d');
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    const w = rect.width;
    const h = rect.height;
    ctx.clearRect(0, 0, w, h);
    const all = [...state.networkHistory.upload, ...state.networkHistory.download];
    const max = Math.max(...all, 1000);
    const drawLine = (data, color) => {
        if (data.length < 2) return;
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';
        const step = (w - 8) / (CONFIG.networkChartPoints - 1);
        data.forEach((v, i) => {
            const x = 4 + i * step;
            const y = h - 4 - (v / max) * (h - 8);
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        });
        ctx.stroke();
    };
    drawLine(state.networkHistory.upload, '#10b981');
    drawLine(state.networkHistory.download, '#00d9ff');
}

function init() {
    console.log('Dashboard Initializing (REST Polling Mode)');
    console.log('Target:', CONFIG.apiUrl);
    
    for (let i = 0; i < CONFIG.networkChartPoints; i++) {
        state.networkHistory.upload.push(0);
        state.networkHistory.download.push(0);
    }
    
    DOM.cpuCores.textContent = '--';
    DOM.pingStatus.textContent = 'Calculating...';
    
    // Start Polling
    fetchData(); // Immediate first load
    setInterval(fetchData, CONFIG.updateInterval);
    
    window.addEventListener('resize', drawNetworkChart);
    setInterval(updateTimestamp, 1000);
    updateTimestamp();
}

document.addEventListener('DOMContentLoaded', init);
