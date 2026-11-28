// Fabricación de artesanías (alfareria.html): taller por dentro en tres columnas, piezas que siguen su receta (Recetas), pedidos y letreros.
const T=require('./lib');
const solapes=p=>p.evaluate(()=>{ const B=[...document.querySelectorAll('#labels .st,#labels .pl,.clock,.order,.tools')].filter(e=>e.offsetWidth).map(e=>[e.className+(e.querySelector('b')?e.querySelector('b').textContent:''),e.getBoundingClientRect()]); const o=[];
  for (let i=0;i<B.length;i++) for (let j=i+1;j<B.length;j++){ const a=B[i][1],b=B[j][1]; const ox=Math.min(a.right,b.right)-Math.max(a.left,b.left), oy=Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top); if (ox>3&&oy>3&&!(/clock|order|tools/.test(B[i][0])&&/clock|order|tools/.test(B[j][0]))) o.push(B[i][0]+'×'+B[j][0]); } return o; });
async function caso(nombre,opt,celular){ const {p,c}=await T.abrir('alfareria.html#prueba',opt); await p.waitForFunction(()=>window.__a&&__a.game.on,null,{timeout:30000}); console.log('== '+nombre);
  const cdp=celular?await c.newCDPSession(p):null;
  await p.evaluate(()=>{ __a.game.mode='tranquilo'; __a.game.nextOrder=1e9; Object.assign(__a.R,{amasar:.8,modelar:.8,pintar:.8}); });
  const ir=(k,i=0)=>p.evaluate(([k,i])=>{ const s=__a.ST.filter(q=>q.kind===k)[i], m=__a.players[0]; for (const [dx,dz] of [[0,1.35],[0,-1.35],[-1.35,0],[1.35,0],[0,1.8],[-1.8,0],[1.8,0]]){ m.x=s.x+dx; m.z=s.z+dz; if (__a.nearest(m)===s) return true; } return false; },[k,i]);
  const carry=()=>p.evaluate(()=>{ const c=__a.players[0].carry; return c&&(c.fig+':'+c.i); });
  const est=(k,i=0)=>p.evaluate(([k,i])=>{ const s=__a.ST.filter(q=>q.kind===k)[i]; return {state:s.state,espera:s.espera||null,pz:s.pz?s.pz.fig+':'+s.pz.i:null}; },[k,i]);
  const st=async(k,i=0)=>(await est(k,i)).state;
  const aviso=()=>p.evaluate(()=>document.querySelector('#banner').textContent);
  const pedidos=(...l)=>p.evaluate(l=>{ __a.game.orders.length=0; l.forEach(([f,c])=>__a.pedir(f,c)); },l);
  const pts=()=>p.evaluate(()=>__a.game.score);
  const pulsar=async()=>{ if (!celular) await p.keyboard.press('e'); else await p.tap('#tAct'); await p.waitForTimeout(450); };
  const mantener=async ms=>{ if (!celular){ await p.keyboard.down('e'); await p.waitForTimeout(ms*5); await p.keyboard.up('e'); await p.waitForTimeout(300); return; }
    const bb=await p.locator('#tAct').boundingBox(), x=bb.x+bb.width/2, y=bb.y+bb.height/2; await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]}); await p.waitForTimeout(ms*2); await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]}); await p.waitForTimeout(300); };
  const en=async(k,i)=>{ const ok=await ir(k,i); T.ok(ok,`ubica al jugador junto a ${k} ${i||''}`); await p.waitForTimeout(350); };
  const masa=async()=>{ await en('barro'); await pulsar(); await en('amasado',0); await pulsar(); await mantener(1000); await pulsar(); return carry(); };
  const secarHornear=async()=>{ await en('secadero',0); await pulsar(); T.ok(await st('secadero',0)==='secando','pone a secar'); await p.evaluate(()=>{ __a.ST.filter(q=>q.kind==='secadero')[0].prog=.999; }); await p.waitForTimeout(900); T.ok(await st('secadero',0)==='seco','se seca'); await pulsar();
    await en('horno',0); await pulsar(); T.ok(await st('horno',0)==='quemando','el horno arranca solo al cargar'); await p.evaluate(()=>{ __a.ST.filter(q=>q.kind==='horno')[0].t=__a.R.quema-.1; }); await p.waitForTimeout(900); T.ok(await st('horno',0)==='lista','la pieza queda lista'); await pulsar(); };
  T.ok(await p.isVisible('#tAct')&&await p.isVisible('#tDrop'),'botones Acción y Soltar'); T.ok(celular?await p.isVisible('#joy'):!(await p.isVisible('#joy')),'palanca solo en celular');
  // --- se quitó leña, lluvia, toldo y palanca; taller en tres columnas
  const lay=await p.evaluate(()=>{ const k={}; __a.ST.forEach(s=>{ (k[s.kind]=k[s.kind]||[]).push([s.x,s.z]); }); return {k,lluvia:__a.lluvia,cub:'cubierto' in __a,Recetas:!!__a.Recetas,fn:['pedir','reset','snapshot','applySnapshot'].every(n=>typeof __a[n]==='function')}; });
  T.ok(!lay.k.lena&&!lay.k.palanca&&!lay.k.entrega&&lay.lluvia===undefined&&!lay.cub,'sin leña, palanca, puesto de feria ni lluvia');
  T.ok(lay.Recetas&&lay.fn,'__a expone pedir, reset, snapshot, applySnapshot y Recetas');
  const cnt=Object.fromEntries(Object.entries(lay.k).map(([a,b])=>[a,b.length])); T.ok(JSON.stringify(cnt)===JSON.stringify(Object.assign({},cnt,{barro:1,amasado:2,torno:2,mesa:1,secadero:3,horno:2,pintura:2,mostrador:1}))&&Object.keys(cnt).length===8,'estaciones del taller '+JSON.stringify(cnt));
  const X=k=>lay.k[k][0][0], Z=k=>lay.k[k][0][1];
  T.ok(X('barro')<X('secadero')&&X('secadero')<X('mostrador'),'columnas: mina a la izquierda, secadero al medio, mostrador a la derecha');
  T.ok(Z('barro')>Z('torno')&&Z('horno')<Z('secadero')&&Z('pintura')<Z('mostrador'),'filas: mina abajo y torno arriba; horno arriba del secadero; pintura arriba del mostrador');
  // --- matera: barro → amasado → torno → secadero → horno → mostrador
  await pedidos(['matera']);
  await en('barro'); await pulsar(); T.ok(await carry()==='null:1','toma barro');
  await en('amasado',0); await pulsar(); T.ok(await st('amasado',0)==='amasando','echa el barro a amasar'); await mantener(1000); T.ok(await st('amasado',0)==='listo','amasar (mantener) termina'); await pulsar(); T.ok(await carry()==='null:2','saca la masa');
  await en('secadero',1); await pulsar(); T.ok(await carry()==='null:2'&&await st('secadero',1)==='vacio'&&/ahora va a/.test(await aviso()),'la masa no entra al secadero: '+await aviso());
  await en('torno'); T.ok(await p.evaluate(()=>__a.accion(__a.players[0]).t)==='Hacer: Matera','el torno ofrece «Hacer: Matera»'); await mantener(1000); T.ok(await carry()==='matera:3','el torno da una matera');
  await secarHornear(); T.ok(await carry()==='matera:5','la matera sale cocida y va al mostrador');
  await en('pintura',0); await pulsar(); T.ok(await carry()==='matera:5'&&await st('pintura',0)==='vacio'&&/Esta pieza ahora va a: Mostrador/.test(await aviso()),'la matera no entra a Pintura: '+await aviso());
  let p0=await pts(); await en('mostrador'); await pulsar(); T.ok(await carry()==null&&await pts()>=p0+8&&await p.evaluate(()=>__a.game.orders.length)===0,'entrega la matera y suma ≥ 8');
  // --- torno sin pedido para él
  await pedidos(['frutero']); await p.evaluate(()=>__a.setCarry(__a.players[0],{type:'pieza',fig:null,i:2,q:90})); await en('torno',1); await pulsar(); T.ok(/Ningún cliente pide eso aquí/.test(await aviso())&&await carry()==='null:2','torno sin pedido: «Ningún cliente pide eso aquí»');
  // --- chiva: carrocería y carga en la Mesa, pegar, secar, hornear, pintar rojo y azul, entregar
  await pedidos(['chiva',['rojo','azul']]);
  await masa(); await en('mesa'); await mantener(1000); let m=await est('mesa'); T.ok(m.espera==='carroceria'&&await carry()==null,'la carrocería queda esperando en la Mesa');
  await masa(); await en('mesa'); await mantener(1000); T.ok(await carry()==='chiva:4','modela la carga');
  T.ok(await p.evaluate(()=>__a.accion(__a.players[0]).t)==='Pegar','la Mesa ofrece «Pegar»'); await pulsar(); T.ok(await carry()==='chiva:5'&&(await est('mesa')).espera===null,'pega carrocería y carga');
  T.ok(JSON.stringify(await p.evaluate(()=>__a.players[0].carry.colores))==='["rojo","azul"]','la chiva sabe sus colores');
  await secarHornear(); T.ok(await carry()==='chiva:7','la chiva sale cocida y va a Pintura');
  await en('pintura',1); await pulsar(); T.ok(await st('pintura',1)==='pintando','pone la chiva en Pintura');
  await mantener(1000); T.ok(JSON.stringify(await p.evaluate(()=>__a.ST.filter(q=>q.kind==='pintura')[1].pz.pintados))==='["rojo"]','pinta rojo');
  await pulsar(); T.ok(/amarillo/i.test(await p.evaluate(()=>__a.accion(__a.players[0]).t)),'tocar cambia el color a amarillo'); await mantener(1000);
  T.ok(/El cliente pidió/.test(await aviso())&&JSON.stringify(await p.evaluate(()=>__a.ST.filter(q=>q.kind==='pintura')[1].pz.pintados))==='["rojo"]','pintar amarillo avisa y no cuenta: '+await aviso());
  await pulsar(); await mantener(1000); T.ok(await st('pintura',1)==='listo','pinta azul y queda lista'); await pulsar(); T.ok(await carry()==='chiva:8','recoge la chiva pintada');
  p0=await pts(); await en('mostrador'); await pulsar(); T.ok(await carry()==null&&await pts()>=p0+25,'entrega la chiva y suma ≥ 25');
  // --- Mesa con una carrocería esperando no se bloquea: modela frutero
  await pedidos(['chiva',['verde','rojo']],['frutero']); await p.evaluate(()=>{ __a.ST.find(q=>q.kind==='mesa').espera='carroceria'; __a.setCarry(__a.players[0],{type:'pieza',fig:null,i:2,q:90}); });
  await en('mesa'); await pulsar(); T.ok(await p.evaluate(()=>__a.accion(__a.players[0]).t)==='Hacer: Frutero','tocar alterna a «Hacer: Frutero»');
  await mantener(1000); T.ok(await carry()==='frutero:3'&&(await est('mesa')).espera==='carroceria','modela el frutero y la carrocería sigue esperando');
  // --- soltar
  if (celular) await p.tap('#tDrop'); else await p.keyboard.press('g'); await p.waitForTimeout(400); T.ok(await carry()==null,'Soltar suelta (se pierde)');
  // --- red: snapshot de ida y vuelta no rompe
  T.ok(await p.evaluate(()=>{ const s=__a.snapshot(); __a.applySnapshot(JSON.parse(JSON.stringify(s))); return __a.ST.find(q=>q.kind==='mesa').espera==='carroceria'; }),'snapshot → applySnapshot conserva la Mesa');
  // --- letreros
  let peor=[]; for (const [x,z] of [[-2.6,0],[4.6,0],[-6,1.6],[1,0],[8,1.6],[-2.6,-3]]){ await p.evaluate(([x,z])=>{ const m=__a.players[0]; m.x=x; m.z=z; },[x,z]); await p.waitForTimeout(600); const o=await solapes(p); if (o.length>peor.length) peor=o; }
  T.ok(peor.length===0,'letreros y HUD sin encimarse '+JSON.stringify(peor));
  T.ok(p.errs.length===0,'sin errores '+JSON.stringify(p.errs)); await c.close(); }
(async()=>{ await caso('celular horizontal',{viewport:{width:844,height:390},hasTouch:true,isMobile:true,deviceScaleFactor:1},true); await caso('pc',{viewport:{width:1280,height:760}},false); await caso('celular',{viewport:{width:390,height:844},hasTouch:true,isMobile:true,deviceScaleFactor:1},true);
  { const {p}=await T.abrir('alfareria.html?exigir#prueba'); await p.waitForURL(/finca\.html\?nivel=2/,{timeout:15000}).catch(()=>{}); T.ok(/finca\.html\?nivel=2/.test(p.url()),'sin las pistas del taller, vuelve a la exploración: '+p.url()); }
  { const {p}=await T.abrir('alfareria.html#prueba',{},c=>c.route('**/data/recetas2.json',r=>r.abort())); await p.waitForTimeout(2500); T.ok(await p.evaluate(()=>/recetas/.test((document.querySelector('.fallback')||{}).textContent||'')),'sin data/recetas2.json muestra un aviso'); }
  await T.fin(); })();
