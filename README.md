# Enosfera

Repositorio de la plataforma Enosfera. Por ahora contiene la landing de prelanzamiento para creadores y productores del vino.

- **Sitio publicado:** https://lucasfloreslucero-agil.github.io/enosfera/
- **Publicación:** GitHub Pages desde la rama `main` (raíz). Cada push a `main` actualiza el sitio.
- **Estado:** en revisión. La página lleva `noindex` para que los buscadores no la listen todavía.

## Estructura

- `index.html` — la landing completa (sitio estático, sin build).
- `assets/css/tokens.css` — tokens y componentes del sistema de diseño de Enosfera (copiados del handoff de diseño; no editar a mano).
- `assets/css/landing.css` — estilos propios de la landing.
- `assets/js/landing.js` — modal de postulación, validación del formulario y gráfico de comunidades.
- `scripts/google-sheets/Code.gs` — script de Google Apps Script que guarda cada postulación como fila en una planilla. Se pega en la planilla (Extensiones → Apps Script) y se implementa como aplicación web; su URL `/exec` va en `ENDPOINT`.
- `scripts/dev-server.js` — servidor local para previsualizar: `node scripts/dev-server.js` → http://localhost:4322

## Pendientes antes de difundir

- **Formulario sin backend.** `ENDPOINT` en `assets/js/landing.js` está vacío: el formulario valida pero no envía nada y muestra el aviso de error. Para ver los estados sin backend, abrir la página con `?demo=ok` o `?demo=error`.
- **Fotos.** Las seis fotos son placeholders con la descripción de la toma esperada.
- **Contacto y links provisorios.** `creadores@enosfera.example`, redes, Términos, Privacidad y Botón de arrepentimiento.
- **Cargo por servicio.** El ejemplo de $ 50.000 → $ 55.000 es ilustrativo y no está confirmado.
- **Sacar `noindex`** de `index.html` cuando la landing esté lista.

## Reglas de contenido

Voseo, frases cortas, mayúscula solo inicial, sin emoji. Se dice "seguidores", nunca "suscriptores". Las preventas son compras anticipadas con recompensa: nada de lenguaje de inversión. Precios con el formato "$ 38.000". La leyenda "Beber con moderación. Prohibida su venta a menores de 18 años." y el link "Botón de arrepentimiento" son obligatorios.
