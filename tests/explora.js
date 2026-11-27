// Task 3: la exploración (finca.html) funciona para el nivel 1 y para el nivel 2 (?nivel=2, el taller).
const T=require('./lib');
async function explorar(nivel,flag){ const q=nivel===1?'':'?nivel='+nivel; const {p}=await T.abrir(`finca.html${q}#prueba`,{viewport:{width:1280,height:760}});
  await p.waitForFunction(()=>window.__f&&__f.npcs&&__f.npcs.length===3,null,{timeout:40000}).catch(()=>{}); const hay=await p.evaluate(()=>!!(window.__f&&__f.npcs&&__f.npcs.length===3)); T.ok(hay,`nivel ${nivel}: carga con 3 personajes`); if (!hay) return;
  const txt=await p.evaluate(()=>({h1:document.querySelector('h1').textContent,goals:document.getElementById('goals').textContent,t:document.title}));
  if (nivel===2) T.ok(!/caf[eé]|cafetal|cosecha|finca/i.test(txt.h1+txt.goals+txt.t),'nivel 2 sin textos del café: '+JSON.stringify(txt));
  for (let i=0;i<3;i++){ await p.evaluate(i=>{ const n=__f.npcs[i], pl=__f.player(); pl.x=n.x; pl.z=n.z+1; },i); await p.waitForTimeout(500); await p.keyboard.press('e');
    for (let k=0;k<30;k++){ await p.waitForTimeout(130); if (await p.evaluate(()=>document.getElementById('dialog').hidden)) break; await p.keyboard.press('e'); }
    T.ok(await p.evaluate(()=>document.getElementById('dialog').hidden),`nivel ${nivel}: el diálogo ${i+1} termina`);
    await p.waitForTimeout(300); const cap=await p.evaluate(()=>__f.capsules.length?1:0); T.ok(cap===1,`nivel ${nivel}: aparece la cápsula ${i+1}`);
    await p.evaluate(()=>{ const c=__f.capsules[0], pl=__f.player(); pl.x=c.x; pl.z=c.z; }); await p.waitForFunction(()=>!document.getElementById('pista').hidden,null,{timeout:8000}).catch(()=>{});
    await p.click('#pista [data-close]'); await p.waitForTimeout(300); }
  const r=await p.evaluate((flag)=>({n:(__f.PROG['pistas'+__f.nivel]||[]).length,f:__f.PROG[flag],pistas:__f.LEVEL.pistas.map(x=>x.texto).join(' ')}),flag);
  T.ok(r.n===3&&r.f===true,`nivel ${nivel}: 3 pistas y ${flag}=true ${JSON.stringify({n:r.n,f:r.f})}`);
  if (nivel===2) T.ok(/Cecilia Vargas Muñoz/.test(r.pistas)&&/Ley 1891/.test(r.pistas),'la pista nombra a Cecilia Vargas Muñoz y la Ley 1891');
  T.ok(p.errs.length===0,`nivel ${nivel}: sin errores `+JSON.stringify(p.errs)); }
(async()=>{ await explorar(1,'finca1'); await explorar(2,'taller2'); await T.fin(); })();
