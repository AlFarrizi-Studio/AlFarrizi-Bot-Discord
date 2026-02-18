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
    REFRESH_INTERVAL: 1000, // 1 second for real-time
    CHART_HISTORY_LENGTH: 30,
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
    sourcesLoaded: false,
    filtersLoaded: false,
    fetchCount: 0,
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
        sidebarCloseMobile: document.getElementById('sidebarCloseMobile'),
        mobileMenuBtn: document.getElementById('mobileMenuBtn'),
        navItems: document.querySelectorAll('.nav-item:not(.special-nav-item)'),
        
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
// AUTO REFRESH FUNCTIONS (MUST BE BEFORE INIT)
// ============================================
function startAutoRefresh() {
    // Clear existing interval if any
    if (state.refreshInterval) {
        clearInterval(state.refreshInterval);
        state.refreshInterval = null;
    }
    
    // Start new interval
    state.refreshInterval = setInterval(function() {
        fetchData();
    }, CONFIG.REFRESH_INTERVAL);
    
    console.log('⏱️ Auto-refresh started (' + CONFIG.REFRESH_INTERVAL + 'ms)');
}

function stopAutoRefresh() {
    if (state.refreshInterval) {
        clearInterval(state.refreshInterval);
        state.refreshInterval = null;
        console.log('⏱️ Auto-refresh stopped');
    }
}

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎵 Al Farrizi Music Bot Dashboard v4.23.7');
    console.log('📡 API:', CONFIG.API_ENDPOINT);
    console.log('⏱️ Refresh Rate:', CONFIG.REFRESH_INTERVAL + 'ms');
    
    initElements();
    initTheme();
    initSidebar();
    initNavigation();
    initCommands();
    initFAQ();
    initFeedbackForm();
    
    // Initialize charts
    waitForChartJS()
        .then(function() {
            initCharts();
            state.chartsInitialized = true;
            console.log('📊 Charts ready');
        })
        .catch(function(err) {
            console.warn('⚠️ Charts unavailable:', err.message);
        });
    
    // Fetch data and start refresh
    fetchData();
    startAutoRefresh();
    
    console.log('✅ Dashboard initialized');
});

function waitForChartJS(timeout) {
    timeout = timeout || 5000;
    return new Promise(function(resolve, reject) {
        if (typeof Chart !== 'undefined') {
            resolve();
            return;
        }
        
        var start = Date.now();
        var check = setInterval(function() {
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
    var saved = localStorage.getItem('theme') || 'dark';
    setTheme(saved);
    
    // Theme toggle events
    if (elements.themeToggle) {
        elements.themeToggle.addEventListener('click', function(e) {
            e.preventDefault();
            toggleTheme();
        });
    }
    
    if (elements.themeToggleMobile) {
        elements.themeToggleMobile.addEventListener('click', function() {
            toggleTheme();
        });
    }
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    var isDark = theme === 'dark';
    var icon = isDark ? 'fa-moon' : 'fa-sun';
    var text = isDark ? 'Dark Mode' : 'Light Mode';
    
    // Update sidebar theme toggle
    if (elements.themeToggle) {
        elements.themeToggle.innerHTML = '<i class="fas ' + icon + '"></i><span>' + text + '</span>';
    }
    
    // Update mobile theme toggle
    if (elements.themeToggleMobile) {
        elements.themeToggleMobile.innerHTML = '<i class="fas ' + icon + '"></i>';
    }
    
    // Update charts
    if (state.chartsInitialized) {
        updateChartsTheme();
    }
}

function toggleTheme() {
    var current = document.documentElement.getAttribute('data-theme');
    var newTheme = current === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    showToast('Theme Changed', 'Switched to ' + (newTheme === 'dark' ? 'Dark' : 'Light') + ' Mode', 'info');
}

function getChartColors() {
    var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
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
    // Desktop collapse toggle
    var sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            if (elements.sidebar) {
                elements.sidebar.classList.toggle('collapsed');
                var isCollapsed = elements.sidebar.classList.contains('collapsed');
                localStorage.setItem('sidebarCollapsed', isCollapsed);
                
                // Update text
                var span = sidebarToggle.querySelector('span');
                if (span) {
                    span.textContent = isCollapsed ? 'Expand Menu' : 'Collapse Menu';
                }
            }
        });
    }
    
    // Mobile menu open
    if (elements.mobileMenuBtn) {
        elements.mobileMenuBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            openMobileSidebar();
        });
    }
    
    // Mobile close button (X)
    if (elements.sidebarCloseMobile) {
        elements.sidebarCloseMobile.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            closeMobileSidebar();
        });
    }
    
    // Overlay click to close
    if (elements.sidebarOverlay) {
        elements.sidebarOverlay.addEventListener('click', function(e) {
            e.preventDefault();
            closeMobileSidebar();
        });
    }
    
    // Close sidebar when clicking a nav item on mobile
    document.querySelectorAll('.nav-item a').forEach(function(link) {
        link.addEventListener('click', function() {
            if (window.innerWidth <= 992) {
                closeMobileSidebar();
            }
        });
    });
    
    // Restore collapsed state on desktop
    if (localStorage.getItem('sidebarCollapsed') === 'true' && window.innerWidth > 992) {
        if (elements.sidebar) {
            elements.sidebar.classList.add('collapsed');
        }
        if (sidebarToggle) {
            var span = sidebarToggle.querySelector('span');
            if (span) span.textContent = 'Expand Menu';
        }
    }
}

function openMobileSidebar() {
    if (elements.sidebar) elements.sidebar.classList.add('mobile-open');
    if (elements.sidebarOverlay) elements.sidebarOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeMobileSidebar() {
    if (elements.sidebar) elements.sidebar.classList.remove('mobile-open');
    if (elements.sidebarOverlay) elements.sidebarOverlay.classList.remove('active');
    document.body.style.overflow = '';
}

// ============================================
// NAVIGATION
// ============================================
function initNavigation() {
    // Get all nav items (excluding special items like theme toggle)
    var navItems = document.querySelectorAll('.nav-item[data-page]');
    
    navItems.forEach(function(item) {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            var page = item.dataset.page;
            if (page) {
                navigateToPage(page);
                
                // Close mobile sidebar after navigation
                if (window.innerWidth <= 992) {
                    closeMobileSidebar();
                }
            }
        });
    });
    
    // Handle browser back/forward
    window.addEventListener('hashchange', function() {
        var hash = window.location.hash.slice(1) || 'dashboard';
        navigateToPage(hash, false);
    });
    
    // Initial page load
    var initial = window.location.hash.slice(1) || 'dashboard';
    navigateToPage(initial, false);
}

function navigateToPage(pageName, updateHash) {
    if (updateHash === undefined) updateHash = true;
    
    state.currentPage = pageName;
    
    // Update nav items
    document.querySelectorAll('.nav-item[data-page]').forEach(function(item) {
        item.classList.toggle('active', item.dataset.page === pageName);
    });
    
    // Update pages with animation
    elements.pages.forEach(function(page) {
        var isTarget = page.id === 'page-' + pageName;
        if (isTarget) {
            page.classList.add('active');
            // Trigger animations
            var animatedEls = page.querySelectorAll('.animate-fade-in, .animate-fade-in-up');
            animatedEls.forEach(function(el, i) {
                el.style.animationDelay = (i * 0.05) + 's';
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
function fetchData() {
    var startTime = performance.now();
    
    fetch(CONFIG.API_ENDPOINT, {
        headers: {
            'ngrok-skip-browser-warning': 'true',
            'Accept': 'application/json',
        },
        cache: 'no-store'
    })
    .then(function(response) {
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return response.json();
    })
    .then(function(json) {
        var responseTime = Math.round(performance.now() - startTime);
        
        // Handle nested data structure
        var data = json.data || json;
        var serverResponseTime = data.response_time_ms || responseTime;
        
        state.apiData = data;
        state.isOnline = json.success !== false;
        state.lastUpdated = new Date();
        state.fetchCount++;
        
        // Update real-time data (always update)
        updateDashboard(data, serverResponseTime);
        updateStats(data);
        updateNowPlaying(data);
        
        // Update Sources & Filters only ONCE (first load)
        if (!state.sourcesLoaded) {
            updateSources(data);
            state.sourcesLoaded = true;
            console.log('📦 Sources loaded (one-time)');
        }
        
        if (!state.filtersLoaded) {
            updateFilters(data);
            state.filtersLoaded = true;
            console.log('🎛️ Filters loaded (one-time)');
        }
        
        // Update charts
        if (state.chartsInitialized) {
            updateCharts(data, serverResponseTime);
        }
    })
    .catch(function(error) {
        console.error('❌ Fetch error:', error.message);
        state.isOnline = false;
        updateOfflineState();
    });
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
    if (el) el.textContent = (text !== null && text !== undefined) ? text : '--';
}

function safeSetWidth(el, percent) {
    if (el) el.style.width = Math.min(Math.max(percent || 0, 0), 100) + '%';
}

function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function escapeHtml(str) {
    if (!str) return '';
    var div = document.createElement('div');
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
        var statusText = elements.apiStatusIndicator.querySelector('.status-text');
        if (statusText) statusText.textContent = state.isOnline ? 'API Online' : 'API Offline';
    }
    
    safeSetText(elements.lastUpdated, 'Just now');
    safeSetText(elements.apiStatus, state.isOnline ? 'Online' : 'Offline');
    safeSetText(elements.responseTime, responseTime + 'ms');
    
    var serverVersion = data.server && data.server.version ? data.server.version.semver : null;
    safeSetText(elements.serverVersion, serverVersion);
    
    // Health
    var health = (data.performance && data.performance.health) || {};
    safeSetText(elements.healthGrade, health.grade);
    safeSetText(elements.healthScore, health.score !== undefined ? health.score + '%' : null);
    
    var uptimeFormatted = data.performance && data.performance.uptime ? data.performance.uptime.formatted : null;
    safeSetText(elements.uptime, uptimeFormatted);
    
    // Players
    var audioStats = data.audio_stats || {};
    var players = audioStats.players || {};
    var total = players.total || 0;
    var playing = players.playing || 0;
    var idle = players.idle !== undefined ? players.idle : (total - playing);
    
    safeSetText(elements.totalPlayers, total.toString());
    safeSetText(elements.activePlaying, playing.toString());
    safeSetText(elements.idlePlayers, idle.toString());
    
    var maxPlayers = Math.max(total, 10);
    safeSetWidth(elements.playersBar, (total / maxPlayers) * 100);
    safeSetWidth(elements.activeBar, total > 0 ? (playing / total) * 100 : 0);
    safeSetWidth(elements.idleBar, total > 0 ? (idle / total) * 100 : 0);
    
    // Frame Integrity
    var frames = audioStats.frame_analysis || {};
    var integrity = parsePercentage(frames.integrity);
    safeSetText(elements.frameIntegrity, integrity.toFixed(0) + '%');
    safeSetWidth(elements.frameBar, integrity);
}

function updateOfflineState() {
    if (elements.apiStatusIndicator) {
        elements.apiStatusIndicator.classList.add('offline');
        var text = elements.apiStatusIndicator.querySelector('.status-text');
        if (text) text.textContent = 'API Offline';
    }
    safeSetText(elements.apiStatus, 'Offline');
    safeSetText(elements.responseTime, '--ms');
}

// ============================================
// STATS PAGE
// ============================================
function updateStats(data) {
    var cpu = (data.performance && data.performance.cpu) || {};
    var memory = (data.performance && data.performance.memory) || {};
    var audioStats = data.audio_stats || {};
    var players = audioStats.players || {};
    var frames = audioStats.frame_analysis || {};
    
    // CPU
    safeSetText(elements.cpuSystemLoad, cpu.system_load || '--');
    safeSetText(elements.cpuLavalinkLoad, cpu.lavalink_load || '--');
    safeSetText(elements.cpuCores, cpu.cores ? cpu.cores.toString() : null);
    
    // Memory
    safeSetText(elements.memUsed, memory.used ? memory.used.formatted : null);
    safeSetText(elements.memAllocated, memory.allocated ? memory.allocated.formatted : null);
    safeSetText(elements.memFree, memory.free ? memory.free.formatted : null);
    safeSetText(elements.memUsage, memory.usage_percent);
    
    // Players
    safeSetText(elements.statTotalPlayers, players.total ? players.total.toString() : '0');
    safeSetText(elements.statPlayingPlayers, players.playing ? players.playing.toString() : '0');
    safeSetText(elements.statIdlePlayers, (players.idle !== undefined ? players.idle : 0).toString());
    
    // Frames
    safeSetText(elements.statFrameIntegrity, frames.integrity);
    safeSetText(elements.statFrameStatus, frames.status);
    safeSetText(elements.statFrameSent, frames.raw ? frames.raw.sent : null);
    safeSetText(elements.statFrameExpected, frames.raw ? frames.raw.expected : null);
}

// ============================================
// NOW PLAYING
// ============================================
function updateNowPlaying(data) {
    var nowPlaying = data.now_playing || [];
    
    safeSetText(elements.playingCount, nowPlaying.length + ' track' + (nowPlaying.length !== 1 ? 's' : ''));
    
    if (!elements.nowPlayingContainer) return;
    
    if (nowPlaying.length === 0) {
        elements.nowPlayingContainer.innerHTML = 
            '<div class="empty-state">' +
                '<i class="fas fa-music"></i>' +
                '<p>No tracks currently playing</p>' +
            '</div>';
        return;
    }
    
    var html = '';
    nowPlaying.forEach(function(track, i) {
        html += createNowPlayingCard(track, i);
    });
    elements.nowPlayingContainer.innerHTML = html;
}

function createNowPlayingCard(track, index) {
    var meta = track.metadata || {};
    var playback = track.playback_state || {};
    
    var title = meta.title || 'Unknown Title';
    var author = meta.author || 'Unknown Artist';
    var artwork = meta.artwork_url || 'https://via.placeholder.com/90/1a1a25/6366f1?text=♪';
    var source = meta.source || 'unknown';
    
    var position = (playback.position && playback.position.raw) ? playback.position.raw : 0;
    var duration = (playback.duration && playback.duration.raw) ? playback.duration.raw : 1;
    var progress = Math.min((position / duration) * 100, 100);
    
    var currentTime = formatTimestamp(playback.position ? playback.position.stamp : null);
    var totalTime = formatTimestamp(playback.duration ? playback.duration.stamp : null);
    var ping = playback.ping || '--';
    var connected = playback.connected !== false;
    var guildId = track.guild_id || '';
    
    return '<div class="now-playing-card animate-fade-in-up" style="animation-delay: ' + (index * 0.1) + 's">' +
        '<div class="np-header">' +
            '<div class="np-artwork">' +
                '<img src="' + escapeHtml(artwork) + '" alt="Artwork" onerror="this.src=\'https://via.placeholder.com/90/1a1a25/6366f1?text=♪\'">' +
                '<div class="np-playing-indicator"><i class="fas fa-play"></i></div>' +
            '</div>' +
            '<div class="np-info">' +
                '<h4 class="np-title" title="' + escapeHtml(title) + '">' + escapeHtml(title) + '</h4>' +
                '<p class="np-artist" title="' + escapeHtml(author) + '">' + escapeHtml(author) + '</p>' +
                '<span class="np-source"><i class="' + getSourceIcon(source) + '"></i> ' + capitalize(source) + '</span>' +
            '</div>' +
        '</div>' +
        '<div class="np-progress">' +
            '<div class="progress-bar"><div class="progress-fill" style="width: ' + progress + '%"></div></div>' +
            '<div class="progress-time"><span>' + currentTime + '</span><span>' + totalTime + '</span></div>' +
        '</div>' +
        '<div class="np-footer">' +
            '<div class="np-stats">' +
                '<span class="np-stat"><i class="fas fa-signal"></i> ' + ping + '</span>' +
                '<span class="np-stat"><i class="fas fa-server"></i> ' + (guildId ? '...' + guildId.slice(-6) : '--') + '</span>' +
            '</div>' +
            '<span class="np-status ' + (connected ? 'connected' : 'disconnected') + '">' +
                '<i class="fas fa-' + (connected ? 'check-circle' : 'times-circle') + '"></i> ' +
                (connected ? 'Connected' : 'Disconnected') +
            '</span>' +
        '</div>' +
    '</div>';
}

function getSourceIcon(source) {
    var icons = {
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
    var key = source ? source.toLowerCase() : '';
    return icons[key] || 'fas fa-music';
}

// ============================================
// SOURCES PAGE (Load Once) - FIXED STRUCTURE
// ============================================
function updateSources(data) {
    if (!elements.sourcesGrid) return;
    
    var capabilities = data.server && data.server.capabilities;
    var sources = (capabilities && capabilities.sources) || [];
    
    if (sources.length === 0) {
        elements.sourcesGrid.innerHTML = 
            '<div class="empty-state">' +
                '<i class="fas fa-plug"></i>' +
                '<p>No sources available</p>' +
            '</div>';
        return;
    }
    
    var sorted = sources.slice().sort(function(a, b) {
        return a.localeCompare(b);
    });
    
    var html = '';
    sorted.forEach(function(source, i) {
        var info = getSourceInfo(source);
        // FIXED: Structure now matches Audio Filters - checkmark in header (top right)
        html += '<div class="source-card animate-fade-in-up" style="animation-delay: ' + (i * 0.03) + 's">' +
            // Header: Icon + Name on LEFT, Checkmark on RIGHT (same as filter-header)
            '<div class="source-header">' +
                '<div class="source-title">' +
                    '<div class="source-icon ' + info.iconClass + '"><i class="' + info.icon + '"></i></div>' +
                    '<span class="source-name">' + escapeHtml(info.name) + '</span>' +
                '</div>' +
                '<div class="source-check"><i class="fas fa-check"></i></div>' +
            '</div>' +
            // Description
            '<p class="source-description">' + escapeHtml(info.description) + '</p>' +
            // Status at bottom
            '<span class="source-status">Available</span>' +
        '</div>';
    });
    
    elements.sourcesGrid.innerHTML = html;
}

function getSourceInfo(source) {
    var map = {
        youtube: { name: 'YouTube', icon: 'fab fa-youtube', iconClass: 'youtube', description: 'Stream music and videos directly from YouTube' },
        spotify: { name: 'Spotify', icon: 'fab fa-spotify', iconClass: 'spotify', description: 'Access millions of songs from Spotify library' },
        soundcloud: { name: 'SoundCloud', icon: 'fab fa-soundcloud', iconClass: 'soundcloud', description: 'Discover and stream independent artists' },
        deezer: { name: 'Deezer', icon: 'fas fa-compact-disc', iconClass: 'deezer', description: 'High-quality music streaming service' },
        applemusic: { name: 'Apple Music', icon: 'fab fa-apple', iconClass: 'applemusic', description: 'Stream from Apple Music premium library' },
        tidal: { name: 'Tidal', icon: 'fas fa-water', iconClass: 'tidal', description: 'High-fidelity lossless audio streaming' },
        amazonmusic: { name: 'Amazon Music', icon: 'fab fa-amazon', iconClass: 'amazon', description: 'Stream from Amazon Music catalog' },
        pandora: { name: 'Pandora', icon: 'fas fa-podcast', iconClass: 'default', description: 'Personalized radio and music streaming' },
        qobuz: { name: 'Qobuz', icon: 'fas fa-headphones', iconClass: 'default', description: 'Hi-res audio streaming service' },
        twitch: { name: 'Twitch', icon: 'fab fa-twitch', iconClass: 'twitch', description: 'Stream audio from Twitch streams and VODs' },
        vimeo: { name: 'Vimeo', icon: 'fab fa-vimeo-v', iconClass: 'vimeo', description: 'Stream audio from Vimeo videos' },
        bilibili: { name: 'Bilibili', icon: 'fas fa-tv', iconClass: 'default', description: 'Stream from Bilibili video platform' },
        nicovideo: { name: 'Niconico', icon: 'fas fa-play-circle', iconClass: 'default', description: 'Japanese video sharing platform' },
        instagram: { name: 'Instagram', icon: 'fab fa-instagram', iconClass: 'instagram', description: 'Stream audio from Instagram content' },
        twitter: { name: 'Twitter/X', icon: 'fab fa-twitter', iconClass: 'twitter', description: 'Stream audio from Twitter/X posts' },
        reddit: { name: 'Reddit', icon: 'fab fa-reddit-alien', iconClass: 'reddit', description: 'Stream media from Reddit posts' },
        tumblr: { name: 'Tumblr', icon: 'fab fa-tumblr', iconClass: 'default', description: 'Stream audio from Tumblr posts' },
        pinterest: { name: 'Pinterest', icon: 'fab fa-pinterest', iconClass: 'default', description: 'Stream media from Pinterest' },
        telegram: { name: 'Telegram', icon: 'fab fa-telegram', iconClass: 'telegram', description: 'Stream audio from Telegram channels' },
        bluesky: { name: 'Bluesky', icon: 'fas fa-cloud', iconClass: 'default', description: 'Stream from Bluesky social platform' },
        kwai: { name: 'Kwai', icon: 'fas fa-video', iconClass: 'default', description: 'Stream from Kwai video platform' },
        bandcamp: { name: 'Bandcamp', icon: 'fab fa-bandcamp', iconClass: 'bandcamp', description: 'Support artists with direct streaming' },
        mixcloud: { name: 'Mixcloud', icon: 'fab fa-mixcloud', iconClass: 'mixcloud', description: 'Stream DJ mixes and radio shows' },
        audiomack: { name: 'Audiomack', icon: 'fas fa-headphones-alt', iconClass: 'default', description: 'Free music streaming platform' },
        audius: { name: 'Audius', icon: 'fas fa-wave-square', iconClass: 'default', description: 'Decentralized music streaming' },
        yandexmusic: { name: 'Yandex Music', icon: 'fab fa-yandex', iconClass: 'yandex', description: 'Russian music streaming service' },
        vkmusic: { name: 'VK Music', icon: 'fab fa-vk', iconClass: 'default', description: 'Stream music from VK platform' },
        jiosaavn: { name: 'JioSaavn', icon: 'fas fa-music', iconClass: 'jiosaavn', description: 'Indian music streaming service' },
        gaana: { name: 'Gaana', icon: 'fas fa-music', iconClass: 'default', description: 'Indian music streaming platform' },
        genius: { name: 'Genius', icon: 'fas fa-microphone-alt', iconClass: 'default', description: 'Lyrics and music knowledge' },
        lastfm: { name: 'Last.fm', icon: 'fab fa-lastfm', iconClass: 'default', description: 'Music discovery and scrobbling' },
        shazam: { name: 'Shazam', icon: 'fas fa-bolt', iconClass: 'default', description: 'Music recognition service' },
        letrasmus: { name: 'Letras', icon: 'fas fa-align-left', iconClass: 'default', description: 'Song lyrics database' },
        flowery: { name: 'Flowery TTS', icon: 'fas fa-comment-dots', iconClass: 'flowery', description: 'Text-to-speech with natural voices' },
        'google-tts': { name: 'Google TTS', icon: 'fab fa-google', iconClass: 'default', description: 'Google text-to-speech service' },
        http: { name: 'HTTP Streams', icon: 'fas fa-globe', iconClass: 'http', description: 'Play from direct HTTP/HTTPS links' },
        local: { name: 'Local Files', icon: 'fas fa-folder-open', iconClass: 'default', description: 'Play local audio files' },
        rss: { name: 'RSS Feeds', icon: 'fas fa-rss', iconClass: 'default', description: 'Stream from podcast RSS feeds' },
        songlink: { name: 'Songlink', icon: 'fas fa-link', iconClass: 'default', description: 'Universal music link resolver' },
        eternalbox: { name: 'Eternal Box', icon: 'fas fa-infinity', iconClass: 'default', description: 'Infinite jukebox for songs' },
    };
    
    var key = source.toLowerCase().replace(/[-_\s]/g, '');
    var info = map[key];
    
    if (info) return info;
    
    return {
        name: capitalize(source.replace(/[-_]/g, ' ')),
        icon: 'fas fa-music',
        iconClass: 'default',
        description: 'Audio source for music streaming'
    };
}

// ============================================
// FILTERS PAGE (Load Once)
// ============================================
function updateFilters(data) {
    if (!elements.filtersGrid) return;
    
    var capabilities = data.server && data.server.capabilities;
    var filters = (capabilities && capabilities.filters) || [];
    
    if (filters.length === 0) {
        elements.filtersGrid.innerHTML = 
            '<div class="empty-state">' +
                '<i class="fas fa-sliders-h"></i>' +
                '<p>No filters available</p>' +
            '</div>';
        return;
    }
    
    var sorted = filters.slice().sort(function(a, b) {
        return a.localeCompare(b);
    });
    
    var html = '';
    sorted.forEach(function(filter, i) {
        var info = getFilterInfo(filter);
        html += '<div class="filter-card animate-fade-in-up" style="animation-delay: ' + (i * 0.03) + 's">' +
            '<div class="filter-header">' +
                '<span class="filter-name">' + escapeHtml(info.name) + '</span>' +
                '<div class="filter-check"><i class="fas fa-check"></i></div>' +
            '</div>' +
            '<p class="filter-description">' + escapeHtml(info.description) + '</p>' +
        '</div>';
    });
    
    elements.filtersGrid.innerHTML = html;
}

function getFilterInfo(filter) {
    var map = {
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
    
    var key = filter.toLowerCase();
    var info = map[key];
    
    if (info) return info;
    
    return {
        name: capitalize(filter.replace(/[-_]/g, ' ')),
        description: 'Audio processing filter for enhanced sound'
    };
}

// ============================================
// CHARTS
// ============================================
function initCharts() {
    if (typeof Chart === 'undefined') return;
    
    var colors = getChartColors();
    
    var lineDefaults = {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 300 },
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(0,0,0,0.8)',
                cornerRadius: 8,
                padding: 12,
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
    var cpuEl = document.getElementById('cpuChart');
    if (cpuEl) {
        state.charts.cpu = new Chart(cpuEl.getContext('2d'), {
            type: 'line',
            data: {
                labels: new Array(CONFIG.CHART_HISTORY_LENGTH).fill(''),
                datasets: [
                    {
                        label: 'System',
                        data: new Array(CONFIG.CHART_HISTORY_LENGTH).fill(0),
                        borderColor: colors.primary,
                        backgroundColor: colors.primaryLight,
                        fill: true,
                    },
                    {
                        label: 'Lavalink',
                        data: new Array(CONFIG.CHART_HISTORY_LENGTH).fill(0),
                        borderColor: colors.info,
                        backgroundColor: colors.infoLight,
                        fill: true,
                    },
                ],
            },
            options: Object.assign({}, lineDefaults, {
                scales: Object.assign({}, lineDefaults.scales, {
                    y: Object.assign({}, lineDefaults.scales.y, { max: 100 })
                })
            }),
        });
    }
    
    // Memory Chart (Doughnut)
    var memEl = document.getElementById('memoryChart');
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
                animation: { duration: 300 },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(ctx) {
                                return ctx.label + ': ' + ctx.raw.toFixed(1) + '%';
                            }
                        }
                    }
                },
            },
        });
    }
    
    // Players Chart (Bar)
    var playersEl = document.getElementById('playersChart');
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
                animation: { duration: 300 },
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { display: false }, ticks: { color: colors.text } },
                    y: { beginAtZero: true, grid: { color: colors.grid }, ticks: { color: colors.text } },
                },
            },
        });
    }
    
    // Frame Chart
    var frameEl = document.getElementById('frameChart');
    if (frameEl) {
        state.charts.frame = new Chart(frameEl.getContext('2d'), {
            type: 'line',
            data: {
                labels: new Array(CONFIG.CHART_HISTORY_LENGTH).fill(''),
                datasets: [{
                    label: 'Integrity',
                    data: new Array(CONFIG.CHART_HISTORY_LENGTH).fill(100),
                    borderColor: colors.success,
                    backgroundColor: colors.successLight,
                    fill: true,
                }],
            },
            options: Object.assign({}, lineDefaults, {
                scales: Object.assign({}, lineDefaults.scales, {
                    y: Object.assign({}, lineDefaults.scales.y, { max: 100 })
                })
            }),
        });
    }
    
    // Uptime/Response Chart
    var uptimeEl = document.getElementById('uptimeChart');
    if (uptimeEl) {
        state.charts.uptime = new Chart(uptimeEl.getContext('2d'), {
            type: 'line',
            data: {
                labels: new Array(CONFIG.CHART_HISTORY_LENGTH).fill(''),
                datasets: [{
                    label: 'Response (ms)',
                    data: new Array(CONFIG.CHART_HISTORY_LENGTH).fill(0),
                    borderColor: colors.primary,
                    backgroundColor: colors.primaryLight,
                    fill: true,
                }],
            },
            options: Object.assign({}, lineDefaults, {
                elements: { point: { radius: 2, hoverRadius: 5 } },
                scales: {
                    x: { display: true, grid: { color: colors.grid }, ticks: { color: colors.text, maxTicksLimit: 8 } },
                    y: { display: true, beginAtZero: true, grid: { color: colors.grid }, ticks: { color: colors.text } },
                },
            }),
        });
    }
}

function updateCharts(data, responseTime) {
    if (!state.chartsInitialized) return;
    
    var cpu = (data.performance && data.performance.cpu) || {};
    var memory = (data.performance && data.performance.memory) || {};
    var audioStats = data.audio_stats || {};
    var players = audioStats.players || {};
    var frames = audioStats.frame_analysis || {};
    
    // CPU
    if (state.charts.cpu) {
        var sys = Math.min(parsePercentage(cpu.system_load), 100);
        var lava = Math.min(parsePercentage(cpu.lavalink_load), 100);
        pushData(state.charts.cpu.data.datasets[0].data, sys);
        pushData(state.charts.cpu.data.datasets[1].data, lava);
        state.charts.cpu.update('none');
    }
    
    // Memory
    if (state.charts.memory) {
        var usage = parsePercentage(memory.usage_percent);
        state.charts.memory.data.datasets[0].data = [usage, 100 - usage];
        state.charts.memory.update('none');
    }
    
    // Players
    if (state.charts.players) {
        var total = players.total || 0;
        var playing = players.playing || 0;
        var idle = players.idle !== undefined ? players.idle : (total - playing);
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
        var time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
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
    var colors = getChartColors();
    
    Object.keys(state.charts).forEach(function(key) {
        var chart = state.charts[key];
        if (chart && chart.options && chart.options.scales) {
            ['x', 'y'].forEach(function(axis) {
                var scale = chart.options.scales[axis];
                if (scale) {
                    if (scale.grid) scale.grid.color = colors.grid;
                    if (scale.ticks) scale.ticks.color = colors.text;
                }
            });
            chart.update('none');
        }
    });
}

// ============================================
// COMMANDS
// ============================================
function initCommands() {
    if (elements.commandSearch) {
        elements.commandSearch.addEventListener('input', function(e) {
            filterCommands(e.target.value.toLowerCase().trim());
        });
    }
    
    document.querySelectorAll('.copy-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var cmd = btn.dataset.command;
            copyToClipboard(cmd);
            
            btn.innerHTML = '<i class="fas fa-check"></i>';
            btn.classList.add('copied');
            
            setTimeout(function() {
                btn.innerHTML = '<i class="fas fa-copy"></i>';
                btn.classList.remove('copied');
            }, 2000);
        });
    });
}

function filterCommands(query) {
    document.querySelectorAll('.command-category').forEach(function(cat) {
        var visible = false;
        
        cat.querySelectorAll('.command-item').forEach(function(item) {
            var codeEl = item.querySelector('code');
            var descEl = item.querySelector('p');
            var code = codeEl ? codeEl.textContent.toLowerCase() : '';
            var desc = descEl ? descEl.textContent.toLowerCase() : '';
            var match = !query || code.indexOf(query) !== -1 || desc.indexOf(query) !== -1;
            
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
    document.querySelectorAll('.faq-question').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var item = btn.closest('.faq-item');
            var wasActive = item.classList.contains('active');
            
            // Close all
            document.querySelectorAll('.faq-item.active').forEach(function(i) {
                i.classList.remove('active');
            });
            
            // Toggle current
            if (!wasActive) item.classList.add('active');
        });
    });
}

// ============================================
// FEEDBACK FORM
// ============================================
function initFeedbackForm() {
    if (elements.feedbackForm) {
        elements.feedbackForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            var btn = e.target.querySelector('.submit-btn');
            var originalHTML = btn.innerHTML;
            
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            btn.disabled = true;
            
            // Simulate submission
            setTimeout(function() {
                showToast('Feedback Sent!', 'Thank you for your feedback. We appreciate it!', 'success');
                e.target.reset();
                
                btn.innerHTML = originalHTML;
                btn.disabled = false;
            }, 1500);
        });
    }
}

// ============================================
// TOAST NOTIFICATIONS
// ============================================
function showToast(title, message, type) {
    type = type || 'info';
    
    if (!elements.toastContainer) return;
    
    var icons = {
        success: 'fa-check-circle',
        error: 'fa-times-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle',
    };
    
    var toast = document.createElement('div');
    toast.className = 'toast ' + type;
    toast.innerHTML = 
        '<div class="toast-icon"><i class="fas ' + (icons[type] || icons.info) + '"></i></div>' +
        '<div class="toast-content">' +
            '<div class="toast-title">' + escapeHtml(title) + '</div>' +
            '<div class="toast-message">' + escapeHtml(message) + '</div>' +
        '</div>' +
        '<button class="toast-close"><i class="fas fa-times"></i></button>';
    
    elements.toastContainer.appendChild(toast);
    
    var closeToast = function() {
        toast.classList.add('hide');
        setTimeout(function() {
            if (toast.parentNode) toast.remove();
        }, 300);
    };
    
    toast.querySelector('.toast-close').addEventListener('click', closeToast);
    setTimeout(closeToast, CONFIG.TOAST_DURATION);
}

// ============================================
// CLIPBOARD
// ============================================
function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text)
            .then(function() {
                showToast('Copied!', '"' + text + '" copied to clipboard', 'success');
            })
            .catch(function() {
                fallbackCopy(text);
            });
    } else {
        fallbackCopy(text);
    }
}

function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;left:-9999px;top:-9999px';
    document.body.appendChild(ta);
    ta.select();
    
    try {
        document.execCommand('copy');
        showToast('Copied!', '"' + text + '" copied', 'success');
    } catch (e) {
        showToast('Error', 'Failed to copy', 'error');
    }
    
    ta.remove();
}

// ============================================
// MANUAL REFRESH FUNCTIONS
// ============================================
function refreshSources() {
    state.sourcesLoaded = false;
    if (state.apiData) {
        updateSources(state.apiData);
        state.sourcesLoaded = true;
        showToast('Refreshed', 'Sources updated', 'success');
    }
}

function refreshFilters() {
    state.filtersLoaded = false;
    if (state.apiData) {
        updateFilters(state.apiData);
        state.filtersLoaded = true;
        showToast('Refreshed', 'Filters updated', 'success');
    }
}

// ============================================
// WINDOW EVENTS
// ============================================
window.addEventListener('resize', function() {
    if (window.innerWidth > 992) {
        closeMobileSidebar();
    }
});

document.addEventListener('touchmove', function(e) {
    if (elements.sidebarOverlay && elements.sidebarOverlay.classList.contains('active')) {
        if (elements.sidebar && !elements.sidebar.contains(e.target)) {
            e.preventDefault();
        }
    }
}, { passive: false });

document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        stopAutoRefresh();
    } else {
        fetchData();
        startAutoRefresh();
    }
});

window.addEventListener('beforeunload', function() {
    stopAutoRefresh();
});

// ============================================
// EXPOSE TO WINDOW (DEBUG)
// ============================================
window.dashboard = {
    state: state,
    CONFIG: CONFIG,
    fetchData: fetchData,
    showToast: showToast,
    refreshSources: refreshSources,
    refreshFilters: refreshFilters,
    startAutoRefresh: startAutoRefresh,
    stopAutoRefresh: stopAutoRefresh,
};

console.log('📜 app.js loaded successfully');
