const path = require('path');
const { extractText } = require('./src/ocr/tesseract');

const imagePath = process.argv[2];

if (!imagePath) {
  console.error('Uso: node test-ocr.js <ruta-imagen>');
  process.exit(1);
}

(async () => {
  console.log('Procesando:', imagePath);
  const start = Date.now();
  const text = await extractText(path.resolve(imagePath));
  const elapsed = ((Date.now() - start) / 1000).toFixed(2);
  console.log(`\n⏱️  Tiempo: ${elapsed}s`);
  console.log('\n📄 Texto extraído:\n');
  console.log(text || '(vacío)');
  process.exit(0);
})();