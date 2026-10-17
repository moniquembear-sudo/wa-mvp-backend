const { JSONFilePreset } = require('lowdb/node');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', '..', 'data', 'wa_mvp.json');

// Inicializar la base de datos con valores por defecto
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

// ---- SESIONES ----
async function createSession(group) {
  const db = await getDb();
  const session = {
    _id: Date.now().toString(36) + Math.random().toString(36).substr(2),
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

// ---- MEDIA ----
async function insertMedia(mediaDoc) {
  const db = await getDb();
  const doc = {
    _id: Date.now().toString(36) + Math.random().toString(36).substr(2),
    ...mediaDoc
  };
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

// ---- PRODUCTOS ----
async function getProductsByGroup(group) {
  const db = await getDb();
  return db.data.products.filter(p => p.group === group);
}

module.exports = {
  createSession,
  closeSession,
  getActiveSession,
  insertMedia,
  findMediaByHash,
  getMediaByGroup,
  getProductsByGroup,
  // ...otros que necesites
};