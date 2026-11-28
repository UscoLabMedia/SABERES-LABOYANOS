// Recetas de la fabricación: lógica pura (sin DOM ni Three.js). Navegador: window.Recetas; Node: module.exports.
(function (g) {
  const EST = { barro:'barro', amasar:'amasado', torno:'torno', modelar:'mesa', carroceria:'mesa', carga:'mesa', pegar:'mesa', secar:'secadero', hornear:'horno', pintar:'pintura', entregar:'mostrador' };
  const COMUN = ['barro', 'amasar'];
  const R = {
    datos: null,
    usar(d) { R.datos = d; },
    estacion: p => EST[p],
    paso(pz) { const L = pz.fig ? (R.datos.figuras[pz.fig] || {}).pasos : COMUN; return (L && L[pz.i]) || null; },
    acepta: (k, pz) => R.estacion(R.paso(pz)) === k,
    avanza: pz => Object.assign({}, pz, { i: pz.i + 1 }),
    figurasPara(k, pedidos) { const o = []; for (const { fig } of pedidos) if (!o.includes(fig) && R.estacion(R.datos.figuras[fig].pasos[2]) === k) o.push(fig); return o; },
    paciencia: n => n <= 1 ? 120 : n === 2 ? 90 : 70,
    maxClientes: n => n <= 1 ? 2 : 3,
    coloresAzar(rnd = Math.random) { const l = R.datos.colores.slice(), a = l.splice(Math.floor(rnd() * l.length), 1)[0]; return [a, l[Math.floor(rnd() * l.length)]]; }
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = R;
  g.Recetas = R;
})(typeof window !== 'undefined' ? window : globalThis);
