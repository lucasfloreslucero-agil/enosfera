/* Landing de creadores: modal de postulación, formulario y gráfico de comunidades. */
(function () {
  'use strict';

  // Dirección a la que se envían las postulaciones: la URL /exec del script de
  // Google Sheets (ver scripts/google-sheets/Code.gs).
  // Mientras esté vacía, el formulario valida pero no envía nada y muestra el aviso de error.
  // Para revisar los estados sin backend: agregar ?demo=ok o ?demo=error a la URL.
  var ENDPOINT = '';
  var DEMO = new URLSearchParams(location.search).get('demo');

  var PREVENTA = 'Preventa de una línea';
  var OPCIONES = {
    tipo: ['Sommelier', 'Enólogo/a', 'Productor/a', 'Bodega', 'Otro'],
    seguidores: ['Menos de 1.000', '1.000 a 5.000', '5.000 a 20.000', 'Más de 20.000'],
    intereses: ['Catas presenciales', 'Catas online', 'Visitas', 'Cursos o contenido', PREVENTA, 'Solo comunidad']
  };
  var PROVINCIAS = ['Buenos Aires', 'Ciudad de Buenos Aires', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba', 'Corrientes', 'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja', 'Mendoza', 'Misiones', 'Neuquén', 'Río Negro', 'Salta', 'San Juan', 'San Luis', 'Santa Cruz', 'Santa Fe', 'Santiago del Estero', 'Tierra del Fuego', 'Tucumán'];

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- Gráfico de comunidades ---------- */
  var rings = $('#rings');
  if (rings) {
    var ring = function (cx, cy, r, n, off) {
      for (var i = 0; i < n; i++) {
        var a = off + i * 2 * Math.PI / n;
        var pt = document.createElement('span');
        pt.className = 'pt';
        pt.style.left = Math.round(cx + r * Math.cos(a) - 7) + 'px';
        pt.style.top = Math.round(cy + r * Math.sin(a) - 7) + 'px';
        rings.insertBefore(pt, rings.querySelector('.eno-avatar'));
      }
    };
    ring(240, 215, 112, 11, 0.5);
    ring(86, 84, 64, 6, 0.2);
    ring(400, 92, 64, 6, 1.2);
  }

  /* ---------- Formulario ---------- */
  var modal = $('#modal'), form = $('#form'), success = $('#success');
  var nServer = $('#n-server'), nFields = $('#n-fields'), submitBtn = $('#submit');
  var wPreventa = $('#w-preventa');
  var status = 'idle';
  var errors = {};
  var opener = null;

  var select = $('#f-prov');
  PROVINCIAS.forEach(function (p) {
    var o = document.createElement('option');
    o.value = p; o.textContent = p;
    select.appendChild(o);
  });

  $$('[data-chips]').forEach(function (box) {
    var key = box.dataset.chips, multi = box.dataset.mode === 'multi';
    OPCIONES[key].forEach(function (label) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip focusable' + (multi ? ' chip--ico' : '');
      b.setAttribute('aria-pressed', 'false');
      b.dataset.value = label;
      if (multi) {
        var i = document.createElement('i');
        i.className = 'eno-icon icon-plus';
        i.setAttribute('aria-hidden', 'true');
        b.appendChild(i);
      }
      b.appendChild(document.createTextNode(label));
      b.addEventListener('click', function () {
        if (multi) setChip(b, b.getAttribute('aria-pressed') !== 'true');
        else $$('.chip', box).forEach(function (c) { setChip(c, c === b); });
        if (key === 'tipo') clearError('tipo');
        syncPreventa();
      });
      box.appendChild(b);
    });
  });

  function setChip(b, on) {
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
    var i = b.querySelector('i');
    if (i) i.className = 'eno-icon icon-' + (on ? 'check' : 'plus');
  }
  function picked(key) {
    return $$('[data-chips="' + key + '"] .chip[aria-pressed="true"]').map(function (c) { return c.dataset.value; });
  }
  function syncPreventa() {
    wPreventa.hidden = picked('intereses').indexOf(PREVENTA) === -1;
  }

  function values() {
    return {
      nombre: form.nombre.value.trim(),
      email: form.email.value.trim(),
      whatsapp: form.whatsapp.value.trim(),
      provincia: form.provincia.value,
      tipo: picked('tipo')[0] || '',
      red: form.red.value.trim(),
      seguidores: picked('seguidores')[0] || '',
      intereses: picked('intereses'),
      preventa: wPreventa.hidden ? '' : form.preventa.value.trim(),
      hoy: form.hoy.value.trim(),
      acepta: form.acepta.checked,
      sitio: form.sitio.value
    };
  }

  function showError(key, msg) {
    var w = $('[data-field="' + key + '"]', form);
    if (!w) return;
    var out = $('.eno-field__hint, .err', w);
    w.classList.toggle('is-error', !!msg);
    var ctl = $('.ctl', w); if (ctl) ctl.classList.toggle('is-error', !!msg);
    var input = $('input, select', w); if (input) input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    out.textContent = msg || '';
    out.hidden = !msg;
  }
  function clearError(key) {
    if (!errors[key]) return;
    delete errors[key];
    showError(key, '');
    render();
  }

  function render() {
    var ok = status === 'ok';
    form.hidden = ok;
    success.hidden = !ok;
    nServer.hidden = status !== 'error';
    nFields.hidden = status === 'error' || Object.keys(errors).length === 0;
    submitBtn.disabled = status === 'sending';
    submitBtn.textContent = status === 'sending' ? 'Enviando…' : status === 'error' ? 'Probá de nuevo' : 'Enviar postulación';
  }

  ['nombre', 'email', 'whatsapp', 'red'].forEach(function (k) {
    form[k].addEventListener('input', function () { clearError(k); });
  });
  select.addEventListener('change', function () { clearError('provincia'); });
  form.acepta.addEventListener('change', function () { clearError('acepta'); });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (status === 'sending') return;
    var v = values(), err = {};
    if (!v.nombre) err.nombre = 'Decinos cómo te llamás.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) err.email = 'Revisá el email: parece incompleto.';
    if (v.whatsapp.replace(/\D/g, '').length < 8) err.whatsapp = 'Revisá el número: parece incompleto.';
    if (!v.provincia) err.provincia = 'Elegí tu provincia.';
    if (!v.tipo) err.tipo = 'Elegí la opción que más se parezca a lo que hacés.';
    if (!v.red) err.red = 'Pasanos el link para conocer lo que hacés.';
    if (!v.acepta) err.acepta = 'Para postularte tenés que ser mayor de 18 años y aceptar la política de privacidad.';
    ['nombre', 'email', 'whatsapp', 'provincia', 'tipo', 'red', 'acepta'].forEach(function (k) { showError(k, err[k]); });
    errors = err;
    status = 'idle';
    render();
    if (Object.keys(err).length) { modal.scrollTop = 0; return; }

    status = 'sending';
    render();
    send(v).then(function () { status = 'ok'; }, function () { status = 'error'; }).then(function () {
      render();
      modal.scrollTop = 0;
    });
  });

  function send(v) {
    if (DEMO) {
      return new Promise(function (res, rej) { setTimeout(DEMO === 'error' ? rej : res, 900); });
    }
    if (!ENDPOINT) {
      return new Promise(function (_, rej) { setTimeout(rej, 600); });
    }
    // Apps Script no acepta el preflight de CORS: el JSON viaja como text/plain.
    return fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(v)
    }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    }).then(function (res) { if (!res || res.ok !== true) throw new Error('rechazado'); });
  }

  /* ---------- Modal ---------- */
  function resetForm() {
    form.reset();
    $$('.chip', form).forEach(function (c) { setChip(c, false); });
    Object.keys(errors).forEach(function (k) { showError(k, ''); });
    errors = {};
    status = 'idle';
    syncPreventa();
  }

  function open(preventa) {
    if (status === 'ok') resetForm();
    if (preventa) {
      var chip = $('[data-chips="intereses"] .chip[data-value="' + PREVENTA + '"]');
      if (chip) setChip(chip, true);
      syncPreventa();
    }
    render();
    if (!modal.open) modal.showModal();
    modal.scrollTop = 0;
  }

  $$('[data-open]').forEach(function (b) {
    b.addEventListener('click', function () { opener = b; open(b.dataset.open === 'preventa'); });
  });
  $$('[data-close]').forEach(function (b) {
    b.addEventListener('click', function () { modal.close(); });
  });
  modal.addEventListener('click', function (e) { if (e.target === modal) modal.close(); });
  modal.addEventListener('close', function () { if (opener) opener.focus(); });
})();
