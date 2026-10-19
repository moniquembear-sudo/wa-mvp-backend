# WA MVP Backend

Backend para la organización automática de imágenes descargadas manualmente desde grupos de WhatsApp. El sistema detecta imágenes nuevas, las mueve a carpetas por grupo, les aplica OCR y clasifica los productos por categoría y precio.

**Cero automatización de WhatsApp**: las imágenes se descargan manualmente desde la app. El backend solo observa la carpeta de descargas y procesa lo que llega.

---

## 🎯 ¿Qué hace?

1. **Detecta** imágenes nuevas en `WhatsApp/Media/WhatsApp Images/` (y su subcarpeta `Private/`).
2. **Mueve** cada imagen a `~/backend/media/<grupo>/` según el grupo activo.
3. **Extrae texto** (OCR) de cada imagen con Tesseract.js.
4. **Clasifica** el producto: detecta precio, moneda y categoría.
5. **Expone** un panel web (Pug) para cambiar de grupo, revisar productos y marcarlos como publicados.

---

## 🧱 Stack

| Capa | Tecnología |
|------|-----------|
| Runtime | Node.js (>= 18) |
| Servidor | Express |
| Vistas | Pug |
| Base de datos | lowdb (JSON) |
| Watcher de carpetas | chokidar |
| OCR | tesseract.js |
| Entorno | Termux (Android) |

---

## 📋 Requisitos

- **Termux** instalado en Android.
- **Node.js** en Termux: `pkg install nodejs`
- **Acceso al almacenamiento**: `termux-setup-storage` (concede permisos cuando Android lo solicite).
- **WhatsApp** instalado y con imágenes descargadas al menos una vez.

---

## 🚀 Instalación

```bash
# 1. Clonar el repo
git clone https://github.com/moniquembear-sudo/wa-mvp-backend.git
cd wa-mvp-backend

# 2. Instalar dependencias
npm install

# 3. Verificar acceso a la carpeta de WhatsApp
ls ~/storage/shared/WhatsApp/Media/WhatsApp\ Images/

# 4. Arrancar el servidor
node server.js
