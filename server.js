const express = require('express');
const fs = require('fs');
const path = require('path');
const morgan = require('morgan');
const db = require('./src/db/low');
const processor = require('./src/processor');
const { startWatcher } = require('./watcher');

const app = express();
const PORT = 3000;

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/media-files', express.static(path.join(__dirname, 'media')));

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Función para sanitizar el nombre del grupo (igual que en watcher.js)
function sanitizeGroupName(name) {
  return name.trim().replace(/[^a-zA-Z0-9\s_-]/g, '').replace(/\s+/g, '_').substring(0, 60);
}

// ---- PANEL DE GRUPOS ----

app.get('/', async (req, res) => {
  const activeSession = await db.getActiveSession();
  const mediaRoot = path.join(__dirname, 'media');

  let groups = [];
  if (fs.existsSync(mediaRoot)) {
    groups = fs.readdirSync(mediaRoot).filter(f =>
      fs.statSync(path.join(mediaRoot, f)).isDirectory()
    );
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

// ---- PANEL DE PRODUCTOS ----

app.get('/panel/products', async (req, res) => {
  const dbInstance = await db.getDb();
  const groups = [...new Set(dbInstance.data.products.map(p => p.group))];
  const group = req.query.group || groups[0] || null;

  let products = [];
  if (group) {
    products = dbInstance.data.products
      .filter(p => p.group === group)
      .map(p => {
        const mediaDoc = dbInstance.data.media.find(m => m._id === p.media_id);
        return {
          ...p,
          media_filename: mediaDoc ? mediaDoc.filename : null,
          media_group_folder: mediaDoc ? sanitizeGroupName(mediaDoc.group) : null,
        };
      });
  }

  res.render('products', {
    groups,
    selectedGroup: group,
    products,
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
  const active = await db.getActiveSession();
  if (active) await db.closeSession(active._id);
  const session = await db.createSession(group.trim());
  console.log(`[Server] Nueva sesión: ${session.group} (${session._id})`);
  res.json(session);
});

app.post('/api/close-session', async (req, res) => {
  const active = await db.getActiveSession();
  if (active) await db.closeSession(active._id);
  res.json({ ok: true });
});

app.get('/api/media/:group', async (req, res) => {
  const mediaList = await db.getMediaByGroup(req.params.group);
  res.json({ group: req.params.group, count: mediaList.length, files: mediaList });
});

app.get('/api/products', async (req, res) => {
  const products = await db.getAllProducts();
  res.json({ count: products.length, products });
});

app.get('/api/products/:group', async (req, res) => {
  const products = await db.getProductsByGroup(req.params.group);
  res.json({ group: req.params.group, count: products.length, products });
});

app.post('/api/products/:id', async (req, res) => {
  const { price, currency, category, ocr_text, published } = req.body;
  await db.updateProduct(req.params.id, {
    price: price ? parseFloat(price) : null,
    currency: currency || 'USD',
    category: category || 'Sin categoría',
    ocr_text: ocr_text || '',
    published: published === 'true' || published === true,
    updated_at: new Date().toISOString(),
  });
  res.json({ ok: true });
});

app.delete('/api/products/:id', async (req, res) => {
  await db.deleteProduct(req.params.id);
  res.json({ ok: true });
});

// ---- DEBUG ----

app.get('/api/debug/products', async (req, res) => {
  const dbInstance = await db.getDb();
  res.json({
    products_count: dbInstance.data.products.length,
    media_count: dbInstance.data.media.length,
    sample_product: dbInstance.data.products[0] || null,
    sample_media: dbInstance.data.media[0] || null,
    media_paths: dbInstance.data.media.slice(0, 3).map(m => ({
      filename: m.filename,
      group: m.group,
      group_folder: sanitizeGroupName(m.group),
    })),
  });
});

app.get('/api/groups', async (req, res) => {
  try {
    const dbInstance = await db.getDb();
    // Obtenemos grupos únicos de las sesiones o de los productos
    const groups = [...new Set(dbInstance.data.sessions.map(s => s.group))];
    res.json(groups);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---- ARRANQUE ----

app.listen(PORT, async () => {
  console.log(`[Server] http://127.0.0.1:${PORT}`);
  startWatcher();
  await processor.processPending();
});