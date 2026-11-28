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
 { // 3. cambiar en Mi progreso; la finca ya no pregunta; finca y trivia usan el de la partida
  const espia=c=>c.addInitScript(()=>{ let M; Object.defineProperty(window,'Muneco',{configurable:true,get:()=>M,set(v){ M=v; const j=v.jugador; v.jugador=(e,f)=>{ (window.__fems=window.__fems||[]).push(!!f); return j(e,f); }; }}); });
  const {c,p}=await T.abrir('finca.html#prueba',{},espia); await p.waitForFunction(()=>window.__f,null,{timeout:30000});
  T.ok(await p.locator('[data-av],.avatar-pick').count()===0,'la finca ya no tiene selector'); T.ok(!PROHIBIDAS.test(await p.textContent('body')),'la finca no dice muñeco/muñeca');
  T.ok(await p.evaluate(()=>window.__fems.length>0&&!window.__fems.includes(true)),'partida sin personaje guardado: pelo corto, sin errores');
  const q=await c.newPage(); q.errs=[]; q.on('pageerror',e=>q.errs.push(e.message)); await q.goto(p.url().replace(/finca\.html.*/,'index.html#prueba')); await q.waitForFunction(()=>window.Muneco&&window.Guardado);
  await q.evaluate(()=>document.querySelector('[data-act=perfil]').click()); await q.waitForSelector('#pfPj [data-pj]',{state:'visible'});
  await q.click('#pfPj [data-pj=muneca]'); T.ok(await q.evaluate(()=>Guardado.perfil().avatar)==='muneca','Mi progreso cambia el personaje');
  T.ok(await q.getAttribute('#pfPj [data-pj=muneca]','aria-pressed')==='true','Mi progreso marca el actual');
  for (const pg of ['finca','trivia']){ const r=await c.newPage(); r.errs=[]; r.on('pageerror',e=>r.errs.push(e.message)); await r.goto(p.url().replace(/finca\.html.*/,pg+'.html#prueba')); await r.waitForFunction(()=>window.__fems&&window.__fems.length,null,{timeout:30000});
    T.ok(await r.evaluate(()=>window.__fems[0]===true),pg+' usa el personaje de la partida'); T.ok(r.errs.length===0,pg+' sin errores '+JSON.stringify(r.errs)); }
  T.ok(p.errs.length===0&&q.errs.length===0,'sin errores '+JSON.stringify(p.errs.concat(q.errs))); await c.close(); }
 { // 4. colores del retrato: la gorra roja (#c8101e) se ve roja, no salmón
  const {p}=await T.abrir('finca.html#prueba'); await p.waitForFunction(()=>window.Muneco&&window.__f,null,{timeout:30000});
  const d=await p.evaluate(async()=>{ const img=new Image(); img.src=Muneco.retrato(()=>Muneco.jugador(0,false)); await img.decode(); const c=document.createElement('canvas'); c.width=img.width; c.height=img.height; const g=c.getContext('2d'); g.drawImage(img,0,0);
    const px=g.getImageData(0,0,c.width,c.height).data; let best=-999; for (let i=0;i<px.length;i+=4) if (px[i+3]>200) best=Math.max(best,px[i]-px[i+1]); return best; });
  T.ok(d>=120,'la gorra del retrato es roja intensa (R−G = '+d+')'); await p.context().close(); }
 await T.fin(); })();
