const chokidar = require('chokidar');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const db = require('./src/db/low');

// Rutas de WhatsApp a monitorear
const WHATSAPP_PATHS = [
  path.join(process.env.HOME, 'storage/shared/WhatsApp/Media/WhatsApp Images'),
  path.join(process.env.HOME, 'storage/shared/WhatsApp/Media/WhatsApp Images/Private'),
];

const MEDIA_ROOT = path.join(__dirname, 'media');
const VALID_EXT = ['.jpg', '.jpeg', '.png', '.webp'];

// Cache en memoria para evitar procesar el mismo hash dos veces en la misma sesión
const processedHashes = new Set();

// Sanitiza el nombre del grupo
function sanitizeGroupName(name) {
  return name
    .trim()
    .replace(/[^a-zA-Z0-9\s_-]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 60);
}

// Hash MD5 de un archivo
function hashFile(filePath) {
  const buffer = fs.readFileSync(filePath);
  return crypto.createHash('md5').update(buffer).digest('hex');
}

// Procesa un archivo nuevo
async function processNewFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (!VALID_EXT.includes(ext)) return;

  const filename = path.basename(filePath);

  // Consultamos la sesión activa en la DB
  const session = await db.getActiveSession();
  if (!session) {
    console.log(`[Watcher] Archivo ignorado (sin sesión activa): ${filename}`);
    return;
  }

  // Esperamos para asegurar que el archivo terminó de escribirse
  await new Promise(r => setTimeout(r, 2000));

  if (!fs.existsSync(filePath)) {
    console.log(`[Watcher] Archivo desapareció: ${filename}`);
    return;
  }

  // Hash para detectar duplicados
  let hash;
  try {
    hash = hashFile(filePath);
  } catch (err) {
    console.error(`[Watcher] Error al leer ${filename}:`, err.message);
    return;
  }

  if (processedHashes.has(hash)) {
    console.log(`[Watcher] Duplicado en caché ignorado: ${filename}`);
    return;
  }

  // Verificamos también en la DB por si acaso
  const existing = await db.findMediaByHash(hash);
  if (existing) {
    console.log(`[Watcher] Duplicado en DB ignorado: ${filename}`);
    processedHashes.add(hash);
    return;
  }

  processedHashes.add(hash);

  // Preparamos carpeta destino
  const groupFolder = sanitizeGroupName(session.group);
  const destDir = path.join(MEDIA_ROOT, groupFolder);

  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  const timestamp = Date.now();
  const destFile = path.join(destDir, `${timestamp}_${filename}`);

  // Movemos el archivo
  try {
    fs.renameSync(filePath, destFile);
  } catch (err) {
    try {
      fs.copyFileSync(filePath, destFile);
      fs.unlinkSync(filePath);
    } catch (err2) {
      console.error(`[Watcher] ❌ Error moviendo ${filename}:`, err2.message);
      return;
    }
  }

  // Registramos en la DB
  const stat = fs.statSync(destFile);
  try {
    await db.insertMedia({
      filename: `${timestamp}_${filename}`,
      original_name: filename,
      hash,
      group: session.group,
      session_id: session._id,
      dest_path: destFile,
      size: stat.size,
      timestamp: new Date().toISOString(),
      processed: false,
    });
    console.log(`[Watcher] ✅ ${filename} → ${groupFolder}/ (registrado en DB)`);
  } catch (err) {
    console.error(`[Watcher] Error registrando en DB:`, err.message);
  }
}

// Arranca el watcher
function startWatcher() {
  const existingPaths = WHATSAPP_PATHS.filter(p => {
    if (fs.existsSync(p)) {
      console.log(`[Watcher] ✅ Ruta accesible: ${p}`);
      return true;
    }
    console.log(`[Watcher] ⚠️  Ruta no encontrada: ${p}`);
    return false;
  });

  if (existingPaths.length === 0) {
    console.error('[Watcher] ❌ Ninguna ruta de WhatsApp es accesible');
    return;
  }

  console.log(`[Watcher] Observando ${existingPaths.length} ruta(s)...`);

  const watcher = chokidar.watch(existingPaths, {
    persistent: true,
    ignoreInitial: true,
    depth: 0,
    awaitWriteFinish: {
      stabilityThreshold: 1500,
      pollInterval: 100,
    },
  });

  watcher.on('add', (filePath) => {
    console.log(`[Watcher] Nuevo archivo detectado: ${path.basename(filePath)}`);
    processNewFile(filePath).catch(err =>
      console.error('[Watcher] Error procesando:', err.message)
    );
  });

  watcher.on('error', (err) => {
    console.error('[Watcher] Error:', err.message);
  });

  console.log('[Watcher] Listo. Esperando archivos nuevos...');
}

module.exports = { startWatcher };

if (require.main === module) {
  startWatcher();
}