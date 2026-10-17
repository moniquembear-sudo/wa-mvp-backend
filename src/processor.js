const path = require('path');
const fs = require('fs');
const db = require('./db/low');
const { extractText } = require('./ocr/tesseract');
const { classify } = require('./classifier/rules');

// Cola simple en memoria para no procesar todo de golpe
const queue = [];
let processing = false;

// Añade una imagen a la cola de procesamiento
function enqueue(mediaDoc) {
  queue.push(mediaDoc);
  processQueue();
}

// Procesa la cola secuencialmente
async function processQueue() {
  if (processing) return;
  processing = true;

  while (queue.length > 0) {
    const mediaDoc = queue.shift();
    try {
      await processMedia(mediaDoc);
    } catch (err) {
      console.error(`[Processor] Error procesando ${mediaDoc.filename}:`, err.message);
    }
  }

  processing = false;
}

// Procesa una sola imagen
async function processMedia(mediaDoc) {
  const imagePath = mediaDoc.dest_path;

  if (!fs.existsSync(imagePath)) {
    console.log(`[Processor] Archivo no existe: ${mediaDoc.filename}`);
    return;
  }

  console.log(`[Processor] OCR: ${mediaDoc.filename}`);
  const ocrText = await extractText(imagePath);

  const classified = classify(ocrText);
  console.log(`[Processor] → Categoría: ${classified.category} | Precio: ${classified.price || 'N/A'} ${classified.currency}`);

  await db.markMediaProcessed(
    mediaDoc._id,
    classified.ocr_text,
    classified.price,
    classified.category
  );
}

// Al arrancar, procesa las imágenes pendientes (processed: false)
async function processPending() {
  const allMedia = await db.getMediaByGroup(''); // hack: no filtra
  // Mejor: obtenemos todos los media y filtramos processed: false
  const dbInstance = await db.getDb();
  const pending = dbInstance.data.media.filter(m => !m.processed);

  if (pending.length === 0) {
    console.log('[Processor] No hay imágenes pendientes.');
    return;
  }

  console.log(`[Processor] ${pending.length} imagen(es) pendiente(s) al arrancar.`);
  for (const m of pending) {
    enqueue(m);
  }
}

module.exports = { enqueue, processPending };