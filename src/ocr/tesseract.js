const Tesseract = require('tesseract.js');
const fs = require('fs');

// Configuración
const WORKER_COUNT = 2; // 2 es seguro para Termux
const LANG = 'eng';
const FAST_LANG_PATH = 'https://tessdata.projectnaptha.com/4.0.0_fast'; // Modelo rápido

let scheduler = null;

async function initScheduler() {
  if (scheduler) return;
  
  console.log('[OCR] Inicializando pool de workers (modo rápido)...');
  scheduler = Tesseract.createScheduler();
  
  for (let i = 0; i < WORKER_COUNT; i++) {
    const worker = await Tesseract.createWorker(LANG, 1, {
      langPath: FAST_LANG_PATH, // Usar modelo rápido
      // No usamos corePath personalizado
    });
    
    // Configurar whitelist para precios
    await worker.setParameters({
     // tessedit_char_whitelist: '0123456789$.,USD CUP',
      tessedit_pageseg_mode: '6', // Bloque uniforme de texto
    });
    
    scheduler.addWorker(worker);
    console.log(`[OCR] Worker ${i + 1} listo.`);
  }
  console.log('[OCR] Pool listo.');
}

async function extractText(imagePath) {
  if (!fs.existsSync(imagePath)) {
    throw new Error(`Imagen no encontrada: ${imagePath}`);
  }

  if (!scheduler) {
    await initScheduler();
  }

  const { data } = await scheduler.addJob('recognize', imagePath);
  
  const text = (data.text || '')
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n');

  return text;
}

async function terminate() {
  if (scheduler) {
    await scheduler.terminate();
    scheduler = null;
    console.log('[OCR] Pool terminado.');
  }
}

module.exports = { extractText, terminate };