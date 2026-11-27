// Task 5: fabricación de artesanías (alfareria.html): cadena completa, reglas (amasado, rajadura, quema, lluvia), pedidos y letreros.
const T=require('./lib');
const solapes=p=>p.evaluate(()=>{ const B=[...document.querySelectorAll('#labels .st,#labels .pl,.clock,.order,.tools')].filter(e=>e.offsetWidth).map(e=>[e.className+(e.querySelector('b')?e.querySelector('b').textContent:''),e.getBoundingClientRect()]); const o=[];
  for (let i=0;i<B.length;i++) for (let j=i+1;j<B.length;j++){ const a=B[i][1],b=B[j][1]; const ox=Math.min(a.right,b.right)-Math.max(a.left,b.left), oy=Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top); if (ox>3&&oy>3&&!(/clock|order|tools/.test(B[i][0])&&/clock|order|tools/.test(B[j][0]))) o.push(B[i][0]+'×'+B[j][0]); } return o; });
async function caso(nombre,opt,celular){ const {p,c}=await T.abrir('alfareria.html#prueba',opt); await p.waitForFunction(()=>window.__a&&__a.game.on,null,{timeout:30000}); console.log('== '+nombre);
  const cdp=celular?await c.newCDPSession(p):null;
  const ir=(k,i=0)=>p.evaluate(([k,i])=>{ const s=__a.ST.filter(q=>q.kind===k)[i], m=__a.players[0]; for (const [dx,dz] of [[0,-1.35],[0,1.35],[-1.35,0],[1.35,0]]){ m.x=s.x+dx; m.z=s.z+dz; if (__a.nearest(m)===s) return true; } return false; },[k,i]);
  const carry=()=>p.evaluate(()=>{ const c=__a.players[0].carry; return c&&(c.type+(c.forma?':'+c.forma:'')); });
  const st=(k,i=0)=>p.evaluate(([k,i])=>__a.ST.filter(q=>q.kind===k)[i].state,[k,i]);
  const pulsar=async()=>{ if (!celular) await p.keyboard.press('e'); else await p.tap('#tAct'); await p.waitForTimeout(450); };
  const mantener=async ms=>{ if (!celular){ await p.keyboard.down('e'); await p.waitForTimeout(ms*5); await p.keyboard.up('e'); return; }
    const bb=await p.locator('#tAct').boundingBox(), x=bb.x+bb.width/2, y=bb.y+bb.height/2; await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]}); await p.waitForTimeout(ms*2); await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]}); };
  const en=async(k,i)=>{ const ok=await ir(k,i); T.ok(ok,`ubica al jugador junto a ${k} ${i||''}`); await p.waitForTimeout(350); };
  T.ok(await p.isVisible('#tAct')&&await p.isVisible('#tDrop'),'botones Acción y Soltar'); T.ok(celular?await p.isVisible('#joy'):!(await p.isVisible('#joy')),'palanca solo en celular');
  // --- cadena completa: vasija
  await en('barro'); await pulsar(); T.ok(await carry()==='barro','toma barro');
  await en('amasado',0); await pulsar(); T.ok(await st('amasado',0)==='amasando','echa el barro a amasar'); await mantener(1800); T.ok(await st('amasado',0)==='listo','amasar (mantener) termina'); await pulsar(); T.ok(await carry()==='masa','saca la masa');
  await en('torno'); await pulsar(); await mantener(1800); await pulsar(); T.ok(await carry()==='cruda:vasija','el torno da una vasija cruda');
  await en('secadero',0); await pulsar(); T.ok(await st('secadero',0)==='secando','pone a secar'); await p.evaluate(()=>{ __a.ST.filter(q=>q.kind==='secadero')[0].prog=.999; }); await p.waitForTimeout(900); T.ok(await st('secadero',0)==='seco','se seca'); await pulsar(); T.ok(await carry()==='seca:vasija','recoge la pieza seca');
  await en('horno',0); await pulsar(); T.ok(await st('horno',0)==='cargado','carga el horno (falta leña)');
  await en('lena'); await pulsar(); T.ok(await carry()==='lena','toma leña'); await en('horno',0); await pulsar(); T.ok(await st('horno',0)==='quemando','enciende el horno con leña');
  await p.evaluate(()=>{ const s=__a.ST.filter(q=>q.kind==='horno')[0]; s.t=__a.R.quema-.1; }); await p.waitForTimeout(900); T.ok(await st('horno',0)==='lista','la pieza queda lista'); const q0=await p.evaluate(()=>__a.ST.filter(q=>q.kind==='horno')[0].q); T.ok(q0===90,'amasada: no se rajó (calidad 90)');
  await pulsar(); T.ok(await carry()==='cocida:vasija','saca la pieza cocida');
  await en('pintura',0); await pulsar(); await mantener(1800); await pulsar(); T.ok(await carry()==='pintada:vasija','pinta la pieza');
  await p.evaluate(()=>{ __a.game.orders.length=0; __a.game.orders.push({id:1,type:'vasija',left:90,total:100}); }); const pts0=await p.evaluate(()=>__a.game.score);
  await en('entrega'); await pulsar(); T.ok(await carry()==null&&await p.evaluate(()=>__a.game.score)>=pts0+10,'entrega la vasija y suma puntos');
  // --- sin amasar: se raja en el horno
  await en('barro'); await pulsar(); await en('mesaChiva'); await pulsar(); await mantener(1800); await pulsar(); T.ok(await carry()==='cruda:chiva','la mesa de chivas da una chiva cruda (barro sin amasar)');
  await p.evaluate(()=>__a.setCarry(__a.players[0],{type:'seca',forma:'chiva',q:90,aire:true})); await en('horno',1); await pulsar(); await p.evaluate(()=>{ const s=__a.ST.filter(q=>q.kind==='horno')[1]; s.state='quemando'; s.t=__a.R.quema-.1; }); await p.waitForTimeout(900);
  const h=await p.evaluate(()=>{ const s=__a.ST.filter(q=>q.kind==='horno')[1]; return {st:s.state,q:s.q,r:s.rajada}; }); T.ok(h.st==='lista'&&h.r===true&&h.q<90,'barro sin amasar se rajó en el horno '+JSON.stringify(h));
  // --- se quema si se deja pasar
  await p.evaluate(()=>{ const s=__a.ST.filter(q=>q.kind==='horno')[1]; s.t=__a.R.ventana-.05; }); await p.waitForTimeout(900); const qa=await p.evaluate(()=>__a.ST.filter(q=>q.kind==='horno')[1].q); await p.waitForTimeout(1500);
  T.ok(await st('horno',1)==='pasada'&&await p.evaluate(()=>__a.ST.filter(q=>q.kind==='horno')[1].q)<qa,'si se deja pasar, la pieza se quema y pierde calidad');
  // --- lluvia: moja las piezas al sol; el toldo las protege
  await p.evaluate(()=>{ __a.game.t=60; const s=__a.ST.filter(q=>q.kind==='secadero')[1]; s.state='secando'; s.prog=.2; s.q=90; s.forma='vasija'; }); await p.waitForTimeout(2500);
  const qr=await p.evaluate(()=>__a.ST.filter(q=>q.kind==='secadero')[1].q); T.ok(qr<90,'la lluvia moja la pieza al sol: calidad '+qr.toFixed(1));
  await en('palanca'); await pulsar(); T.ok(await p.evaluate(()=>__a.cubierto)===true,'la palanca cubre el toldo'); const qc=await p.evaluate(()=>__a.ST.filter(q=>q.kind==='secadero')[1].q); await p.waitForTimeout(2000);
  T.ok(await p.evaluate(()=>__a.ST.filter(q=>q.kind==='secadero')[1].q)===qc,'con el toldo la pieza no se moja más');
  // --- soltar
  await p.evaluate(()=>__a.setCarry(__a.players[0],{type:'masa',q:90})); if (celular) await p.tap('#tDrop'); else await p.keyboard.press('g'); await p.waitForTimeout(400); T.ok(await carry()==null,'Soltar suelta (se pierde)');
  // --- letreros
  let peor=[]; for (const [x,z] of [[-2,1.2],[-8,-4],[2,-3],[6,1],[0,4]]){ await p.evaluate(([x,z])=>{ const m=__a.players[0]; m.x=x; m.z=z; },[x,z]); await p.waitForTimeout(600); const o=await solapes(p); if (o.length>peor.length) peor=o; }
  T.ok(peor.length===0,'letreros y HUD sin encimarse '+JSON.stringify(peor));
  T.ok(p.errs.length===0,'sin errores '+JSON.stringify(p.errs)); await c.close(); }
(async()=>{ await caso('pc',{viewport:{width:1280,height:760}},false); await caso('celular',{viewport:{width:390,height:844},hasTouch:true,isMobile:true,deviceScaleFactor:1},true);
  { const {p}=await T.abrir('alfareria.html?exigir#prueba'); await p.waitForURL(/finca\.html\?nivel=2/,{timeout:15000}).catch(()=>{}); T.ok(/finca\.html\?nivel=2/.test(p.url()),'sin las pistas del taller, vuelve a la exploración: '+p.url()); }
  await T.fin(); })();
