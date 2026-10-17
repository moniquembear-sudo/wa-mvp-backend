// Maneja el formulario de cambio de grupo
document.getElementById('groupForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const input = document.getElementById('groupInput');
  const group = input.value.trim();
  if (!group) return;

  try {
    const res = await fetch('/api/set-group', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ group }),
    });
    if (res.ok) {
      window.location.reload();
    } else {
      alert('Error al activar el grupo');
    }
  } catch (err) {
    alert('Error de conexión: ' + err.message);
  }
});

// Botones de grupos existentes
document.querySelectorAll('.group-btn').forEach(btn => {
  btn.addEventListener('click', async () => {
    const group = btn.dataset.group.replace(/_/g, ' ');
    if (!confirm(`¿Activar grupo "${group}"?`)) return;

    try {
      const res = await fetch('/api/set-group', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ group }),
      });
      if (res.ok) {
        window.location.reload();
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
  });
});

// Cerrar sesión
async function closeSession(e) {
  e.preventDefault();
  try {
    await fetch('/api/close-session', { method: 'POST' });
    window.location.reload();
  } catch (err) {
    alert('Error: ' + err.message);
  }
}
window.closeSession = closeSession;