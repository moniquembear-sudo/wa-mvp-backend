let allProducts = []; // Almacén local de productos
let currentSort = { field: 'date', asc: false }; // Orden inicial: fecha descendente

// 1. Cargar datos vía AJAX
let lastTotalProducts = 0;
let pollingInterval = null;

// 1. Cargar datos vía AJAX
async function loadProducts(silent = false) {
  try {
    const res = await fetch('/api/products');
    allProducts = await res.json();
    
    if (!silent) {
      updateIndicators();
    }
    
    // Si el usuario está escribiendo en el buscador, aplicamos el filtro,
    // si no, mostramos todo.
    const query = document.getElementById('filterInput').value.trim();
    if (query) {
      applyFilter();
    } else {
      renderTable(allProducts);
    }

  } catch (e) {
    console.error('Error cargando productos', e);
  }
}

// 2. Polling para actualizar la tabla y el loader
async function checkOcrStatus() {
  try {
    const res = await fetch('/api/ocr/status');
    const data = await res.json();
    
    const loader = document.getElementById('ocrLoader');
    
    // Actualizar el loader
    if (data.pending > 0) {
      loader.style.display = 'flex';
      loader.querySelector('span').textContent = `El OCR está analizando ${data.pending} imágenes en segundo plano...`;
    } else {
      loader.style.display = 'none';
    }

    // Si el número total de productos cambió (alguien terminó de procesarse)
    // o si había pendientes y ahora no, recargamos la tabla silenciosamente.
    if (data.totalProducts !== lastTotalProducts) {
      lastTotalProducts = data.totalProducts;
      await loadProducts(true); // true = no actualizar los indicadores visuales (puntos rojos) de forma brusca
    }

  } catch (e) {
    console.error('Error checking OCR status', e);
  }
}

// 3. Iniciar el bucle de polling
function startPolling() {
  // Consultar inmediatamente al cargar
  checkOcrStatus();
  
  // Luego consultar cada 3 segundos
  if (pollingInterval) clearInterval(pollingInterval);
  pollingInterval = setInterval(checkOcrStatus, 3000);
}

// 2. Renderizar la tabla
function renderTable(products) {
  const tbody = document.getElementById('productBody');
  tbody.innerHTML = '';

  products.forEach(p => {
    const tr = document.createElement('tr');
    tr.className = 'product-row';
    tr.dataset.id = p._id;

    // Precio formateado
    const priceHtml = p.price ? `${p.price} ${p.currency || 'USD'}` : '<span class="sin-precio">-</span>';
    
    // Fecha formateada
    const dateHtml = p.date ? new Date(p.date).toLocaleDateString() : '-';

    // Imagen
    const imgHtml = (p.media_filename && p.media_group_folder) 
      ? `<img src="/media-files/${p.media_group_folder}/${p.media_filename}" class="thumbnail" onclick="openImage(this.src)">`
      : `<div class="no-img-small">Sin img</div>`;

    tr.innerHTML = `
      <td><input type="checkbox" class="product-checkbox" value="${p._id}" onchange="updateCount()"></td>
      <td>${imgHtml}</td>
      <td class="group-cell">${p.group || '-'}</td>
      <td class="category-cell">${p.category || 'Sin categoría'}</td>
      <td class="price-cell">${priceHtml}</td>
      <td class="date-cell">${dateHtml}</td>
      <td class="actions-cell">
        <button class="icon-btn" onclick="editProduct('${p._id}')">✏️</button>
        <button class="icon-btn publish-btn" onclick="compartirProducto('${p._id}')">🚀</button>
        <button class="icon-btn delete-btn" onclick="eliminarProducto('${p._id}')">🗑️</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
  updateCount();
}

// 3. Ordenación
function sortTable(field) {
  if (currentSort.field === field) {
    currentSort.asc = !currentSort.asc;
  } else {
    currentSort.field = field;
    currentSort.asc = true;
  }
  
  const sorted = [...allProducts].sort((a, b) => {
    let valA = a[field];
    let valB = b[field];
    
    if (field === 'price') {
      valA = valA || 0;
      valB = valB || 0;
    }
    
    if (valA < valB) return currentSort.asc ? -1 : 1;
    if (valA > valB) return currentSort.asc ? 1 : -1;
    return 0;
  });

  renderTable(sorted);
}


// Filtro global en tiempo real
// Filtro global en tiempo real (por columnas y por tags)
function applyFilter() {
  const query = document.getElementById('filterInput').value.trim().toLowerCase();
  
  if (!query) {
    renderTable(allProducts);
    return;
  }

  const filtered = allProducts.filter(p => {
    const group = (p.group || '').toLowerCase();
    const category = (p.category || '').toLowerCase();
    const price = (p.price || '').toString();
    const date = p.date ? new Date(p.date).toLocaleDateString().toLowerCase() : '';
    const currency = (p.currency || '').toLowerCase();
    
    // Convertimos el array de tags en un string para buscar
    const tagsString = (p.tags || []).join(' ').toLowerCase();

    // Buscamos en todas las propiedades y en los tags
    return group.includes(query) || 
           category.includes(query) || 
           price.includes(query) || 
           date.includes(query) ||
           currency.includes(query) ||
           tagsString.includes(query);
  });

  renderTable(filtered);
}

// 5. Indicadores visuales (Puntos rojos)
function updateIndicators() {
  const missingCategory = allProducts.some(p => !p.category || p.category === 'Sin categoría');
  const missingPrice = allProducts.some(p => p.price === null || p.price === undefined);

  document.getElementById('ind-category').style.display = missingCategory ? 'inline-block' : 'none';
  document.getElementById('ind-price').style.display = missingPrice ? 'inline-block' : 'none';
}


// Compartir productos usando Web Share API
async function shareProducts(ids) {
  // 1. Verificar soporte del navegador
  if (!navigator.share || !navigator.canShare) {
    alert('Tu navegador no soporta la función de compartir archivos.');
    return;
  }

  try {
    // 2. Obtener los datos de los productos para saber qué imágenes descargar
    const res = await fetch('/api/products');
    const all = await res.json();
    const selected = all.filter(p => ids.includes(p._id));

    // 3. Descargar las imágenes y convertirlas en archivos
    const files = [];
    for (const p of selected) {
      if (!p.media_filename) continue;
      
      // Usamos el endpoint de descarga que acabamos de crear
      const fileRes = await fetch(`/api/media/download/${p.media_id}`);
      const blob = await fileRes.blob();
      
      // Creamos el archivo con un nombre descriptivo
      const fileName = `${p.category || 'producto'}_${p._id}.jpg`;
      const file = new File([blob], fileName, { type: blob.type });
      files.push(file);
    }

    if (files.length === 0) {
      alert('Los productos seleccionados no tienen imágenes para compartir.');
      return;
    }

    // 4. Verificar si se pueden compartir estos archivos específicos
    const shareData = {
      files: files,
      title: 'Productos',
      text: `Compartiendo ${files.length} producto(s)`
    };

    if (!navigator.canShare(shareData)) {
      alert('El navegador no permite compartir este tipo de archivos.');
      return;
    }

    // 5. Lanzar el menú de compartir del sistema
    await navigator.share(shareData);
    console.log('Compartido con éxito');

  } catch (error) {
    // Si el usuario cancela, no mostramos error
    if (error.name !== 'AbortError') {
      console.error('Error al compartir:', error);
      alert('No se pudo compartir. Intenta de nuevo.');
    }
  }
}

// Compartir un solo producto
function compartirProducto(id) {
  shareProducts([id]);
}

// Compartir los seleccionados
function compartirSeleccionados() {
  const checkboxes = document.querySelectorAll('.product-checkbox:checked');
  if (checkboxes.length === 0) {
    alert('Selecciona al menos un producto');
    return;
  }
  const ids = Array.from(checkboxes).map(cb => cb.value);
  shareProducts(ids);
}

// --- Funciones de utilidad existentes ---

function toggleAll(source) {
  document.querySelectorAll('.product-checkbox').forEach(cb => cb.checked = source.checked);
  updateCount();
}

function updateCount() {
  const checked = document.querySelectorAll('.product-checkbox:checked').length;
  document.getElementById('selection-count').textContent = `${checked} seleccionados`;
}

function openImage(src) {
  document.getElementById('imageModal').style.display = "block";
  document.getElementById('modalImage').src = src;
}

document.querySelector('.close').onclick = function() {
  document.getElementById('imageModal').style.display = "none";
};

// --- EDICIÓN ---
async function editProduct(id) {
  // Buscamos el producto en el array global, no en el DOM
  const product = allProducts.find(p => p._id === id);
  if (!product) return;

  const newCategory = prompt('Nueva categoría:', product.category || '');
  if (newCategory === null) return; // Canceló

  const newPriceStr = prompt('Nuevo precio:', product.price || '');
  if (newPriceStr === null) return;

  const newPrice = newPriceStr.trim() === '' ? null : parseFloat(newPriceStr);

  try {
    const res = await fetch(`/api/products/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: newCategory, price: newPrice })
    });
    
    if (res.ok) {
      // Actualizamos el objeto local y re-renderizamos
      product.category = newCategory;
      product.price = newPrice;
      
      // Si cambió la categoría, actualizamos los tags para el filtro
      const tagRes = await fetch('/api/products'); 
      // (La forma más rápida es recargar los productos desde el backend para tener los tags actualizados)
      await loadProducts(true); 
    }
  } catch (e) {
    alert('Error al guardar');
  }
}

// --- PUBLICAR ---
async function publishProduct(id) {
  if (!confirm('¿Marcar como publicado?')) return;
  try {
    const res = await fetch(`/api/products/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ published: true })
    });
    if (res.ok) {
      const product = allProducts.find(p => p._id === id);
      if (product) product.published = true;
      alert('Producto marcado como publicado');
    }
  } catch (e) {
    alert('Error al publicar');
  }
}

// --- ELIMINAR UNO ---
async function eliminarProducto(id) {
  if (!confirm('¿Eliminar este producto de la base de datos?')) return;
  try {
    const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
    if (res.ok) {
      // Eliminamos del array global y recargamos la tabla
      allProducts = allProducts.filter(p => p._id !== id);
      renderTable(allProducts);
      updateIndicators();
    }
  } catch (e) {
    alert('Error al eliminar');
  }
}

// --- ELIMINAR SELECCIONADOS ---
async function eliminarSeleccionados() {
  const checkboxes = document.querySelectorAll('.product-checkbox:checked');
  if (checkboxes.length === 0) {
    alert('Selecciona al menos un producto');
    return;
  }

  const ids = Array.from(checkboxes).map(cb => cb.value);
  if (!confirm(`¿Eliminar ${ids.length} productos seleccionados?`)) return;

  for (const id of ids) {
    await fetch(`/api/products/${id}`, { method: 'DELETE' });
  }
  
  // Recargamos toda la tabla desde el backend para asegurar consistencia
  await loadProducts(true);
}

// --- PUBLICAR SELECCIONADOS ---
async function marcarSeleccionados() {
  const checkboxes = document.querySelectorAll('.product-checkbox:checked');
  if (checkboxes.length === 0) {
    alert('Selecciona al menos un producto');
    return;
  }

  const ids = Array.from(checkboxes).map(cb => cb.value);
  if (!confirm(`¿Marcar ${ids.length} productos como publicados?`)) return;

  for (const id of ids) {
    await fetch(`/api/products/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ published: true })
    });
  }
  alert('Productos publicados');
  await loadProducts(true);
}

// Iniciar todo cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  loadProducts();
  startPolling();
});