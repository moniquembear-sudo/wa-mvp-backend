const { JSONFilePreset } = require('lowdb/node');
const path = require('path');
const fs = require('fs');

// Aseguramos que la carpeta data existe
const DATA_DIR = path.join(__dirname, '..', '..', 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'wa_mvp.json');

let dbInstance = null;

async function getDb() {
  if (!dbInstance) {
    dbInstance = await JSONFilePreset(DB_PATH, {
      sessions: [],
      media: [],
      products: []
    });
  }
  return dbInstance;
}

// Genera IDs únicos simples
function genId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 10);
}

// ---- SESIONES ----

async function createSession(group) {
  const db = await getDb();
  const session = {
    _id: genId(),
    group,
    start_time: new Date().toISOString(),
    end_time: null,
    status: 'active'
  };
  await db.update(({ sessions }) => sessions.push(session));
  return session;
}

async function closeSession(sessionId) {
  const db = await getDb();
  await db.update(({ sessions }) => {
    const s = sessions.find(s => s._id === sessionId);
    if (s) {
      s.end_time = new Date().toISOString();
      s.status = 'closed';
    }
  });
}

async function getActiveSession() {
  const db = await getDb();
  return db.data.sessions.find(s => s.status === 'active') || null;
}

async function getAllSessions() {
  const db = await getDb();
  return db.data.sessions;
}

// ---- MEDIA ----

async function insertMedia(mediaDoc) {
  const db = await getDb();
  const doc = { _id: genId(), ...mediaDoc };
  await db.update(({ media }) => media.push(doc));
  return doc;
}

async function findMediaByHash(hash) {
  const db = await getDb();
  return db.data.media.find(m => m.hash === hash) || null;
}

async function getMediaByGroup(group) {
  const db = await getDb();
  return db.data.media.filter(m => m.group === group);
}

async function markMediaProcessed(mediaId, ocrText, price, category) {
  const db = await getDb();
  let mediaDoc = null;

  await db.update(({ media }) => {
    mediaDoc = media.find(m => m._id === mediaId);
    if (mediaDoc) {
      mediaDoc.processed = true;
      mediaDoc.ocr_text = ocrText;
    }
  });

  if (!mediaDoc) return null;

  const product = {
    _id: genId(),
    media_id: mediaId,
    group: mediaDoc.group,
    ocr_text: ocrText,
    price: price || null,
    currency: 'USD',
    category: category || 'Sin categoría',
    published: false,
    created_at: new Date().toISOString()
  };

  await db.update(({ products }) => products.push(product));
  return product;
}

// ---- PRODUCTOS ----

async function getProductsByGroup(group) {
  const db = await getDb();
  return db.data.products.filter(p => p.group === group);
}

async function getAllProducts() {
  const db = await getDb();
  return db.data.products;
}

async function markProductPublished(productId) {
  const db = await getDb();
  await db.update(({ products }) => {
    const p = products.find(p => p._id === productId);
    if (p) {
      p.published = true;
      p.published_at = new Date().toISOString();
    }
  });
}
// ---- PRODUCTOS (NUEVO) ----

async function getProductById(productId) {
  const db = await getDb();
  return db.data.products.find(p => p._id === productId) || null;
}

async function updateProduct(productId, updates) {
  const db = await getDb();
  await db.update(({ products }) => {
    const p = products.find(p => p._id === productId);
    if (p) Object.assign(p, updates);
  });
}

async function deleteProduct(productId) {
  const db = await getDb();
  await db.update(({ products }) => {
    const idx = products.findIndex(p => p._id === productId);
    if (idx !== -1) products.splice(idx, 1);
  });
}

module.exports = {
  getDb,
  createSession,
  closeSession,
  getActiveSession,
  getAllSessions,
  insertMedia,
  findMediaByHash,
  getMediaByGroup,
  markMediaProcessed,
  getProductsByGroup,
  getAllProducts,
  markProductPublished,
  getProductById,
  updateProduct,
  deleteProduct
};