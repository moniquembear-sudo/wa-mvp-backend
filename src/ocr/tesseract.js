const Tesseract = require('tesseract.js');
const path = require('path');
const fs = require('fs');

// Idioma: español + inglés (por si los precios vienen en USD)
const LANG = 'spa+eng';

// Worker persistente para no reiniciar Tesseract en cada imagen
let worker = null;

async function getWorker() {
  if (!worker) {
    console.log('[OCR] Inicializando worker de Tesseract...');
    worker = await Tesseract.createWorker(LANG, 1, {
      // Sin logger para no llenar la consola en producción
      // logger: m => console.log('[OCR]', m),
    });
    console.log('[OCR] Worker listo.');
  }
  return worker;
}

// Procesa una imagen y devuelve el texto extraído
async function extractText(imagePath) {
  if (!fs.existsSync(imagePath)) {
    throw new Error(`Imagen no encontrada: ${imagePath}`);
  }

  const w = await getWorker();
  const { data } = await w.recognize(imagePath);

  // Limpiamos el texto: quitamos líneas vacías y espacios extra
  const text = (data.text || '')
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n');

  return text;
}

// Cierra el worker (útil al apagar el server)
async function terminate() {
  if (worker) {
    await worker.terminate();
    worker = null;
    console.log('[OCR] Worker terminado.');
  }
}

module.exports = { extractText, terminate };