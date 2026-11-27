// Hornea las texturas del libro y la mesa y las guarda en assets/. Uso (desde la raíz del repo):
//   node arte/texturas/hornear.js [azul|miel|nogal|carbon]
// Necesita Playwright (npm i playwright) y un navegador. Todo lo genera el código; no hay imágenes externas.
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  p.on('pageerror', e => console.log('ERR', e.message));
  await p.goto('file://' + path.resolve(__dirname, 'generar.html'));
  const t0 = Date.now(); const r = await p.evaluate(pal => window.generar({ paleta: pal }), process.argv[2] || 'azul');
  fs.mkdirSync('assets', { recursive: true }); let total = 0;
  for (const k in r) { const buf = Buffer.from(r[k].split(',')[1], 'base64'); fs.writeFileSync(`assets/${k}.jpg`, buf); total += buf.length; console.log(k + '.jpg', Math.round(buf.length / 1024) + ' KB'); }
  console.log('total', Math.round(total / 1024) + ' KB', '·', ((Date.now() - t0) / 1000).toFixed(1) + ' s'); await b.close();
})();
