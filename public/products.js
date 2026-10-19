document.querySelectorAll('.product-form').forEach(form => {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = form.dataset.id;
    const data = {
      price: form.price.value,
      currency: form.currency.value,
      category: form.category.value,
      published: form.published.checked,
    };
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) alert('Guardado');
    } catch (err) {
      alert('Error: ' + err.message);
    }
  });
});

async function deleteProduct(id) {
  if (!confirm('¿Eliminar este producto?')) return;
  try {
    await fetch(`/api/products/${id}`, { method: 'DELETE' });
    window.location.reload();
  } catch (err) {
    alert('Error: ' + err.message);
  }
}