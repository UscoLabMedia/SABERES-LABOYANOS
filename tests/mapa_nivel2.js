// Task 7: el mapa abre el taller al superar el café, la ficha lista los juegos del nivel 2 y la trivia suma comodines por estrellas.
const T=require('./lib');
const datos=o=>c=>c.addInitScript(d=>localStorage.setItem('laboyos.datos.local',JSON.stringify(d)),o);
async function libro(prog){ const {p}=await T.abrir('index.html#prueba',{viewport:{width:1280,height:760}},datos(prog)); await p.waitForFunction(()=>window.__i&&__i.showPlace,null,{timeout:30000}).catch(()=>{}); await p.click('#openBtn'); await p.waitForTimeout(3500); return p; }
(async()=>{
 { const p=await libro({etapa:0}); const r=await p.evaluate(()=>({t:__i.abierto&&__i.abierto('taller'),c:__i.abierto&&__i.abierto('caballos')}));
   T.ok(r.t===false,'sin el café superado el taller sigue plegado'); await p.evaluate(()=>__i.showPlace('taller')); await p.waitForTimeout(900);
   T.ok(/Se despliega al superar El Café/.test(await p.textContent('#placeLock')),'dice qué falta: '+(await p.textContent('#placeLock'))); T.ok(await p.isDisabled('#placeGo'),'no se puede entrar');  await p.context().close(); }
 { const p=await libro({etapa:1,nivel1:true,finca1:true,cosecha:2,oleadas:1,trivia1:4}); const r=await p.evaluate(()=>({t:__i.abierto('taller'),c:__i.abierto('caballos')}));
   T.ok(r.t===true&&r.c===false,'con el café superado se abre el taller y no los caballos '+JSON.stringify(r));
   await p.evaluate(()=>__i.showPlace('taller')); await p.waitForTimeout(900); T.ok(!(await p.isDisabled('#placeGo'))&&/taller/i.test(await p.textContent('#placeGo')),'botón Entrar al taller: '+(await p.textContent('#placeGo')));
   const prog=await p.textContent('#progList'); T.ok(/La Alfarería\s*disponible/.test(prog)&&/El Café\s*completado/.test(prog),'recorrido: '+prog.replace(/\s+/g,' '));
   await p.click('#placeGo'); await p.waitForURL(/finca\.html\?nivel=2/,{timeout:10000}).catch(()=>{}); T.ok(/finca\.html\?nivel=2/.test(p.url()),'entra a finca.html?nivel=2');  await p.context().close(); }
 { const p=await libro({etapa:1,nivel1:true,finca1:true,taller2:true,pistas2:['barro','chiva','origen'],fabrica:2,carrera:3,trivia2:4}); await p.evaluate(()=>__i.showPlace('taller')); await p.waitForTimeout(900);
   const h=await p.evaluate(()=>document.getElementById('placeGameList').innerText.replace(/\s+/g,' ')); T.ok(/La fabricación.*★★☆/.test(h)&&/Carrera de chivas.*★★★/.test(h)&&/Trivia del barro.*4 de 5/.test(h),'la ficha lista los 3 juegos con estrellas: '+h);
   const hrefs=await p.evaluate(()=>[...document.querySelectorAll('#placeGameList a')].map(a=>a.getAttribute('href'))); T.ok(hrefs.join()==='alfareria.html,carrera.html,trivia.html?nivel=2','enlaces '+hrefs);
   await p.evaluate(()=>{ document.getElementById('perfil')&&0; __i.syncProfile&&__i.syncProfile(); }); const sum=await p.evaluate(()=>{ __i.syncProfile(); return document.getElementById('pfSummary').textContent; }); T.ok(/Nivel 2/.test(sum)&&/fabricación 2★/.test(sum)&&/carrera 3★/.test(sum),'Mi progreso incluye el nivel 2: '+sum);  await p.context().close(); }
 { const {p}=await T.abrir('trivia.html?nivel=2#prueba',{},datos({etapa:1,nivel1:true,taller2:true,fabrica:3,carrera:2})); await p.waitForFunction(()=>window.__t,null,{timeout:30000}).catch(()=>{}); const t=await p.textContent('#helpInfo');
   T.ok(/5 comodines/.test(t)&&/3 por las estrellas de la fabricación/.test(t)&&/1 por la carrera/.test(t),'comodines del nivel 2: '+t); }
 await T.fin(); })();
