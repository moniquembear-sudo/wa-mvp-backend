const express = require('express');
const fs = require('fs');
const path = require('path');
const morgan = require('morgan');
const db = require('./src/db/low');
const { startWatcher } = require('./watcher');

const app = express();
const PORT = 3000;

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// ---- PANEL ----

app.get('/', async (req, res) => {
  const activeSession = await db.getActiveSession();
  const mediaRoot = path.join(__dirname, 'media');

  let groups = [];
  if (fs.existsSync(mediaRoot)) {
    groups = fs.readdirSync(mediaRoot).filter(f => {
      return fs.statSync(path.join(mediaRoot, f)).isDirectory();
    });
  }

  const groupStats = groups.map(g => {
    const groupPath = path.join(mediaRoot, g);
    const files = fs.readdirSync(groupPath).filter(f =>
      ['.jpg', '.jpeg', '.png', '.webp'].includes(path.extname(f).toLowerCase())
    );
    return { name: g, count: files.length };
  });

  res.render('panel', {
    currentGroup: activeSession ? activeSession.group : null,
    sessionId: activeSession ? activeSession._id : null,
    startTime: activeSession ? activeSession.start_time : null,
    groups: groupStats,
  });
});

// ---- API ----

app.get('/api/status', async (req, res) => {
  const session = await db.getActiveSession();
  res.json(session || { current_group: null });
});

app.post('/api/set-group', async (req, res) => {
  const { group } = req.body;
  if (!group || !group.trim()) {
    return res.status(400).json({ error: 'El nombre del grupo es obligatorio' });
  }

  // Cerramos cualquier sesión activa antes de crear una nueva
  const active = await db.getActiveSession();
  if (active) {
    await db.closeSession(active._id);
  }

  const session = await db.createSession(group.trim());
  console.log(`[Server] Nueva sesión: ${session.group} (${session._id})`);
  res.json(session);
});

app.post('/api/close-session', async (req, res) => {
  const active = await db.getActiveSession();
  if (active) {
    await db.closeSession(active._id);
    console.log(`[Server] Sesión cerrada: ${active._id}`);
  }
  res.json({ ok: true });
});

app.get('/api/media/:group', async (req, res) => {
  const mediaList = await db.getMediaByGroup(req.params.group);
  res.json({ group: req.params.group, count: mediaList.length, files: mediaList });
});

app.get('/api/products/:group', async (req, res) => {
  const products = await db.getProductsByGroup(req.params.group);
  res.json({ group: req.params.group, count: products.length, products });
});

// Arranque
app.listen(PORT, '127.0.0.1', () => {
  console.log(`[Server] http://127.0.0.1:${PORT}`);
  startWatcher();
});