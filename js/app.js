/* ============================================
   AL FARRIZI MUSIC BOT - DASHBOARD APPLICATION
   Version: 4.23.7
   Complete Fixed & Updated
   ============================================ */

// ============================================
// CONFIGURATION
// ============================================
const CONFIG = {
    API_ENDPOINT: 'https://unclaiming-fully-camron.ngrok-free.dev/all',
    REFRESH_INTERVAL: 5000,
    CHART_HISTORY_LENGTH: 20,
    TOAST_DURATION: 4000,
    ANIMATION_DELAY: 100,
};

// ============================================
// STATE MANAGEMENT
// ============================================
const state = {
    apiData: null,
    isOnline: false,
    lastUpdated: null,
    charts: {},
    refreshInterval: null,
    chartsInitialized: false,
    currentPage: 'dashboard',
};

// ============================================
// DOM ELEMENTS
// ============================================
let elements = {};

function initElements() {
    elements = {
        // Sidebar
        sidebar: document.getElementById('sidebar'),
        sidebarToggle: document.getElementById('sidebarToggle'),
        sidebarOverlay: document.getElementById('sidebarOverlay'),
        mobileMenuBtn: document.getElementById('mobileMenuBtn'),
        navItems: document.querySelectorAll('.nav-item:not(.theme-nav-item)'),
        
        // Theme
        themeToggle: document.getElementById('themeToggle'),
        themeToggleMobile: document.getElementById('themeToggleMobile'),
        themeNavItem: document.getElementById('themeNavItem'),
        
        // Pages
        pages: document.querySelectorAll('.page'),
        
        // Dashboard
        apiStatusIndicator: document.getElementById('apiStatusIndicator'),
        lastUpdated: document.getElementById('lastUpdated'),
        apiStatus: document.getElementById('apiStatus'),
        responseTime: document.getElementById('responseTime'),
        serverVersion: document.getElementById('serverVersion'),
        healthGrade: document.getElementById('healthGrade'),
        healthScore: document.getElementById('healthScore'),
        uptime: document.getElementById('uptime'),
        
        // Now Playing
        nowPlayingContainer: document.getElementById('nowPlayingContainer'),
        playingCount: document.getElementById('playingCount'),
        
        // Quick Stats
        totalPlayers: document.getElementById('totalPlayers'),
        activePlaying: document.getElementById('activePlaying'),
        idlePlayers: document.getElementById('idlePlayers'),
        frameIntegrity: document.getElementById('frameIntegrity'),
        playersBar: document.getElementById('playersBar'),
        activeBar: document.getElementById('activeBar'),
        idleBar: document.getElementById('idleBar'),
        frameBar: document.getElementById('frameBar'),
        
        // Stats Page
        cpuSystemLoad: document.getElementById('cpuSystemLoad'),
        cpuLavalinkLoad: document.getElementById('cpuLavalinkLoad'),
        cpuCores: document.getElementById('cpuCores'),
        memUsed: document.getElementById('memUsed'),
        memAllocated: document.getElementById('memAllocated'),
        memFree: document.getElementById('memFree'),
        memUsage: document.getElementById('memUsage'),
        statTotalPlayers: document.getElementById('statTotalPlayers'),
        statPlayingPlayers: document.getElementById('statPlayingPlayers'),
        statIdlePlayers: document.getElementById('statIdlePlayers'),
        statFrameIntegrity: document.getElementById('statFrameIntegrity'),
        statFrameStatus: document.getElementById('statFrameStatus'),
        statFrameSent: document.getElementById('statFrameSent'),
        statFrameExpected: document.getElementById('statFrameExpected'),
        
        // Sources & Filters
        sourcesGrid: document.getElementById('sourcesGrid'),
        filtersGrid: document.getElementById('filtersGrid'),
        
        // Commands
        commandSearch: document.getElementById('commandSearch'),
        commandsContainer: document.getElementById('commandsContainer'),
        
        // Feedback
        feedbackForm: document.getElementById('feedbackForm'),
        
        // Toast
        toastContainer: document.getElementById('toastContainer'),
    };
}

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎵 Al Farrizi Music Bot Dashboard v4.23.7');
    console.log('📡 API:', CONFIG.API_ENDPOINT);
    
    initElements();
    initTheme();
    initSidebar();
    initNavigation();
    initCommands();
    initFAQ();
    initFeedbackForm();
    
    // Initialize charts
    waitForChartJS()
        .then(() => {
            initCharts();
            state.chartsInitialized = true;
            console.log('📊 Charts ready');
        })
        .catch(err => console.warn('⚠️ Charts unavailable:', err.message));
    
    // Fetch data and start refresh
    fetchData();
    startAutoRefresh();
    
    console.log('✅ Dashboard initialized');
});

function waitForChartJS(timeout = 5000) {
    return new Promise((resolve, reject) => {
        if (typeof Chart !== 'undefined') {
            resolve();
            return;
        }
        
        const start = Date.now();
        const check = setInterval(() => {
            if (typeof Chart !== 'undefined') {
                clearInterval(check);
                resolve();
            } else if (Date.now() - start > timeout) {
                clearInterval(check);
                reject(new Error('Chart.js timeout'));
            }
        }, 100);
    });
}

// ============================================
// THEME MANAGEMENT
// ============================================
function initTheme() {
    const saved = localStorage.getItem('theme') || 'dark';
    setTheme(saved);
    
    // Theme toggle events
    elements.themeToggle?.addEventListener('click', (e) => {
        e.preventDefault();
        toggleTheme();
    });
    
    elements.themeToggleMobile?.addEventListener('click', toggleTheme);
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    const isDark = theme === 'dark';
    const icon = isDark ? 'fa-moon' : 'fa-sun';
    const text = isDark ? 'Dark Mode' : 'Light Mode';
    
    // Update sidebar theme toggle
    if (elements.themeToggle) {
        elements.themeToggle.innerHTML = `<i class="fas ${icon}"></i><span>${text}</span>`;
    }
    
    // Update mobile theme toggle
    if (elements.themeToggleMobile) {
        elements.themeToggleMobile.innerHTML = `<i class="fas ${icon}"></i>`;
    }
    
    // Update charts
    if (state.chartsInitialized) {
        updateChartsTheme();
    }
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    setTheme(current === 'dark' ? 'light' : 'dark');
    showToast('Theme Changed', `Switched to ${current === 'dark' ? 'Light' : 'Dark'} Mode`, 'info');
}

function getChartColors() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    return {
        primary: '#6366f1',
        primaryLight: 'rgba(99, 102, 241, 0.2)',
        success: '#10b981',
        successLight: 'rgba(16, 185, 129, 0.2)',
        warning: '#f59e0b',
        warningLight: 'rgba(245, 158, 11, 0.2)',
        info: '#3b82f6',
        infoLight: 'rgba(59, 130, 246, 0.2)',
        danger: '#ef4444',
        text: isDark ? '#a0a0b0' : '#4a4a5a',
        grid: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)',
    };
}

// ============================================
// SIDEBAR MANAGEMENT
// ============================================
function initSidebar() {
    elements.sidebarToggle?.addEventListener('click', () => {
        elements.sidebar?.classList.toggle('collapsed');
        localStorage.setItem('sidebarCollapsed', elements.sidebar?.classList.contains('collapsed'));
    });
    
    elements.mobileMenuBtn?.addEventListener('click', () => {
        elements.sidebar?.classList.add('mobile-open');
        elements.sidebarOverlay?.classList.add('active');
    });
    
    elements.sidebarOverlay?.addEventListener('click', closeMobileSidebar);
    
    // Restore state
    if (localStorage.getItem('sidebarCollapsed') === 'true' && window.innerWidth > 992) {
        elements.sidebar?.classList.add('collapsed');
    }
}

function closeMobileSidebar() {
    elements.sidebar?.classList.remove('mobile-open');
    elements.sidebarOverlay?.classList.remove('active');
}

// ============================================
// NAVIGATION
// ============================================
function initNavigation() {
    elements.navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.dataset.page;
            if (page) {
                navigateToPage(page);
                closeMobileSidebar();
            }
        });
    });
    
    window.addEventListener('hashchange', () => {
        const hash = window.location.hash.slice(1) || 'dashboard';
        navigateToPage(hash, false);
    });
    
    // Initial page
    const initial = window.location.hash.slice(1) || 'dashboard';
    navigateToPage(initial, false);
}

function navigateToPage(pageName, updateHash = true) {
    state.currentPage = pageName;
    
    // Update nav
    elements.navItems.forEach(item => {
        item.classList.toggle('active', item.dataset.page === pageName);
    });
    
    // Update pages with animation
    elements.pages.forEach(page => {
        const isTarget = page.id === `page-${pageName}`;
        if (isTarget) {
            page.classList.add('active');
            // Trigger animations
            page.querySelectorAll('.animate-fade-in, .animate-fade-in-up').forEach((el, i) => {
                el.style.animationDelay = `${i * 0.05}s`;
            });
        } else {
            page.classList.remove('active');
        }
    });
    
    if (updateHash) {
        window.location.hash = pageName;
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================
// API DATA FETCHING
// ============================================
async function fetchData() {
    const startTime = performance.now();
    
    try {
        const response = await fetch(CONFIG.API_ENDPOINT, {
            headers: {
                'ngrok-skip-browser-warning': 'true',
                'Accept': 'application/json',
            },
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const json = await response.json();
        const responseTime = Math.round(performance.now() - startTime);
        
        // Handle nested data structure
        const data = json.data || json;
        const serverResponseTime = data.response_time_ms || responseTime;
        
        state.apiData = data;
        state.isOnline = json.success !== false;
        state.lastUpdated = new Date();
        
        // Update all sections
        updateDashboard(data, serverResponseTime);
        updateStats(data);
        updateNowPlaying(data);
        updateSources(data);
        updateFilters(data);
        
        if (state.chartsInitialized) {
            updateCharts(data, serverResponseTime);
        }
        
    } catch (error) {
        console.error('❌ Fetch error:', error.message);
        state.isOnline = false;
        updateOfflineState();
    }
}

function startAutoRefresh() {
    clearInterval(state.refreshInterval);
    state.refreshInterval = setInterval(fetchData, CONFIG.REFRESH_INTERVAL);
}

// ============================================
// UTILITY FUNCTIONS
// ============================================
function parsePercentage(value) {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
        return parseFloat(value.replace(/[^0-9.-]/g, '')) || 0;
    }
    return 0;
}

function safeSetText(el, text) {
    if (el) el.textContent = text ?? '--';
}

function safeSetWidth(el, percent) {
    if (el) el.style.width = `${Math.min(Math.max(percent || 0, 0), 100)}%`;
}

function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function formatTimestamp(stamp) {
    if (!stamp) return '00:00';
    return stamp.replace(/^00:/, '');
}

// ============================================
// DASHBOARD UPDATES
// ============================================
function updateDashboard(data, responseTime) {
    // API Status
    if (elements.apiStatusIndicator) {
        elements.apiStatusIndicator.classList.toggle('offline', !state.isOnline);
        const statusText = elements.apiStatusIndicator.querySelector('.status-text');
        if (statusText) statusText.textContent = state.isOnline ? 'API Online' : 'API Offline';
    }
    
    safeSetText(elements.lastUpdated, 'Just now');
    safeSetText(elements.apiStatus, state.isOnline ? 'Online' : 'Offline');
    safeSetText(elements.responseTime, `${responseTime}ms`);
    safeSetText(elements.serverVersion, data.server?.version?.semver);
    
    // Health
    const health = data.performance?.health || {};
    safeSetText(elements.healthGrade, health.grade);
    safeSetText(elements.healthScore, health.score !== undefined ? `${health.score}%` : null);
    safeSetText(elements.uptime, data.performance?.uptime?.formatted);
    
    // Players
    const audioStats = data.audio_stats || {};
    const players = audioStats.players || {};
    const total = players.total || 0;
    const playing = players.playing || 0;
    const idle = players.idle ?? (total - playing);
    
    safeSetText(elements.totalPlayers, total.toString());
    safeSetText(elements.activePlaying, playing.toString());
    safeSetText(elements.idlePlayers, idle.toString());
    
    const maxPlayers = Math.max(total, 10);
    safeSetWidth(elements.playersBar, (total / maxPlayers) * 100);
    safeSetWidth(elements.activeBar, total > 0 ? (playing / total) * 100 : 0);
    safeSetWidth(elements.idleBar, total > 0 ? (idle / total) * 100 : 0);
    
    // Frame Integrity
    const frames = audioStats.frame_analysis || {};
    const integrity = parsePercentage(frames.integrity);
    safeSetText(elements.frameIntegrity, `${integrity.toFixed(0)}%`);
    safeSetWidth(elements.frameBar, integrity);
}

function updateOfflineState() {
    if (elements.apiStatusIndicator) {
        elements.apiStatusIndicator.classList.add('offline');
        const text = elements.apiStatusIndicator.querySelector('.status-text');
        if (text) text.textContent = 'API Offline';
    }
    safeSetText(elements.apiStatus, 'Offline');
    safeSetText(elements.responseTime, '--ms');
}

// ============================================
// STATS PAGE
// ============================================
function updateStats(data) {
    const cpu = data.performance?.cpu || {};
    const memory = data.performance?.memory || {};
    const audioStats = data.audio_stats || {};
    const players = audioStats.players || {};
    const frames = audioStats.frame_analysis || {};
    
    // CPU
    safeSetText(elements.cpuSystemLoad, cpu.system_load || '--');
    safeSetText(elements.cpuLavalinkLoad, cpu.lavalink_load || '--');
    safeSetText(elements.cpuCores, cpu.cores?.toString());
    
    // Memory
    safeSetText(elements.memUsed, memory.used?.formatted);
    safeSetText(elements.memAllocated, memory.allocated?.formatted);
    safeSetText(elements.memFree, memory.free?.formatted);
    safeSetText(elements.memUsage, memory.usage_percent);
    
    // Players
    safeSetText(elements.statTotalPlayers, players.total?.toString() || '0');
    safeSetText(elements.statPlayingPlayers, players.playing?.toString() || '0');
    safeSetText(elements.statIdlePlayers, (players.idle ?? 0).toString());
    
    // Frames
    safeSetText(elements.statFrameIntegrity, frames.integrity);
    safeSetText(elements.statFrameStatus, frames.status);
    safeSetText(elements.statFrameSent, frames.raw?.sent?.toString());
    safeSetText(elements.statFrameExpected, frames.raw?.expected?.toString());
}

// ============================================
// NOW PLAYING
// ============================================
function updateNowPlaying(data) {
    const nowPlaying = data.now_playing || [];
    
    safeSetText(elements.playingCount, `${nowPlaying.length} track${nowPlaying.length !== 1 ? 's' : ''}`);
    
    if (!elements.nowPlayingContainer) return;
    
    if (nowPlaying.length === 0) {
        elements.nowPlayingContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-music"></i>
                <p>No tracks currently playing</p>
            </div>
        `;
        return;
    }
    
    elements.nowPlayingContainer.innerHTML = nowPlaying.map((track, i) => 
        createNowPlayingCard(track, i)
    ).join('');
}

function createNowPlayingCard(track, index) {
    const meta = track.metadata || {};
    const playback = track.playback_state || {};
    
    const title = meta.title || 'Unknown Title';
    const author = meta.author || 'Unknown Artist';
    const artwork = meta.artwork_url || 'https://via.placeholder.com/90/1a1a25/6366f1?text=♪';
    const source = meta.source || 'unknown';
    
    const position = playback.position?.raw || 0;
    const duration = playback.duration?.raw || 1;
    const progress = Math.min((position / duration) * 100, 100);
    
    const currentTime = formatTimestamp(playback.position?.stamp);
    const totalTime = formatTimestamp(playback.duration?.stamp);
    const ping = playback.ping || '--';
    const connected = playback.connected !== false;
    const guildId = track.guild_id || '';
    
    return `
        <div class="now-playing-card animate-fade-in-up" style="animation-delay: ${index * 0.1}s">
            <div class="np-header">
                <div class="np-artwork">
                    <img src="${escapeHtml(artwork)}" alt="Artwork" 
                         onerror="this.src='https://via.placeholder.com/90/1a1a25/6366f1?text=♪'">
                    <div class="np-playing-indicator">
                        <i class="fas fa-play"></i>
                    </div>
                </div>
                <div class="np-info">
                    <h4 class="np-title" title="${escapeHtml(title)}">${escapeHtml(title)}</h4>
                    <p class="np-artist" title="${escapeHtml(author)}">${escapeHtml(author)}</p>
                    <span class="np-source">
                        <i class="${getSourceIcon(source)}"></i>
                        ${capitalize(source)}
                    </span>
                </div>
            </div>
            <div class="np-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progress}%"></div>
                </div>
                <div class="progress-time">
                    <span>${currentTime}</span>
                    <span>${totalTime}</span>
                </div>
            </div>
            <div class="np-footer">
                <div class="np-stats">
                    <span class="np-stat">
                        <i class="fas fa-signal"></i>
                        ${ping}
                    </span>
                    <span class="np-stat">
                        <i class="fas fa-server"></i>
                        ${guildId ? `...${guildId.slice(-6)}` : '--'}
                    </span>
                </div>
                <span class="np-status ${connected ? 'connected' : 'disconnected'}">
                    <i class="fas fa-${connected ? 'check-circle' : 'times-circle'}"></i>
                    ${connected ? 'Connected' : 'Disconnected'}
                </span>
            </div>
        </div>
    `;
}

function getSourceIcon(source) {
    const icons = {
        youtube: 'fab fa-youtube',
        spotify: 'fab fa-spotify',
        soundcloud: 'fab fa-soundcloud',
        deezer: 'fas fa-compact-disc',
        applemusic: 'fab fa-apple',
        twitch: 'fab fa-twitch',
        bandcamp: 'fab fa-bandcamp',
        vimeo: 'fab fa-vimeo-v',
        tidal: 'fas fa-water',
        http: 'fas fa-globe',
    };
    return icons[source?.toLowerCase()] || 'fas fa-music';
}

// ============================================
// SOURCES PAGE
// ============================================
function updateSources(data) {
    if (!elements.sourcesGrid) return;
    
    const sources = data.server?.capabilities?.sources || [];
    
    if (sources.length === 0) {
        elements.sourcesGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-plug"></i>
                <p>No sources available</p>
            </div>
        `;
        return;
    }
    
    const sorted = [...sources].sort((a, b) => a.localeCompare(b));
    
    elements.sourcesGrid.innerHTML = sorted.map((source, i) => {
        const info = getSourceInfo(source);
        return `
            <div class="source-card animate-fade-in-up" style="animation-delay: ${i * 0.03}s">
                <div class="source-icon ${info.class}">
                    <i class="${info.icon}"></i>
                </div>
                <div class="source-info">
                    <h4 class="source-name">${escapeHtml(info.name)}</h4>
                    <p class="source-status">Available</p>
                </div>
                <div class="source-check">
                    <i class="fas fa-check"></i>
                </div>
            </div>
        `;
    }).join('');
}

function getSourceInfo(source) {
    const map = {
        youtube: { name: 'YouTube', icon: 'fab fa-youtube', class: 'youtube' },
        spotify: { name: 'Spotify', icon: 'fab fa-spotify', class: 'spotify' },
        soundcloud: { name: 'SoundCloud', icon: 'fab fa-soundcloud', class: 'soundcloud' },
        deezer: { name: 'Deezer', icon: 'fas fa-compact-disc', class: 'deezer' },
        applemusic: { name: 'Apple Music', icon: 'fab fa-apple', class: 'applemusic' },
        tidal: { name: 'Tidal', icon: 'fas fa-water', class: 'tidal' },
        amazonmusic: { name: 'Amazon Music', icon: 'fab fa-amazon', class: 'amazon' },
        pandora: { name: 'Pandora', icon: 'fas fa-podcast', class: 'default' },
        qobuz: { name: 'Qobuz', icon: 'fas fa-headphones', class: 'default' },
        twitch: { name: 'Twitch', icon: 'fab fa-twitch', class: 'twitch' },
        vimeo: { name: 'Vimeo', icon: 'fab fa-vimeo-v', class: 'vimeo' },
        bilibili: { name: 'Bilibili', icon: 'fas fa-tv', class: 'default' },
        nicovideo: { name: 'Niconico', icon: 'fas fa-play-circle', class: 'default' },
        instagram: { name: 'Instagram', icon: 'fab fa-instagram', class: 'instagram' },
        twitter: { name: 'Twitter/X', icon: 'fab fa-twitter', class: 'twitter' },
        reddit: { name: 'Reddit', icon: 'fab fa-reddit-alien', class: 'reddit' },
        tumblr: { name: 'Tumblr', icon: 'fab fa-tumblr', class: 'default' },
        pinterest: { name: 'Pinterest', icon: 'fab fa-pinterest', class: 'default' },
        telegram: { name: 'Telegram', icon: 'fab fa-telegram', class: 'telegram' },
        bluesky: { name: 'Bluesky', icon: 'fas fa-cloud', class: 'default' },
        kwai: { name: 'Kwai', icon: 'fas fa-video', class: 'default' },
        bandcamp: { name: 'Bandcamp', icon: 'fab fa-bandcamp', class: 'bandcamp' },
        mixcloud: { name: 'Mixcloud', icon: 'fab fa-mixcloud', class: 'mixcloud' },
        audiomack: { name: 'Audiomack', icon: 'fas fa-headphones-alt', class: 'default' },
        audius: { name: 'Audius', icon: 'fas fa-wave-square', class: 'default' },
        yandexmusic: { name: 'Yandex Music', icon: 'fab fa-yandex', class: 'default' },
        vkmusic: { name: 'VK Music', icon: 'fab fa-vk', class: 'default' },
        jiosaavn: { name: 'JioSaavn', icon: 'fas fa-music', class: 'default' },
        gaana: { name: 'Gaana', icon: 'fas fa-music', class: 'default' },
        genius: { name: 'Genius', icon: 'fas fa-microphone-alt', class: 'default' },
        lastfm: { name: 'Last.fm', icon: 'fab fa-lastfm', class: 'default' },
        shazam: { name: 'Shazam', icon: 'fas fa-bolt', class: 'default' },
        letrasmus: { name: 'Letras', icon: 'fas fa-align-left', class: 'default' },
        flowery: { name: 'Flowery TTS', icon: 'fas fa-comment-dots', class: 'default' },
        'google-tts': { name: 'Google TTS', icon: 'fab fa-google', class: 'default' },
        http: { name: 'HTTP Streams', icon: 'fas fa-globe', class: 'http' },
        local: { name: 'Local Files', icon: 'fas fa-folder-open', class: 'default' },
        rss: { name: 'RSS Feeds', icon: 'fas fa-rss', class: 'default' },
        songlink: { name: 'Songlink', icon: 'fas fa-link', class: 'default' },
        eternalbox: { name: 'Eternal Box', icon: 'fas fa-infinity', class: 'default' },
    };
    
    const key = source.toLowerCase().replace(/[-_\s]/g, '');
    return map[key] || {
        name: capitalize(source.replace(/[-_]/g, ' ')),
        icon: 'fas fa-music',
        class: 'default'
    };
}

// ============================================
// FILTERS PAGE
// ============================================
function updateFilters(data) {
    if (!elements.filtersGrid) return;
    
    const filters = data.server?.capabilities?.filters || [];
    
    if (filters.length === 0) {
        elements.filtersGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-sliders-h"></i>
                <p>No filters available</p>
            </div>
        `;
        return;
    }
    
    const sorted = [...filters].sort((a, b) => a.localeCompare(b));
    
    elements.filtersGrid.innerHTML = sorted.map((filter, i) => {
        const info = getFilterInfo(filter);
        return `
            <div class="filter-card animate-fade-in-up" style="animation-delay: ${i * 0.03}s">
                <div class="filter-header">
                    <span class="filter-name">${escapeHtml(info.name)}</span>
                    <div class="filter-check">
                        <i class="fas fa-check"></i>
                    </div>
                </div>
                <p class="filter-description">${escapeHtml(info.description)}</p>
            </div>
        `;
    }).join('');
}

function getFilterInfo(filter) {
    const map = {
        tremolo: { name: 'Tremolo', description: 'Add trembling amplitude modulation effect to the audio' },
        vibrato: { name: 'Vibrato', description: 'Add vibrating pitch variation effect to the audio' },
        lowpass: { name: 'Low Pass', description: 'Filter out high frequencies, keeping bass and mids' },
        highpass: { name: 'High Pass', description: 'Filter out low frequencies, keeping highs and mids' },
        rotation: { name: 'Rotation', description: 'Rotate audio around the stereo field for spatial effect' },
        karaoke: { name: 'Karaoke', description: 'Remove or reduce vocals from the track' },
        distortion: { name: 'Distortion', description: 'Add distortion and overdrive effect to the audio' },
        channelmix: { name: 'Channel Mix', description: 'Mix and swap stereo channels creatively' },
        channelMix: { name: 'Channel Mix', description: 'Mix and swap stereo channels creatively' },
        equalizer: { name: 'Equalizer', description: 'Adjust individual frequency bands for custom sound' },
        chorus: { name: 'Chorus', description: 'Add chorus effect for richer, fuller sound' },
        compressor: { name: 'Compressor', description: 'Apply dynamic range compression to audio' },
        echo: { name: 'Echo', description: 'Add echo and delay effect to the audio' },
        phaser: { name: 'Phaser', description: 'Add phaser sweep effect for psychedelic sound' },
        timescale: { name: 'Timescale', description: 'Adjust playback speed and pitch independently' },
        bassboost: { name: 'Bass Boost', description: 'Enhance and boost bass frequencies' },
        nightcore: { name: 'Nightcore', description: 'Speed up audio with higher pitch for nightcore effect' },
        vaporwave: { name: 'Vaporwave', description: 'Slow down audio with lower pitch for vaporwave effect' },
        '8d': { name: '8D Audio', description: 'Create rotating spatial audio effect around listener' },
    };
    
    const key = filter.toLowerCase();
    return map[key] || {
        name: capitalize(filter.replace(/[-_]/g, ' ')),
        description: 'Audio processing filter for enhanced sound'
    };
}

// ============================================
// CHARTS
// ============================================
function initCharts() {
    if (typeof Chart === 'undefined') return;
    
    const colors = getChartColors();
    
    const lineDefaults = {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 400 },
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(0,0,0,0.8)',
                cornerRadius: 8,
                padding: 12,
                titleFont: { size: 13 },
                bodyFont: { size: 12 },
            },
        },
        scales: {
            x: { display: false },
            y: {
                display: true,
                min: 0,
                grid: { color: colors.grid, drawBorder: false },
                ticks: { color: colors.text, font: { size: 11 } },
            },
        },
        elements: {
            point: { radius: 0, hoverRadius: 4 },
            line: { tension: 0.4, borderWidth: 2 },
        },
    };
    
    // CPU Chart
    const cpuEl = document.getElementById('cpuChart');
    if (cpuEl) {
        state.charts.cpu = new Chart(cpuEl.getContext('2d'), {
            type: 'line',
            data: {
                labels: Array(CONFIG.CHART_HISTORY_LENGTH).fill(''),
                datasets: [
                    {
                        label: 'System',
                        data: Array(CONFIG.CHART_HISTORY_LENGTH).fill(0),
                        borderColor: colors.primary,
                        backgroundColor: colors.primaryLight,
                        fill: true,
                    },
                    {
                        label: 'Lavalink',
                        data: Array(CONFIG.CHART_HISTORY_LENGTH).fill(0),
                        borderColor: colors.info,
                        backgroundColor: colors.infoLight,
                        fill: true,
                    },
                ],
            },
            options: { ...lineDefaults, scales: { ...lineDefaults.scales, y: { ...lineDefaults.scales.y, max: 100 } } },
        });
    }
    
    // Memory Chart (Doughnut)
    const memEl = document.getElementById('memoryChart');
    if (memEl) {
        state.charts.memory = new Chart(memEl.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['Used', 'Free'],
                datasets: [{
                    data: [50, 50],
                    backgroundColor: [colors.primary, colors.grid],
                    borderWidth: 0,
                    cutout: '78%',
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 400 },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: ctx => `${ctx.label}: ${ctx.raw.toFixed(1)}%`
                        }
                    }
                },
            },
        });
    }
    
    // Players Chart (Bar)
    const playersEl = document.getElementById('playersChart');
    if (playersEl) {
        state.charts.players = new Chart(playersEl.getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['Total', 'Playing', 'Idle'],
                datasets: [{
                    data: [0, 0, 0],
                    backgroundColor: [colors.primary, colors.success, colors.warning],
                    borderRadius: 8,
                    borderSkipped: false,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 400 },
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { display: false }, ticks: { color: colors.text } },
                    y: { beginAtZero: true, grid: { color: colors.grid }, ticks: { color: colors.text } },
                },
            },
        });
    }
    
    // Frame Chart
    const frameEl = document.getElementById('frameChart');
    if (frameEl) {
        state.charts.frame = new Chart(frameEl.getContext('2d'), {
            type: 'line',
            data: {
                labels: Array(CONFIG.CHART_HISTORY_LENGTH).fill(''),
                datasets: [{
                    label: 'Integrity',
                    data: Array(CONFIG.CHART_HISTORY_LENGTH).fill(100),
                    borderColor: colors.success,
                    backgroundColor: colors.successLight,
                    fill: true,
                }],
            },
            options: { ...lineDefaults, scales: { ...lineDefaults.scales, y: { ...lineDefaults.scales.y, max: 100 } } },
        });
    }
    
    // Uptime/Response Chart
    const uptimeEl = document.getElementById('uptimeChart');
    if (uptimeEl) {
        state.charts.uptime = new Chart(uptimeEl.getContext('2d'), {
            type: 'line',
            data: {
                labels: Array(CONFIG.CHART_HISTORY_LENGTH).fill(''),
                datasets: [{
                    label: 'Response (ms)',
                    data: Array(CONFIG.CHART_HISTORY_LENGTH).fill(0),
                    borderColor: colors.primary,
                    backgroundColor: colors.primaryLight,
                    fill: true,
                }],
            },
            options: {
                ...lineDefaults,
                elements: { point: { radius: 3, hoverRadius: 6 } },
                scales: {
                    x: { display: true, grid: { color: colors.grid }, ticks: { color: colors.text, maxTicksLimit: 8 } },
                    y: { ...lineDefaults.scales.y, beginAtZero: true },
                },
            },
        });
    }
}

function updateCharts(data, responseTime) {
    if (!state.chartsInitialized) return;
    
    const cpu = data.performance?.cpu || {};
    const memory = data.performance?.memory || {};
    const audioStats = data.audio_stats || {};
    const players = audioStats.players || {};
    const frames = audioStats.frame_analysis || {};
    
    // CPU
    if (state.charts.cpu) {
        const sys = Math.min(parsePercentage(cpu.system_load), 100);
        const lava = Math.min(parsePercentage(cpu.lavalink_load), 100);
        pushData(state.charts.cpu.data.datasets[0].data, sys);
        pushData(state.charts.cpu.data.datasets[1].data, lava);
        state.charts.cpu.update('none');
    }
    
    // Memory
    if (state.charts.memory) {
        const usage = parsePercentage(memory.usage_percent);
        state.charts.memory.data.datasets[0].data = [usage, 100 - usage];
        state.charts.memory.update('none');
    }
    
    // Players
    if (state.charts.players) {
        const total = players.total || 0;
        const playing = players.playing || 0;
        const idle = players.idle ?? (total - playing);
        state.charts.players.data.datasets[0].data = [total, playing, idle];
        state.charts.players.update('none');
    }
    
    // Frame
    if (state.charts.frame) {
        pushData(state.charts.frame.data.datasets[0].data, parsePercentage(frames.integrity));
        state.charts.frame.update('none');
    }
    
    // Uptime
    if (state.charts.uptime) {
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        pushData(state.charts.uptime.data.labels, time);
        pushData(state.charts.uptime.data.datasets[0].data, responseTime);
        state.charts.uptime.update('none');
    }
}

function pushData(arr, value) {
    arr.push(value);
    if (arr.length > CONFIG.CHART_HISTORY_LENGTH) arr.shift();
}

function updateChartsTheme() {
    const colors = getChartColors();
    
    Object.values(state.charts).forEach(chart => {
        if (!chart?.options?.scales) return;
        
        ['x', 'y'].forEach(axis => {
            const scale = chart.options.scales[axis];
            if (scale) {
                if (scale.grid) scale.grid.color = colors.grid;
                if (scale.ticks) scale.ticks.color = colors.text;
            }
        });
        chart.update('none');
    });
}

// ============================================
// COMMANDS
// ============================================
function initCommands() {
    elements.commandSearch?.addEventListener('input', (e) => {
        filterCommands(e.target.value.toLowerCase().trim());
    });
    
    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const cmd = this.dataset.command;
            copyToClipboard(cmd);
            
            this.innerHTML = '<i class="fas fa-check"></i>';
            this.classList.add('copied');
            
            setTimeout(() => {
                this.innerHTML = '<i class="fas fa-copy"></i>';
                this.classList.remove('copied');
            }, 2000);
        });
    });
}

function filterCommands(query) {
    document.querySelectorAll('.command-category').forEach(cat => {
        let visible = false;
        
        cat.querySelectorAll('.command-item').forEach(item => {
            const code = item.querySelector('code')?.textContent.toLowerCase() || '';
            const desc = item.querySelector('p')?.textContent.toLowerCase() || '';
            const match = !query || code.includes(query) || desc.includes(query);
            
            item.style.display = match ? '' : 'none';
            if (match) visible = true;
        });
        
        cat.style.display = visible ? '' : 'none';
    });
}

// ============================================
// FAQ
// ============================================
function initFAQ() {
    document.querySelectorAll('.faq-question').forEach(btn => {
        btn.addEventListener('click', function() {
            const item = this.closest('.faq-item');
            const wasActive = item.classList.contains('active');
            
            // Close all
            document.querySelectorAll('.faq-item.active').forEach(i => i.classList.remove('active'));
            
            // Toggle current
            if (!wasActive) item.classList.add('active');
        });
    });
}

// ============================================
// FEEDBACK FORM
// ============================================
function initFeedbackForm() {
    elements.feedbackForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const btn = e.target.querySelector('.submit-btn');
        const originalHTML = btn.innerHTML;
        
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        btn.disabled = true;
        
        // Simulate submission
        await new Promise(r => setTimeout(r, 1500));
        
        showToast('Feedback Sent!', 'Thank you for your feedback. We appreciate it!', 'success');
        e.target.reset();
        
        btn.innerHTML = originalHTML;
        btn.disabled = false;
    });
}

// ============================================
// TOAST NOTIFICATIONS
// ============================================
function showToast(title, message, type = 'info') {
    if (!elements.toastContainer) return;
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-times-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle',
    };
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-icon"><i class="fas ${icons[type] || icons.info}"></i></div>
        <div class="toast-content">
            <div class="toast-title">${escapeHtml(title)}</div>
            <div class="toast-message">${escapeHtml(message)}</div>
        </div>
        <button class="toast-close"><i class="fas fa-times"></i></button>
    `;
    
    elements.toastContainer.appendChild(toast);
    
    const close = () => {
        toast.classList.add('hide');
        setTimeout(() => toast.remove(), 300);
    };
    
    toast.querySelector('.toast-close').addEventListener('click', close);
    setTimeout(close, CONFIG.TOAST_DURATION);
}

// ============================================
// CLIPBOARD
// ============================================
function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text)
            .then(() => showToast('Copied!', `"${text}" copied to clipboard`, 'success'))
            .catch(() => fallbackCopy(text));
    } else {
        fallbackCopy(text);
    }
}

function fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;left:-9999px;top:-9999px';
    document.body.appendChild(ta);
    ta.select();
    
    try {
        document.execCommand('copy');
        showToast('Copied!', `"${text}" copied`, 'success');
    } catch {
        showToast('Error', 'Failed to copy', 'error');
    }
    
    ta.remove();
}

// ============================================
// WINDOW EVENTS
// ============================================
window.addEventListener('resize', () => {
    if (window.innerWidth > 992) closeMobileSidebar();
});

document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        clearInterval(state.refreshInterval);
    } else {
        fetchData();
        startAutoRefresh();
    }
});

window.addEventListener('beforeunload', () => {
    clearInterval(state.refreshInterval);
});

// ============================================
// DEBUG
// ============================================
window.dashboard = { state, CONFIG, fetchData, showToast };

console.log('📜 app.js loaded successfully');
