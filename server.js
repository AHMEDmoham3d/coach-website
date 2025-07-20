const express = require('express');
const multer = require('multer');
const cors = require('cors');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// إنشاء مجلدات التخزين
const ensureDirectoryExists = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

ensureDirectoryExists('uploads');
ensureDirectoryExists('data');

// إعداد multer لرفع الملفات
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// إنشاء WebSocket server
const wss = new WebSocket.Server({ port: 8080 });

// ملفات JSON للتخزين
const playersFile = 'data/players.json';
const messagesFile = 'data/messages.json';
const postsFile = 'data/posts.json';
const championFile = 'data/champion.json';

// إنشاء الملفات الأساسية
const initializeFiles = () => {
  const initialPlayers = [
    { id: 'login_ahmed', name: 'لوجين احمد', password: 'login2024', points: 0, absences: 0, rank: 1 },
    { id: 'adam_hany', name: 'ادم هانى', password: 'adam123', points: 0, absences: 0, rank: 2 },
    { id: 'ahmed_atia', name: 'احمد عطيه', password: 'ahmed456', points: 0, absences: 0, rank: 3 },
    { id: 'retag_ahmed', name: 'ريتاج احمد', password: 'retag789', points: 0, absences: 0, rank: 4 },
    { id: 'omar_adel', name: 'عمر عادل', password: 'omar2024', points: 0, absences: 0, rank: 5 },
    { id: 'retag_mahmoud', name: 'ريتاج محمود', password: 'retag321', points: 0, absences: 0, rank: 6 },
    { id: 'judy_mahmoud', name: 'جودى محمود', password: 'judy654', points: 0, absences: 0, rank: 7 },
    { id: 'malak_ayman', name: 'ملك ايمن', password: 'malak987', points: 0, absences: 0, rank: 8 },
    { id: 'remas_tarek', name: 'ريماس طارق', password: 'remas147', points: 0, absences: 0, rank: 9 },
    { id: 'malak_mahmoud_sayed', name: 'ملك محمود السيد', password: 'malak258', points: 0, absences: 0, rank: 10 },
    { id: 'iten_fathy', name: 'ايتن فتحى', password: 'iten369', points: 0, absences: 0, rank: 11 },
    { id: 'mohamed_abdeltam', name: 'محمد عبد التام', password: 'mohamed741', points: 0, absences: 0, rank: 12 },
    { id: 'farah_adel', name: 'فرح عادل', password: 'farah852', points: 0, absences: 0, rank: 13 },
    { id: 'nada_anwar', name: 'ندى انور', password: 'nada963', points: 0, absences: 0, rank: 14 },
    { id: 'noreen_mahmoud', name: 'نورين محمود', password: 'noreen159', points: 0, absences: 0, rank: 15 },
    { id: 'sama_waleed', name: 'سما وليد', password: 'sama753', points: 0, absences: 0, rank: 16 },
    { id: 'rodina_islam', name: 'رودينا اسلام', password: 'rodina486', points: 0, absences: 0, rank: 17 },
    { id: 'nelly_mahmoud', name: 'نيللى محمود', password: 'nelly357', points: 0, absences: 0, rank: 18 },
    { id: 'taha_islam', name: 'طه اسلام طه', password: 'taha951', points: 0, absences: 0, rank: 19 },
    { id: 'adel_sabry', name: 'عادل صبرى', password: 'adel624', points: 0, absences: 0, rank: 20 },
    { id: 'mohamed_saeed', name: 'محمد سعيد', password: 'mohamed837', points: 0, absences: 0, rank: 21 }
  ];

  if (!fs.existsSync(playersFile)) {
    fs.writeFileSync(playersFile, JSON.stringify(initialPlayers, null, 2));
  }
  
  if (!fs.existsSync(messagesFile)) {
    fs.writeFileSync(messagesFile, JSON.stringify({}, null, 2));
  }
  
  if (!fs.existsSync(postsFile)) {
    fs.writeFileSync(postsFile, JSON.stringify([], null, 2));
  }
  
  if (!fs.existsSync(championFile)) {
    fs.writeFileSync(championFile, JSON.stringify({ name: '', image: '' }, null, 2));
  }
};

initializeFiles();

// دوال مساعدة
const readJsonFile = (filePath) => {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading file:', error);
    return null;
  }
};

const writeJsonFile = (filePath, data) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing file:', error);
    return false;
  }
};

const updateRankings = () => {
  const players = readJsonFile(playersFile);
  if (!players) return;

  // ترتيب اللاعبين حسب النقاط
  players.sort((a, b) => b.points - a.points);
  
  // تحديث الرانك
  players.forEach((player, index) => {
    player.rank = index + 1;
  });

  writeJsonFile(playersFile, players);
};

// Routes

// الصفحة الرئيسية
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// صفحة المدرب
app.get('/coach', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'coach.html'));
});

// صفحة اللاعب
app.get('/player', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'player.html'));
});

// التحقق من تسجيل دخول اللاعب
app.post('/api/player/login', (req, res) => {
  const { playerId, password } = req.body;
  const players = readJsonFile(playersFile);
  
  if (!players) {
    return res.status(500).json({ error: 'خطأ في قراءة البيانات' });
  }

  const player = players.find(p => p.id === playerId && p.password === password);
  
  if (player) {
    // إرجاع بيانات اللاعب بدون كلمة المرور
    const { password: _, ...playerData } = player;
    res.json({ success: true, player: playerData });
  } else {
    res.status(401).json({ error: 'معرف اللاعب أو كلمة المرور غير صحيحة' });
  }
});

// API للاعبين
app.get('/api/players', (req, res) => {
  const players = readJsonFile(playersFile);
  res.json(players || []);
});

app.get('/api/player/:id', (req, res) => {
  const players = readJsonFile(playersFile);
  const player = players.find(p => p.id === req.params.id);
  
  if (player) {
    res.json(player);
  } else {
    res.status(404).json({ error: 'اللاعب غير موجود' });
  }
});

// إضافة لاعب جديد
app.post('/api/players', (req, res) => {
  const { name, password } = req.body;
  const players = readJsonFile(playersFile);
  
  if (!players) {
    return res.status(500).json({ error: 'خطأ في قراءة البيانات' });
  }

  // التحقق من عدم تكرار الاسم
  const existingPlayer = players.find(p => p.name === name);
  if (existingPlayer) {
    return res.status(400).json({ error: 'اسم اللاعب موجود بالفعل' });
  }

  // إنشاء معرف فريد بناءً على الاسم
  const generateUniqueId = (name) => {
    const baseId = name.replace(/\s+/g, '_').toLowerCase();
    let uniqueId = baseId;
    let counter = 1;
    
    while (players.find(p => p.id === uniqueId)) {
      uniqueId = `${baseId}_${counter}`;
      counter++;
    }
    
    return uniqueId;
  };

  const newPlayer = {
    id: generateUniqueId(name),
    name,
    password: password || '123456',
    points: 0,
    absences: 0,
    rank: players.length + 1
  };

  players.push(newPlayer);
  writeJsonFile(playersFile, players);
  updateRankings();
  
  res.json(newPlayer);
});

// حذف لاعب
app.delete('/api/players/:id', (req, res) => {
  const playerId = req.params.id;
  const players = readJsonFile(playersFile);
  
  if (!players) {
    return res.status(500).json({ error: 'خطأ في قراءة البيانات' });
  }

  const playerIndex = players.findIndex(p => p.id === playerId);
  
  if (playerIndex === -1) {
    return res.status(404).json({ error: 'اللاعب غير موجود' });
  }

  players.splice(playerIndex, 1);
  writeJsonFile(playersFile, players);
  updateRankings();
  
  res.json({ success: true });
});

// تحديث نقاط اللاعب
app.put('/api/players/:id/points', (req, res) => {
  const playerId = req.params.id;
  const { action } = req.body; // 'add' أو 'subtract'
  const players = readJsonFile(playersFile);
  
  if (!players) {
    return res.status(500).json({ error: 'خطأ في قراءة البيانات' });
  }

  const player = players.find(p => p.id === playerId);
  
  if (!player) {
    return res.status(404).json({ error: 'اللاعب غير موجود' });
  }

  if (action === 'add') {
    player.points += 1;
  } else if (action === 'subtract') {
    player.points = Math.max(0, player.points - 1);
  }

  writeJsonFile(playersFile, players);
  updateRankings();
  
  res.json(player);
});

// تحديث غيابات اللاعب
app.put('/api/players/:id/absences', (req, res) => {
  const playerId = req.params.id;
  const { action } = req.body;
  const players = readJsonFile(playersFile);
  
  if (!players) {
    return res.status(500).json({ error: 'خطأ في قراءة البيانات' });
  }

  const player = players.find(p => p.id === playerId);
  
  if (!player) {
    return res.status(404).json({ error: 'اللاعب غير موجود' });
  }

  if (action === 'add') {
    player.absences += 1;
    player.points = Math.max(0, player.points - 1);
  } else if (action === 'subtract') {
    player.absences = Math.max(0, player.absences - 1);
    player.points += 1;
  }

  writeJsonFile(playersFile, players);
  updateRankings();
  
  res.json(player);
});

// API للرسائل
app.get('/api/messages/:playerId', (req, res) => {
  const playerId = req.params.playerId;
  const messages = readJsonFile(messagesFile);
  
  if (!messages) {
    return res.status(500).json({ error: 'خطأ في قراءة الرسائل' });
  }

  res.json(messages[playerId] || []);
});

app.post('/api/messages', (req, res) => {
  const { playerId, message, sender } = req.body;
  const messages = readJsonFile(messagesFile);
  
  if (!messages) {
    return res.status(500).json({ error: 'خطأ في قراءة الرسائل' });
  }

  if (!messages[playerId]) {
    messages[playerId] = [];
  }

  const newMessage = {
    id: Date.now(),
    message,
    sender,
    timestamp: new Date().toISOString()
  };

  messages[playerId].push(newMessage);
  writeJsonFile(messagesFile, messages);
  
  res.json(newMessage);
});

// API للمنشورات
app.get('/api/posts', (req, res) => {
  const posts = readJsonFile(postsFile);
  res.json(posts || []);
});

app.post('/api/posts', upload.single('media'), (req, res) => {
  const { content, type } = req.body;
  const posts = readJsonFile(postsFile);
  
  if (!posts) {
    return res.status(500).json({ error: 'خطأ في قراءة المنشورات' });
  }

  const newPost = {
    id: Date.now(),
    content,
    type,
    media: req.file ? req.file.filename : null,
    timestamp: new Date().toISOString()
  };

  posts.unshift(newPost);
  writeJsonFile(postsFile, posts);
  
  res.json(newPost);
});

// API بطل الأسبوع
app.get('/api/champion', (req, res) => {
  const champion = readJsonFile(championFile);
  res.json(champion || { name: '', image: '' });
});

app.post('/api/champion', upload.single('image'), (req, res) => {
  const { name } = req.body;
  const champion = {
    name,
    image: req.file ? req.file.filename : ''
  };
  
  writeJsonFile(championFile, champion);
  res.json(champion);
});

// WebSocket للرسائل المباشرة
wss.on('connection', (ws) => {
  console.log('عميل جديد متصل');
  
  ws.on('message', (message) => {
    const data = JSON.parse(message);
    
    // إرسال الرسالة لجميع العملاء المتصلين
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  });
  
  ws.on('close', () => {
    console.log('عميل منقطع');
  });
});

app.listen(PORT, () => {
  console.log(`الخادم يعمل على http://localhost:${PORT}`);
  console.log(`WebSocket يعمل على ws://localhost:8080`);
});