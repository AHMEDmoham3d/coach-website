// متغيرات عامة
let players = [];
let posts = [];
let currentChatPlayer = null;
let chatMessages = {};

// تحميل البيانات عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    loadPlayers();
    loadPosts();
    loadChampion();
    setupWebSocket();
    
    // إظهار قسم اللاعبين بشكل افتراضي
    showSection('players');
});

// إعداد WebSocket للرسائل المباشرة
function setupWebSocket() {
    const ws = new WebSocket('ws://localhost:8080');
    
    ws.onmessage = function(event) {
        const data = JSON.parse(event.data);
        if (data.type === 'message') {
            displayMessage(data.playerId, data.message, data.sender);
        }
    };
    
    window.wsConnection = ws;
}

// إظهار قسم معين
function showSection(sectionName) {
    // إخفاء جميع الأقسام
    document.querySelectorAll('.coach-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // إظهار القسم المحدد
    document.getElementById(sectionName + '-section').classList.add('active');
    
    // تحديث الأزرار
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // البحث عن الزر المناسب وتفعيله
    const buttons = document.querySelectorAll('.nav-btn');
    buttons.forEach(btn => {
        if (btn.textContent.includes(getSectionTitle(sectionName))) {
            btn.classList.add('active');
        }
    });
    
    // تحميل البيانات حسب القسم
    if (sectionName === 'players') {
        loadPlayers();
    } else if (sectionName === 'posts') {
        loadPosts();
    } else if (sectionName === 'messages') {
        loadPlayersForMessages();
    } else if (sectionName === 'champion') {
        loadPlayersForChampion();
        loadChampion();
    }
}

// دالة مساعدة للحصول على عنوان القسم
function getSectionTitle(sectionName) {
    const titles = {
        'players': 'إدارة اللاعبين',
        'posts': 'المنشورات',
        'messages': 'الرسائل',
        'champion': 'بطل الأسبوع'
    };
    return titles[sectionName] || '';
}
// تحميل اللاعبين
async function loadPlayers() {
    try {
        const response = await fetch('/api/players');
        players = await response.json();
        displayPlayers();
    } catch (error) {
        console.error('خطأ في تحميل اللاعبين:', error);
    }
}

// عرض اللاعبين
function displayPlayers() {
    const playersContainer = document.getElementById('players-container');
    if (!playersContainer) return;
    
    playersContainer.innerHTML = '';
    
    players.forEach(player => {
        const playerCard = document.createElement('div');
        playerCard.className = 'player-card fade-in';
        
        playerCard.innerHTML = `
            <h3>${player.name}</h3>
            <div class="player-stats">
                <div class="stat-item">
                    <span>${player.points}</span>
                    <small>النقاط</small>
                </div>
                <div class="stat-item">
                    <span>${player.absences}</span>
                    <small>الغيابات</small>
                </div>
                <div class="stat-item">
                    <span>${player.rank}</span>
                    <small>الرانك</small>
                </div>
            </div>
            <div class="player-actions">
                <button class="btn-success" onclick="updatePoints('${player.id}', 'add')">+ نقطة</button>
                <button class="btn-danger" onclick="updatePoints('${player.id}', 'subtract')">- نقطة</button>
                <button class="btn-warning" onclick="updateAbsences('${player.id}', 'add')">+ غياب</button>
                <button class="btn-success" onclick="updateAbsences('${player.id}', 'subtract')">- غياب</button>
                <button class="btn-danger" onclick="deletePlayer('${player.id}')">حذف</button>
            </div>
        `;
        
        playersContainer.appendChild(playerCard);
    });
}

// إضافة لاعب جديد
async function addPlayer() {
    const nameInput = document.getElementById('new-player-name');
    const passwordInput = document.getElementById('new-player-password');
    const name = nameInput.value.trim();
    const password = passwordInput.value.trim() || '123456';
    
    if (!name) {
        alert('يرجى إدخال اسم اللاعب');
        return;
    }
    
    try {
        const response = await fetch('/api/players', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, password }),
        });
        
        if (response.ok) {
            nameInput.value = '';
            passwordInput.value = '';
            loadPlayers();
            showSuccessMessage('تم إضافة اللاعب بنجاح');
        } else {
            throw new Error('فشل في إضافة اللاعب');
        }
    } catch (error) {
        console.error('خطأ في إضافة اللاعب:', error);
        showErrorMessage('حدث خطأ أثناء إضافة اللاعب');
    }
}

// حذف لاعب
async function deletePlayer(playerId) {
    if (!confirm('هل أنت متأكد من حذف هذا اللاعب؟')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/players/${playerId}`, {
            method: 'DELETE',
        });
        
        if (response.ok) {
            loadPlayers();
            showSuccessMessage('تم حذف اللاعب بنجاح');
        } else {
            throw new Error('فشل في حذف اللاعب');
        }
    } catch (error) {
        console.error('خطأ في حذف اللاعب:', error);
        showErrorMessage('حدث خطأ أثناء حذف اللاعب');
    }
}

// تحديث النقاط
async function updatePoints(playerId, action) {
    try {
        const response = await fetch(`/api/players/${playerId}/points`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ action }),
        });
        
        if (response.ok) {
            loadPlayers();
            const actionText = action === 'add' ? 'إضافة' : 'خصم';
            showSuccessMessage(`تم ${actionText} النقطة بنجاح`);
        } else {
            throw new Error('فشل في تحديث النقاط');
        }
    } catch (error) {
        console.error('خطأ في تحديث النقاط:', error);
        showErrorMessage('حدث خطأ أثناء تحديث النقاط');
    }
}

// تحديث الغيابات
async function updateAbsences(playerId, action) {
    try {
        const response = await fetch(`/api/players/${playerId}/absences`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ action }),
        });
        
        if (response.ok) {
            loadPlayers();
            const actionText = action === 'add' ? 'إضافة' : 'خصم';
            showSuccessMessage(`تم ${actionText} الغياب بنجاح`);
        } else {
            throw new Error('فشل في تحديث الغيابات');
        }
    } catch (error) {
        console.error('خطأ في تحديث الغيابات:', error);
        showErrorMessage('حدث خطأ أثناء تحديث الغيابات');
    }
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
    const postsContainer = document.getElementById('coach-posts-container');
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

// التبديل بين حقول المنشور
function togglePostFields() {
    const postType = document.getElementById('post-type').value;
    const mediaUpload = document.getElementById('media-upload');
    const mediaFile = document.getElementById('media-file');
    
    if (postType === 'text' || postType === 'youtube') {
        mediaUpload.style.display = 'none';
        mediaFile.required = false;
    } else {
        mediaUpload.style.display = 'block';
        mediaFile.required = true;
        
        // تحديد نوع الملفات المقبولة
        switch (postType) {
            case 'image':
                mediaFile.accept = 'image/*';
                break;
            case 'video':
                mediaFile.accept = 'video/*';
                break;
            case 'audio':
                mediaFile.accept = 'audio/*';
                break;
        }
    }
}

// إضافة منشور جديد
async function addPost() {
    const postType = document.getElementById('post-type').value;
    const postContent = document.getElementById('post-content').value.trim();
    const mediaFile = document.getElementById('media-file').files[0];
    
    if (!postContent) {
        alert('يرجى كتابة محتوى المنشور');
        return;
    }
    
    if ((postType !== 'text' && postType !== 'youtube') && !mediaFile) {
        alert('يرجى اختيار ملف الوسائط');
        return;
    }
    
    const formData = new FormData();
    formData.append('content', postContent);
    formData.append('type', postType);
    
    if (mediaFile) {
        formData.append('media', mediaFile);
    }
    
    try {
        const response = await fetch('/api/posts', {
            method: 'POST',
            body: formData,
        });
        
        if (response.ok) {
            document.getElementById('post-content').value = '';
            document.getElementById('media-file').value = '';
            loadPosts();
            showSuccessMessage('تم نشر المنشور بنجاح');
        } else {
            throw new Error('فشل في نشر المنشور');
        }
    } catch (error) {
        console.error('خطأ في نشر المنشور:', error);
        showErrorMessage('حدث خطأ أثناء نشر المنشور');
    }
}

// تحميل اللاعبين لقسم الرسائل
async function loadPlayersForMessages() {
    try {
        const response = await fetch('/api/players');
        players = await response.json();
        displayPlayersForMessages();
    } catch (error) {
        console.error('خطأ في تحميل اللاعبين:', error);
    }
}

// عرض اللاعبين لقسم الرسائل
function displayPlayersForMessages() {
    const playersMessagesList = document.getElementById('players-messages-list');
    if (!playersMessagesList) return;
    
    playersMessagesList.innerHTML = '';
    
    players.forEach(player => {
        const playerItem = document.createElement('div');
        playerItem.className = 'message-player-item';
        playerItem.textContent = player.name;
        playerItem.onclick = () => selectPlayerForChat(player.id, player.name);
        
        playersMessagesList.appendChild(playerItem);
    });
}

// اختيار لاعب للمحادثة
async function selectPlayerForChat(playerId, playerName) {
    currentChatPlayer = playerId;
    
    // تحديث الواجهة
    document.getElementById('chat-player-name').textContent = playerName;
    
    // إزالة التنسيق السابق
    document.querySelectorAll('.message-player-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // إضافة التنسيق للعنصر المحدد
    event.target.classList.add('active');
    
    // تحميل الرسائل
    await loadMessages(playerId);
}

// تحميل الرسائل
async function loadMessages(playerId) {
    try {
        const response = await fetch(`/api/messages/${playerId}`);
        const messages = await response.json();
        chatMessages[playerId] = messages;
        displayMessages(playerId);
    } catch (error) {
        console.error('خطأ في تحميل الرسائل:', error);
    }
}

// عرض الرسائل
function displayMessages(playerId) {
    const chatMessagesContainer = document.getElementById('chat-messages');
    if (!chatMessagesContainer) return;
    
    chatMessagesContainer.innerHTML = '';
    
    const messages = chatMessages[playerId] || [];
    
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

// إرسال رسالة
async function sendMessage() {
    const messageInput = document.getElementById('message-input');
    const message = messageInput.value.trim();
    
    if (!message || !currentChatPlayer) {
        return;
    }
    
    try {
        const response = await fetch('/api/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                playerId: currentChatPlayer,
                message: message,
                sender: 'coach'
            }),
        });
        
        if (response.ok) {
            messageInput.value = '';
            loadMessages(currentChatPlayer);
            
            // إرسال الرسالة عبر WebSocket
            if (window.wsConnection) {
                window.wsConnection.send(JSON.stringify({
                    type: 'message',
                    playerId: currentChatPlayer,
                    message: message,
                    sender: 'coach'
                }));
            }
        } else {
            throw new Error('فشل في إرسال الرسالة');
        }
    } catch (error) {
        console.error('خطأ في إرسال الرسالة:', error);
        showErrorMessage('حدث خطأ أثناء إرسال الرسالة');
    }
}

// تحميل اللاعبين لقسم بطل الأسبوع
async function loadPlayersForChampion() {
    try {
        const response = await fetch('/api/players');
        players = await response.json();
        displayPlayersForChampion();
    } catch (error) {
        console.error('خطأ في تحميل اللاعبين:', error);
    }
}

// عرض اللاعبين لقسم بطل الأسبوع
function displayPlayersForChampion() {
    const championSelect = document.getElementById('champion-select');
    if (!championSelect) return;
    
    championSelect.innerHTML = '<option value="">اختر اللاعب</option>';
    
    players.forEach(player => {
        const option = document.createElement('option');
        option.value = player.name;
        option.textContent = player.name;
        championSelect.appendChild(option);
    });
}

// تحميل بطل الأسبوع
async function loadChampion() {
    try {
        const response = await fetch('/api/champion');
        const champion = await response.json();
        displayCurrentChampion(champion);
    } catch (error) {
        console.error('خطأ في تحميل بطل الأسبوع:', error);
    }
}

// عرض بطل الأسبوع الحالي
function displayCurrentChampion(champion) {
    const championDisplay = document.getElementById('current-champion-display');
    if (!championDisplay) return;
    
    if (champion && champion.name) {
        championDisplay.innerHTML = `
            <div class="champion-content">
                ${champion.image ? `<img src="/uploads/${champion.image}" alt="${champion.name}" class="champion-image">` : ''}
                <div class="champion-name">${champion.name}</div>
            </div>
        `;
    } else {
        championDisplay.innerHTML = `
            <div class="champion-placeholder">
                <span>لم يتم اختيار بطل الأسبوع بعد</span>
            </div>
        `;
    }
}

// تعيين بطل الأسبوع
async function setChampion() {
    const championSelect = document.getElementById('champion-select');
    const championImage = document.getElementById('champion-image');
    
    const championName = championSelect.value;
    const imageFile = championImage.files[0];
    
    if (!championName) {
        alert('يرجى اختيار اللاعب');
        return;
    }
    
    const formData = new FormData();
    formData.append('name', championName);
    
    if (imageFile) {
        formData.append('image', imageFile);
    }
    
    try {
        const response = await fetch('/api/champion', {
            method: 'POST',
            body: formData,
        });
        
        if (response.ok) {
            championSelect.value = '';
            championImage.value = '';
            loadChampion();
            showSuccessMessage('تم تعيين بطل الأسبوع بنجاح');
        } else {
            throw new Error('فشل في تعيين بطل الأسبوع');
        }
    } catch (error) {
        console.error('خطأ في تعيين بطل الأسبوع:', error);
        showErrorMessage('حدث خطأ أثناء تعيين بطل الأسبوع');
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

// عرض رسائل النجاح والخطأ
function showSuccessMessage(message) {
    showMessage(message, 'success');
}

function showErrorMessage(message) {
    showMessage(message, 'error');
}

function showMessage(message, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message-${type} fade-in`;
    messageDiv.textContent = message;
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.remove();
    }, 5000);
}

// السماح بإرسال الرسائل بالضغط على Enter
document.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        const messageInput = document.getElementById('message-input');
        if (document.activeElement === messageInput) {
            sendMessage();
        }
    }
});

// تحديث البيانات تلقائياً
setInterval(() => {
    const activeSection = document.querySelector('.coach-section.active');
    if (activeSection) {
        const sectionId = activeSection.id;
        if (sectionId === 'players-section') {
            loadPlayers();
        } else if (sectionId === 'posts-section') {
            loadPosts();
        } else if (sectionId === 'champion-section') {
            loadChampion();
        }
    }
}, 30000);