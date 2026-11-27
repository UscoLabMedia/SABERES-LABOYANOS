// Task 2: la trivia carga el banco del nivel (?nivel=N) y guarda el avance en los campos de ese nivel.
const T=require('./lib'); const fs=require('fs');
(async()=>{
 // nivel 2: completa con 5 aciertos
 { const {p}=await T.abrir('trivia.html?nivel=2#prueba'); await p.waitForFunction(()=>window.__t&&document.getElementById('goBtn')&&!document.getElementById('goBtn').disabled,null,{timeout:20000}).catch(()=>{});
   const ini=await p.evaluate(()=>({h:(document.getElementById('sTitle')||{}).textContent,t:document.title,btn:!!document.getElementById('goBtn')&&!document.getElementById('goBtn').disabled}));
   T.ok(/alfarer|barro/i.test(ini.h||'')&&/Nivel 2/.test(ini.t),'título del nivel 2: '+ini.h+' / '+ini.t); T.ok(ini.btn,'el botón Empezar se habilita');
   if (ini.btn){ await p.click('#goBtn'); for (let i=0;i<5;i++){ await p.evaluate(()=>__t.answer(__t.game.qs[__t.game.i].correcta)); await p.click('#nextBtn'); }
     const r=await p.evaluate(()=>{ const g=Guardado.progreso(); return {n2:g.nivel2,t2:g.trivia2,e:g.etapa,n1:g.nivel1,txt:document.getElementById('eText').textContent}; });
     T.ok(r.n2===true&&r.t2===5&&r.e===2&&!r.n1,'guarda nivel2, trivia2=5, etapa=2 y no toca nivel1 '+JSON.stringify({n2:r.n2,t2:r.t2,e:r.e,n1:r.n1})); T.ok(/Los Caballos/.test(r.txt),'el cierre habla del siguiente lugar: '+r.txt.slice(0,120)); }
   T.ok(p.errs.length===0,'sin errores '+JSON.stringify(p.errs)); }
 // nivel 1 sigue igual
 { const {p}=await T.abrir('trivia.html#prueba'); await p.waitForFunction(()=>window.__t&&!document.getElementById('goBtn').disabled,null,{timeout:20000}).catch(()=>{});
   await p.click('#goBtn'); for (let i=0;i<5;i++){ await p.evaluate(()=>__t.answer(__t.game.qs[__t.game.i].correcta)); await p.click('#nextBtn'); }
   const r=await p.evaluate(()=>{ const g=Guardado.progreso(); return {n1:g.nivel1,t1:g.trivia1,e:g.etapa,n2:g.nivel2}; }); T.ok(r.n1===true&&r.t1===5&&r.e===1&&!r.n2,'nivel 1 intacto '+JSON.stringify(r)); }
 // banco dañado o ausente: mensaje, no pantalla en blanco
 { const {p}=await T.abrir('trivia.html?nivel=2#prueba',{},c=>c.route('**/data/trivia2.json',r=>r.abort())); await p.waitForSelector('.fallback',{timeout:15000}).catch(()=>{});
   const m=await p.evaluate(()=>(document.querySelector('.fallback')||{}).textContent||''); T.ok(/trivia2\.json/.test(m),'sin banco: mensaje claro "'+m.slice(0,80)+'"'); }
 await T.fin(); })();
