// متغيرات عامة
let currentPlayerId = null;
let currentPlayer = null;
let players = [];
let posts = [];
let messages = [];

// تحميل البيانات عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    // التحقق من وجود بيانات اللاعب في localStorage
    const playerData = localStorage.getItem('playerData');
    if (playerData) {
        currentPlayer = JSON.parse(playerData);
        currentPlayerId = currentPlayer.id;
        showPlayerDashboard();
        loadPlayerData();
        loadPosts();
        loadMessages();
        loadChampion();
        loadChampion();
        setupWebSocket();
        
        // تحديث البيانات كل 30 ثانية
        setInterval(() => {
            loadPlayerData();
            loadPosts();
            loadMessages();
            loadChampion();
        }, 30000);
    } else {
        showLoginScreen();
    }
});

// إظهار شاشة تسجيل الدخول
function showLoginScreen() {
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('player-dashboard').style.display = 'none';
}

// إظهار لوحة اللاعب
function showPlayerDashboard() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('player-dashboard').style.display = 'block';
}

// تسجيل دخول اللاعب
async function playerLogin() {
    const playerIdInput = document.getElementById('login-player-id');
    const passwordInput = document.getElementById('login-password');
    const errorDiv = document.getElementById('login-error');
    
    const playerId = playerIdInput.value.trim();
    const password = passwordInput.value.trim();
    
    if (!playerId) {
        showLoginError('يرجى إدخال معرف اللاعب');
        return;
    }
    
    if (!password) {
        showLoginError('يرجى إدخال كلمة المرور');
        return;
    }
    
    try {
        const response = await fetch('/api/player/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ playerId, password }),
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            currentPlayer = data.player;
            currentPlayerId = data.player.id;
            
            // حفظ بيانات اللاعب في localStorage
            localStorage.setItem('playerData', JSON.stringify(data.player));
            
            // إظهار لوحة اللاعب
            showPlayerDashboard();
            
            // تحميل البيانات
            loadPlayerData();
            loadPosts();
            loadMessages();
            loadChampion();
            setupWebSocket();
            
            // تحديث البيانات كل 30 ثانية
            setInterval(() => {
                loadPlayerData();
                loadPosts();
                loadMessages();
                loadChampion();
                loadChampion();
            }, 30000);
            
        } else {
            showLoginError(data.error || 'خطأ في تسجيل الدخول');
        }
    } catch (error) {
        console.error('خطأ في تسجيل الدخول:', error);
        showLoginError('حدث خطأ أثناء تسجيل الدخول');
    }
}

// عرض رسالة خطأ تسجيل الدخول
function showLoginError(message) {
    const errorDiv = document.getElementById('login-error');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}

// تسجيل الخروج
function logout() {
    localStorage.removeItem('playerData');
    currentPlayer = null;
    currentPlayerId = null;
    window.location.href = '/';
    
    // مسح الحقول
    // سيتم مسح الحقول تلقائياً عند إعادة تحميل الصفحة
}

// إعداد WebSocket للرسائل المباشرة
function setupWebSocket() {
    const ws = new WebSocket('ws://localhost:8080');
    
    ws.onmessage = function(event) {
        const data = JSON.parse(event.data);
        if (data.type === 'message' && data.playerId === currentPlayerId) {
            loadMessages();
        }
    };
    
    window.wsConnection = ws;
}

// تحميل بيانات اللاعب
async function loadPlayerData() {
    try {
        // تحميل بيانات اللاعب الحالي
        const playerResponse = await fetch(`/api/player/${currentPlayerId}`);
        if (playerResponse.ok) {
            const updatedPlayer = await playerResponse.json();
            currentPlayer = updatedPlayer;
            
            // تحديث localStorage
            localStorage.setItem('playerData', JSON.stringify(updatedPlayer));
            
            displayPlayerInfo();
        }
        
        // تحميل جميع اللاعبين للرانكينج
        const playersResponse = await fetch('/api/players');
        players = await playersResponse.json();
        displayRankings();
    } catch (error) {
        console.error('خطأ في تحميل بيانات اللاعب:', error);
    }
}

// عرض معلومات اللاعب
function displayPlayerInfo() {
    const playerInfo = document.getElementById('player-info');
    if (!playerInfo || !currentPlayer) return;
    
    playerInfo.innerHTML = `
        <h2>مرحباً ${currentPlayer.name} 👋</h2>
        <p>معرف اللاعب: ${currentPlayer.id}</p>
    `;
    
    // تحديث الإحصائيات
    document.getElementById('player-points').textContent = currentPlayer.points;
    document.getElementById('player-absences').textContent = currentPlayer.absences;
    document.getElementById('player-rank').textContent = currentPlayer.rank;
    
    // تحديث عنوان الصفحة
    document.title = `${currentPlayer.name} - أكاديمية الكابتن`;
}

// تحميل المنشورات
async function loadPosts() {
    try {
        const response = await fetch('/api/posts');
        posts = await response.json();
        displayPosts();
    } catch (error) {
        console.error('خطأ في تحميل المنشورات:', error);
    }
}

// عرض المنشورات
function displayPosts() {
    const postsContainer = document.getElementById('player-posts-container');
    if (!postsContainer) return;
    
    postsContainer.innerHTML = '';
    
    if (posts.length === 0) {
        postsContainer.innerHTML = '<p style="text-align: center; color: #7f8c8d;">لا توجد منشورات بعد</p>';
        return;
    }
    
    posts.forEach(post => {
        const postItem = document.createElement('div');
        postItem.className = 'post-item fade-in';
        
        const postDate = new Date(post.timestamp).toLocaleString('ar-EG');
        const postTypeText = getPostTypeText(post.type);
        
        postItem.innerHTML = `
            <div class="post-header">
                <span class="post-type">${postTypeText}</span>
                <span class="post-date">${postDate}</span>
            </div>
            <div class="post-content">${post.content}</div>
            ${getPostMediaHTML(post)}
        `;
        
        postsContainer.appendChild(postItem);
    });
}

// عرض الترتيب
function displayRankings() {
    const rankingsContainer = document.getElementById('player-rankings');
    if (!rankingsContainer) return;
    
    rankingsContainer.innerHTML = '';
    
    players.forEach(player => {
        const rankingItem = document.createElement('div');
        rankingItem.className = 'ranking-item fade-in';
        
        // تمييز اللاعب الحالي
        if (player.id === currentPlayerId) {
            rankingItem.style.background = '#e8f4f8';
            rankingItem.style.border = '2px solid #3498db';
        }
        
        const rankClass = player.rank === 1 ? 'gold' : player.rank === 2 ? 'silver' : player.rank === 3 ? 'bronze' : '';
        
        rankingItem.innerHTML = `
            <span class="rank-number ${rankClass}">${player.rank}</span>
            <span class="player-name">${player.name}${player.id === currentPlayerId ? ' (أنت)' : ''}</span>
            <span class="points-display">${player.points}</span>
            <span class="absences-display">${player.absences}</span>
        `;
        
        rankingsContainer.appendChild(rankingItem);
    });
}

// تحميل الرسائل
async function loadMessages() {
    try {
        const response = await fetch(`/api/messages/${currentPlayerId}`);
        messages = await response.json();
        displayMessages();
    } catch (error) {
        console.error('خطأ في تحميل الرسائل:', error);
    }
}

// عرض الرسائل
function displayMessages() {
    const chatMessagesContainer = document.getElementById('player-chat-messages');
    if (!chatMessagesContainer) return;
    
    chatMessagesContainer.innerHTML = '';
    
    if (messages.length === 0) {
        chatMessagesContainer.innerHTML = '<p style="text-align: center; color: #7f8c8d;">لا توجد رسائل بعد</p>';
        return;
    }
    
    messages.forEach(message => {
        const messageItem = document.createElement('div');
        messageItem.className = `message-item ${message.sender}`;
        
        const messageTime = new Date(message.timestamp).toLocaleString('ar-EG');
        
        messageItem.innerHTML = `
            <div>${message.message}</div>
            <div class="message-time">${messageTime}</div>
        `;
        
        chatMessagesContainer.appendChild(messageItem);
    });
    
    // التمرير إلى آخر رسالة
    chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
}

// تحميل بطل الأسبوع
async function loadChampion() {
    try {
        const response = await fetch('/api/champion');
        const champion = await response.json();
        displayChampion(champion);
    } catch (error) {
        console.error('خطأ في تحميل بطل الأسبوع:', error);
    }
}

// عرض بطل الأسبوع
function displayChampion(champion) {
    const championDisplay = document.getElementById('player-champion-display');
    if (!championDisplay) return;
    
    if (champion && champion.name) {
        championDisplay.innerHTML = `
            <div class="champion-content">
                ${champion.image ? `<img src="/uploads/${champion.image}" alt="${champion.name}" class="champion-image">` : ''}
                <div class="champion-name">${champion.name}</div>
                <div class="champion-title">🏆 بطل هذا الأسبوع</div>
            </div>
        `;
    } else {
        championDisplay.innerHTML = `
            <div class="champion-placeholder">
                <div class="champion-icon">🏆</div>
                <span>لم يتم اختيار بطل الأسبوع بعد</span>
            </div>
        `;
    }
}

// إرسال رسالة اللاعب
async function sendPlayerMessage() {
    const messageInput = document.getElementById('player-message-input');
    const message = messageInput.value.trim();
    
    if (!message) {
        return;
    }
    
    try {
        const response = await fetch('/api/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                playerId: currentPlayerId,
                message: message,
                sender: 'player'
            }),
        });
        
        if (response.ok) {
            messageInput.value = '';
            loadMessages();
            
            // إرسال الرسالة عبر WebSocket
            if (window.wsConnection) {
                window.wsConnection.send(JSON.stringify({
                    type: 'message',
                    playerId: currentPlayerId,
                    message: message,
                    sender: 'player'
                }));
            }
        } else {
            throw new Error('فشل في إرسال الرسالة');
        }
    } catch (error) {
        console.error('خطأ في إرسال الرسالة:', error);
        alert('حدث خطأ أثناء إرسال الرسالة');
    }
}

// دوال مساعدة
function getPostTypeText(type) {
    const types = {
        'text': 'نص',
        'image': 'صورة',
        'video': 'فيديو',
        'youtube': 'يوتيوب',
        'audio': 'تسجيل صوتي'
    };
    return types[type] || 'منشور';
}

function getPostMediaHTML(post) {
    if (!post.media && post.type !== 'youtube') return '';
    
    switch (post.type) {
        case 'image':
            return `<div class="post-media"><img src="/uploads/${post.media}" alt="صورة المنشور"></div>`;
        case 'video':
            return `<div class="post-media"><video controls><source src="/uploads/${post.media}" type="video/mp4">المتصفح لا يدعم تشغيل الفيديو</video></div>`;
        case 'audio':
            return `<div class="post-media"><audio controls><source src="/uploads/${post.media}" type="audio/mpeg">المتصفح لا يدعم تشغيل الصوت</audio></div>`;
        case 'youtube':
            const youtubeId = extractYouTubeId(post.content);
            if (youtubeId) {
                return `<div class="post-media"><iframe width="100%" height="315" src="https://www.youtube.com/embed/${youtubeId}" frameborder="0" allowfullscreen></iframe></div>`;
            }
            return '';
        default:
            return '';
    }
}

function extractYouTubeId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

// السماح بإرسال الرسائل بالضغط على Enter
document.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        const messageInput = document.getElementById('player-message-input');
        const loginIdInput = document.getElementById('login-player-id');
        const loginPasswordInput = document.getElementById('login-password');
        
        if (document.activeElement === messageInput) {
            sendPlayerMessage();
        } else if (document.activeElement === loginIdInput || document.activeElement === loginPasswordInput) {
            playerLogin();
        }
    }
});

// إضافة تأثيرات بصرية
document.addEventListener('DOMContentLoaded', function() {
    // تأثير الظهور التدريجي للعناصر
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
            }
        });
    }, observerOptions);
    
    // مراقبة جميع الأقسام
    document.querySelectorAll('section').forEach(section => {
        observer.observe(section);
    });
});

// تحديث الوقت
function updateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('ar-EG');
    
    const header = document.querySelector('header');
    let timeElement = document.getElementById('current-time');
    
    if (header && !timeElement) {
        timeElement = document.createElement('div');
        timeElement.id = 'current-time';
        timeElement.style.cssText = `
            position: absolute;
            top: 10px;
            right: 20px;
            background: rgba(0,0,0,0.1);
            padding: 5px 10px;
            border-radius: 15px;
            font-size: 0.9rem;
            color: #34495e;
        `;
        header.style.position = 'relative';
        header.appendChild(timeElement);
    }
    
    if (timeElement) {
        timeElement.textContent = timeString;
    }
}

setInterval(updateTime, 1000);
updateTime();