// متغيرات عامة
let currentPlayer = null;
let players = [];

// تحميل البيانات عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    // التحقق من وجود بيانات اللاعب في localStorage
    const playerData = localStorage.getItem('playerData');
    if (playerData) {
        // إذا كان اللاعب مسجل دخول، توجيهه لصفحة اللاعب
        window.location.href = '/player';
    }
});

// تسجيل دخول اللاعب
async function loginPlayer() {
    const playerIdInput = document.getElementById('player-id');
    const passwordInput = document.getElementById('player-password');
    const messageDiv = document.getElementById('login-message');
    
    const playerId = playerIdInput.value.trim();
    const password = passwordInput.value.trim();
    
    if (!playerId) {
        showLoginMessage('يرجى إدخال معرف اللاعب', 'error');
        return;
    }
    
    if (!password) {
        showLoginMessage('يرجى إدخال كلمة المرور', 'error');
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
            showLoginMessage('تم تسجيل الدخول بنجاح! جاري التحويل...', 'success');
            
            // حفظ بيانات اللاعب في localStorage
            localStorage.setItem('playerData', JSON.stringify(data.player));
            
            setTimeout(() => {
                window.location.href = '/player';
            }, 1500);
        } else {
            showLoginMessage(data.error || 'خطأ في تسجيل الدخول', 'error');
        }
    } catch (error) {
        console.error('خطأ في تسجيل الدخول:', error);
        showLoginMessage('حدث خطأ أثناء تسجيل الدخول', 'error');
    }
}

// عرض رسالة تسجيل الدخول
function showLoginMessage(message, type) {
    const messageDiv = document.getElementById('login-message');
    messageDiv.textContent = message;
    messageDiv.className = `login-message ${type}`;
    messageDiv.style.display = 'block';
    
    if (type === 'error') {
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 5000);
    }
}

// مسح رسالة تسجيل الدخول عند الكتابة
document.addEventListener('DOMContentLoaded', function() {
    const playerIdInput = document.getElementById('player-id');
    const passwordInput = document.getElementById('player-password');
    const messageDiv = document.getElementById('login-message');
    
    if (playerIdInput && passwordInput && messageDiv) {
        [playerIdInput, passwordInput].forEach(input => {
            input.addEventListener('input', () => {
                messageDiv.style.display = 'none';
            });
        });
    }
});

// السماح بتسجيل الدخول بالضغط على Enter
document.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        const playerIdInput = document.getElementById('player-id');
        const passwordInput = document.getElementById('player-password');
        
        if (document.activeElement === playerIdInput || document.activeElement === passwordInput) {
            loginPlayer();
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

// إضافة تأثيرات الحركة للأزرار
document.addEventListener('click', function(e) {
    if (e.target.tagName === 'BUTTON') {
        // تأثير الضغط
        e.target.style.transform = 'scale(0.95)';
        setTimeout(() => {
            e.target.style.transform = '';
        }, 150);
    }
});

// تحديث الوقت بشكل مستمر
function updateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('ar-EG');
    
    // إضافة الوقت إلى الهيدر إذا لم يكن موجود
    const header = document.querySelector('header');
    let timeElement = document.getElementById('current-time');
    
    if (header && !timeElement) {
        timeElement = document.createElement('div');
        timeElement.id = 'current-time';
        timeElement.style.cssText = `
            position: absolute;
            top: 15px;
            right: 25px;
            background: rgba(0,0,0,0.1);
            padding: 8px 15px;
            border-radius: 20px;
            font-size: 0.9rem;
            color: #34495e;
            font-weight: 500;
        `;
        header.style.position = 'relative';
        header.appendChild(timeElement);
    }
    
    if (timeElement) {
        timeElement.textContent = timeString;
    }
}

// تحديث الوقت كل ثانية
setInterval(updateTime, 1000);
updateTime();