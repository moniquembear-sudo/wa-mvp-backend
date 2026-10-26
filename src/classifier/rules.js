// Categorías basadas en el catálogo real
const CATEGORIES = {
  'TV / Smart TV': ['tv', 'televisor', 'television', 'smart tv', 'smarttv', 'pantalla', 'led', 'pulgadas'],
  
  'Ollas y Calderos': [
    'olla', 'arrocera', 'reyna', 'presion', 'presión', 'caldero', 'juego de calderos', 
    'multifuncional', 'multicocina'
  ],

  'Fogones y Cocinas': [
    'fogon', 'fogón', 'infrarrojo', 'gas', 'induccion', 'inducción', 'mecha', 
    'horno', 'gasolina', 'estufa', 'cocina'
  ],

  'Neveras y Refrigeración': [
    'nevera', 'exhibidor', 'vertical', 'refrigerador', 'refri', 'freezer', 'frezzer', 
    'minibar', 'congelador', 'base para refrigerador', 'protector de voltage', 'protector de voltaje'
  ],

  'Aires Acondicionados': [
    'split', 'soporte para split', 'aire acondicionado', 'ac', 'inverter', 'toneladas'
  ],

  'Ventiladores': [
    'ventilador', 'abanico', 'pared', 'pie', 'recargable', 'techo', 'mesa'
  ],

  'Menaje y Organización': [
    'estante', 'estantes', 'baño', 'baños', 'cocina', 'escurridor', 'platero', 
    'juego de taza', 'juego de cubiertos', 'juego de platos', 'vajilla', 'organizador'
  ],

  'Pequeños Electrodomésticos': [
    'sandwishera', 'sandwichera', 'freidora', 'aire', 'vapor', 'cafetera', 
    'expreso', 'batidora', 'licuadora', 'tostadora', 'microondas'
  ],

  'Vehículos Eléctricos': [
    'moto electrica', 'moto eléctrica', 'motorina', 'bicimoto', 'bicicleta', 'bici', 'scooter'
  ],

  'Energía Solar y Respaldo': [
    'estacion de energia', 'estación de energía', 'oupes', 'ecoflow', 'backup', 
    'kit solar', 'bateria', 'batería', 'litio', 'panel solar', 'panel', 'breket', 
    'cable conector', 'cable fotovoltaico', 'turbina', 'dispensador', 'inversor', 
    'controlador', 'voltaje', 'bluetti', 'solar'
  ],

  'Calentadores y Climatización': [
    'presurizador', 'calentador', 'central', 'agua'
  ],

  'Muebles y Hogar': [
    'colchon', 'colchón', 'mesa', 'paca de ropas', 'ropa', 'sabanas', 'sábanas'
  ],

  // Categoría comodín para lo que no encaje
  'Variados / Combos': ['combo', 'variado', 'oferta', 'paquete', 'lote']
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
      // Usamos expresión regular para buscar la palabra completa o parte de ella
      // El \b asegura que no haga match con partes de otras palabras (ej: 'ac' en 'paca')
      const regex = new RegExp(`\\b${kw}\\b`, 'gi');
      const matches = lower.match(regex);
      if (matches) {
        score += matches.length; // Sumamos cuántas veces aparece
      }
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

// Devuelve los tags (palabras clave) de una categoría específica
function getTagsForCategory(category) {
  return CATEGORIES[category] || [];
}

module.exports = { classify, extractPrice, extractCurrency, detectCategory, getTagsForCategory, CATEGORIES };