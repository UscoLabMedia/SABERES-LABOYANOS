// Task 6: carrera de chivas (carrera.html): diseño, carrera completa, fuera de pista, turbo, palanca táctil y acceso.
const T=require('./lib');
(async()=>{
 // --- diseño
 { const {p}=await T.abrir('carrera.html?diseno#prueba',{viewport:{width:1280,height:900}}); await p.waitForSelector('#goBtn',{timeout:30000});
   T.ok(await p.isVisible('#disenio'),'se ve el diseño de la chiva');
   await p.click('#colTrompa button:nth-child(2)'); await p.click('#colCuerpo button:nth-child(3)'); await p.click('#colFranja button:nth-child(2)'); await p.click('#optTexto button:nth-child(2)'); await p.click('#optCarga button:nth-child(2)');
   const d=await p.evaluate(()=>Guardado.progreso().chiva); T.ok(d&&d.texto==='Timaná'&&d.cab&&d.cuerpo&&d.franja&&d.carga===1,'el diseño se guarda en la partida '+JSON.stringify(d));
   await p.click('#goBtn'); await p.waitForFunction(()=>window.__r&&__r.game.on,null,{timeout:15000}); T.ok(true,'empieza la carrera con ese diseño');
   T.ok(p.errs.length===0,'sin errores '+JSON.stringify(p.errs)); }
 // --- carrera
 { const {p}=await T.abrir('carrera.html#prueba',{viewport:{width:1280,height:760}}); await p.waitForFunction(()=>window.__r&&__r.game.on,null,{timeout:30000});
   const n=await p.evaluate(()=>__r.cars.length); T.ok(n===4,'solo: 1 humano + 3 chivas de la máquina ('+n+')');
   // turbo
   await p.evaluate(()=>{ __r.game.t=1; const c=__r.cars[0]; c.v=0; c.inp={x:0,z:1}; for (let i=0;i<40;i++) __r.step(.05); const v0=c.v; c.turboCd=0; c.inp={x:0,z:1,take:true}; __r.step(.05); window.__v0=v0; });
   T.ok(await p.evaluate(()=>__r.cars[0].turbo>0),'el turbo se activa con el botón de Acción');
   // fuera de pista: vuelve a la pista
   await p.evaluate(()=>{ const c=__r.cars[0]; c.x=0; c.z=0; c.ai=false; c.inp={x:0,z:0}; for (let i=0;i<30;i++) __r.step(.05); });
   const [d,ancho]=await p.evaluate(()=>[__r.distPista(__r.cars[0]),__r.R.ancho]); T.ok(d<=ancho/2+.8,'chiva lejos de la pista vuelve a la pista (distancia '+d.toFixed(1)+')');
   // carrera completa: todos terminan, nadie se queda quieto
   await p.evaluate(()=>{ __r.reiniciar(); __r.cars[0].ai=true; });
   const fin=await p.evaluate(()=>{ let i=0; while (!__r.game.fin && i<6000){ __r.step(.05); i++; } return {fin:__r.game.fin,t:__r.game.t,i}; });
   T.ok(fin.fin===true,'la carrera termina ('+fin.t.toFixed(0)+' s simulados)');
   const r=await p.evaluate(()=>({puesto:__r.game.puesto,laps:__r.cars.map(c=>c.lap),prog:Guardado.progreso().carrera})); T.ok(r.puesto>=1&&r.puesto<=4,'puesto final '+r.puesto); T.ok(r.laps.every(l=>l>=1),'las 4 chivas avanzaron '+JSON.stringify(r.laps)); T.ok(r.prog===[0,3,2,1,0][r.puesto],'estrellas guardadas según el puesto: '+r.prog);
   T.ok(p.errs.length===0,'sin errores '+JSON.stringify(p.errs)); }
 // --- celular: la palanca gira la chiva
 { const {p,c}=await T.abrir('carrera.html#prueba',{viewport:{width:390,height:844},hasTouch:true,isMobile:true}); await p.waitForFunction(()=>window.__r&&__r.game.on,null,{timeout:30000}); const cdp=await c.newCDPSession(p);
   await p.evaluate(()=>{ __r.game.t=1; }); const a0=await p.evaluate(()=>{ const c=__r.cars[0]; c.ai=false; c.ang=0; return c.ang; });
   const bb=await p.locator('#joy').boundingBox(), x=bb.x+bb.width/2, y=bb.y+bb.height/2; await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]}); for (let i=1;i<=4;i++) await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+10*i,y,id:1}]});
   await p.waitForTimeout(1800); const a1=await p.evaluate(()=>__r.cars[0].ang); await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]}); T.ok(a1>.4,'la palanca hacia la derecha gira la chiva ('+a1.toFixed(2)+' rad)');
   T.ok(await p.isVisible('#tAct'),'botón Turbo visible'); T.ok(p.errs.length===0,'sin errores '+JSON.stringify(p.errs)); }
 { const {p}=await T.abrir('carrera.html?exigir#prueba'); await p.waitForURL(/finca\.html\?nivel=2/,{timeout:15000}).catch(()=>{}); T.ok(/finca\.html\?nivel=2/.test(p.url()),'sin las pistas del taller vuelve a la exploración'); }
 await T.fin(); })();
