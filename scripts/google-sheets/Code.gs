/**
 * Recibe las postulaciones de la landing de Enosfera y las guarda como filas
 * en la hoja "Postulaciones" de esta planilla.
 *
 * Instalación: en la planilla, Extensiones → Apps Script, pegar este archivo,
 * Implementar → Nueva implementación → Aplicación web
 * (Ejecutar como: yo · Quién tiene acceso: cualquier persona).
 * La URL que termina en /exec va en ENDPOINT, en assets/js/landing.js.
 */
const HOJA = 'Postulaciones';
const COLUMNAS = ['Fecha', 'Nombre', 'Email', 'WhatsApp', 'Provincia', 'Tipo de creador', 'Red principal',
  'Seguidores', 'Intereses', 'Preventa: producto y fecha', 'Cómo vende hoy'];

function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents);
    // Campo trampa: las personas no lo ven; si viene con algo, es un bot. Se responde ok y no se guarda.
    if (d.sitio) return responder({ ok: true });
    if (!texto(d.nombre) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(d.email || '')) || d.acepta !== true) {
      return responder({ ok: false, error: 'datos incompletos' });
    }

    const candado = LockService.getScriptLock();
    candado.waitLock(10000);
    try {
      const libro = SpreadsheetApp.getActiveSpreadsheet();
      const hoja = libro.getSheetByName(HOJA) || libro.insertSheet(HOJA);
      if (hoja.getLastRow() === 0) {
        hoja.appendRow(COLUMNAS);
        hoja.setFrozenRows(1);
        hoja.getRange(1, 1, 1, COLUMNAS.length).setFontWeight('bold');
      }
      hoja.appendRow([
        new Date(), texto(d.nombre), texto(d.email), texto(d.whatsapp), texto(d.provincia), texto(d.tipo),
        texto(d.red), texto(d.seguidores), texto((d.intereses || []).join(', ')), texto(d.preventa), texto(d.hoy)
      ]);
    } finally {
      candado.releaseLock();
    }
    return responder({ ok: true });
  } catch (err) {
    return responder({ ok: false, error: 'no se pudo guardar' });
  }
}

/** Recorta el texto y evita que la planilla lo interprete como fórmula (por ejemplo "+54..."). */
function texto(v) {
  const s = String(v == null ? '' : v).trim().slice(0, 500);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function responder(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
