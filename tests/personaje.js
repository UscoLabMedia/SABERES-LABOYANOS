// Aviso 3: el personaje se elige al crear la partida (dos retratos, sin etiqueta de género) y se cambia en Mi progreso.
const T=require('./lib');
const PROHIBIDAS=/muñec[oa]|hombre|mujer|niñ[oa]/i;
const gorra=fem=>`(()=>{ let n=0; Muneco.jugador(0,${fem}).traverse(o=>{ if (o.geometry&&o.geometry.type==='SphereGeometry'&&Math.abs(o.geometry.parameters.radius-.19)<1e-6) n++; }); return n; })()`;
(async()=>{
 { // 1. selector de retratos y personaje sin gorra
  const {p}=await T.abrir('finca.html#prueba'); await p.waitForFunction(()=>window.Muneco&&window.__f,null,{timeout:30000});
  T.ok(await p.evaluate(gorra(true))===0,'ella empieza sin gorra'); T.ok(await p.evaluate(gorra(false))===1,'él sigue con gorra');
  const r=await p.evaluate(()=>{ if (!Muneco.selector) return null; const el=document.createElement('div'); document.body.appendChild(el); let v=null; const s=Muneco.selector(el,null,x=>v=x);
    const bs=[...el.querySelectorAll('button[data-pj]')], antes=bs.map(b=>b.getAttribute('aria-pressed')); bs[1].click();
    return {n:bs.length, alts:bs.map(b=>b.querySelector('img').alt), antes, despues:bs.map(b=>b.getAttribute('aria-pressed')), v, val:s.valor(), txt:el.textContent, grupo:el.querySelector('[role=group]')!==null}; });
  T.ok(r&&r.n===2,'Muneco.selector pinta 2 retratos'); if (r){
  T.ok(JSON.stringify(r.alts)==='["Pelo corto con gorra","Cola de caballo con aretes"]','alt por apariencia '+r.alts);
  T.ok(r.antes.every(a=>a==='false'),'ninguno marcado al inicio'); T.ok(JSON.stringify(r.despues)==='["false","true"]','clic marca solo el elegido');
  T.ok(r.v==='muneca'&&r.val==='muneca','avisa el valor elegido'); T.ok(!PROHIBIDAS.test(r.txt)&&r.grupo,'sin texto de género, en un grupo'); }
  T.ok(p.errs.length===0,'sin errores '+JSON.stringify(p.errs)); await p.context().close(); }
 { // 2. elegir en «Nueva partida» (Supabase simulado: sesión abierta y tabla de partidas)
  const posts=[]; const prep=async c=>{ await c.addInitScript(()=>{ if (!sessionStorage.getItem('laboyos.auth')) sessionStorage.setItem('laboyos.auth',JSON.stringify({usuario:'ana',access:'x',refresh:'y',exp:Date.now()+36e5})); });
    await c.route('**/rest/v1/partidas**',r=>{ const q=r.request(); if (q.method()==='POST'){ const b=JSON.parse(q.postData()); posts.push(b); return r.fulfill({contentType:'application/json',body:JSON.stringify([{id:'p1',nombre:b.nombre,datos:b.datos,actualizada:new Date().toISOString()}])}); }
      r.fulfill({contentType:'application/json',body:'[]'}); }); };
  const {p}=await T.abrir('index.html',{},prep); await p.click('[data-a=nueva]'); await p.waitForSelector('#inPaso [data-pj]');
  const txt=await p.textContent('#inicio'); T.ok(txt.includes('¿Con quién quieres jugar?'),'pregunta con quién jugar'); T.ok(!PROHIBIDAS.test(txt),'sin texto de género en la pantalla');
  T.ok(await p.locator('#inPaso [data-pj]').count()===2,'dos retratos');
  await p.click('#inGo'); await p.waitForTimeout(300); T.ok((await p.textContent('#inErr')).includes('Elige con quién quieres jugar.')&&posts.length===0,'sin elegir no crea la partida');
  await p.click('[data-pj=muneca]'); await Promise.all([p.waitForNavigation(),p.click('#inGo')]); await p.waitForFunction(()=>window.Guardado&&Guardado.cuenta.activa());
  T.ok(posts.length===1&&posts[0].datos.avatar==='muneca','la partida nueva guarda el personaje '+JSON.stringify(posts[0]&&posts[0].datos));
  T.ok(await p.evaluate(()=>Guardado.perfil().avatar)==='muneca','al entrar, el perfil tiene el elegido');
  T.ok(p.errs.length===0,'sin errores '+JSON.stringify(p.errs)); await p.context().close(); }
 await T.fin(); })();
