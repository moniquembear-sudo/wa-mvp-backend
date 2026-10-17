// Categorías conocidas y sus palabras clave
const CATEGORIES = {
  'TV': ['tv', 'televisor', 'pantalla', 'pulgadas', 'smart tv'],
  'Ollas': ['olla', 'ollas', 'presion', 'presión', 'reina', 'cacerola'],
  'Nevera/Frezzer': ['frezzer', 'freezer', 'nevera', 'refrigerador', 'refri', 'congelador'],
  'Combos': ['combo', 'combos', 'paquete', 'set'],
  'Hornos': ['horno', 'microondas', 'estufa', 'cocina'],
  'Arroceras': ['arrocera', 'arroz', 'rice cooker'],
  'Ventiladores': ['ventilador', 'abanico', 'pedestal', 'pared'],
  'Bicicletas': ['bici', 'bicicleta', 'bike'],
  'Audio': ['speaker', 'bocina', 'parlante', 'audio', 'radio'],
  'Celulares': ['celular', 'telefono', 'teléfono', 'smartphone', 'movil', 'móvil'],
};

// Extrae precio del texto. Soporta formatos como:
// $250, 250 USD, 250usd, 250.00, USD 250, 250 CUP
function extractPrice(text) {
  if (!text) return null;

  const patterns = [
    /(?:USD|usd|\$)\s*(\d{1,6}(?:[.,]\d{1,2})?)/,
    /(\d{1,6}(?:[.,]\d{1,2})?)\s*(?:USD|usd|\$)/,
    /(\d{1,6}(?:[.,]\d{1,2})?)\s*(?:CUP|cup|pesos?)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const raw = match[1].replace(',', '.');
      const num = parseFloat(raw);
      if (!isNaN(num) && num > 0) {
        return num;
      }
    }
  }

  return null;
}

// Detecta la moneda
function extractCurrency(text) {
  if (!text) return 'USD';
  if (/\bCUP\b|\bcup\b|pesos?/i.test(text)) return 'CUP';
  return 'USD';
}

// Detecta categoría por palabras clave
function detectCategory(text) {
  if (!text) return 'Sin categoría';

  const lower = text.toLowerCase();
  let bestCategory = 'Sin categoría';
  let bestScore = 0;

  for (const [category, keywords] of Object.entries(CATEGORIES)) {
    let score = 0;
    for (const kw of keywords) {
      if (lower.includes(kw)) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category;
    }
  }

  return bestCategory;
}

// Procesa un texto OCR completo y devuelve los datos clasificados
function classify(ocrText) {
  return {
    ocr_text: ocrText,
    price: extractPrice(ocrText),
    currency: extractCurrency(ocrText),
    category: detectCategory(ocrText),
  };
}

module.exports = { classify, extractPrice, extractCurrency, detectCategory, CATEGORIES };
