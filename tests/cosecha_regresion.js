// Task 4: línea base de la cosecha (entrada, botón Acción/Soltar, letreros). Debe pasar antes y después de sacar el motor a estaciones.js.
const T=require('./lib');
const solapes=p=>p.evaluate(()=>{ const B=[...document.querySelectorAll('#labels .st,#labels .pl,.clock,.order,.tools')].filter(e=>e.offsetWidth).map(e=>[e.className+(e.querySelector('b')?e.querySelector('b').textContent:''),e.getBoundingClientRect()]); const o=[];
  for (let i=0;i<B.length;i++) for (let j=i+1;j<B.length;j++){ const a=B[i][1],b=B[j][1]; const ox=Math.min(a.right,b.right)-Math.max(a.left,b.left), oy=Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top); if (ox>3&&oy>3&&!(/clock|order|tools/.test(B[i][0])&&/clock|order|tools/.test(B[j][0]))) o.push(B[i][0]+'×'+B[j][0]); } return o; });
async function caso(nombre,opt,celular){ const {p,c}=await T.abrir('cosecha.html#prueba',opt); await p.waitForFunction(()=>window.__c&&__c.game.on,null,{timeout:30000}); console.log('== '+nombre);
  const cdp=celular?await c.newCDPSession(p):null;
  const ir=(k,i=0,sg=1)=>p.evaluate(([k,i,sg])=>{ const s=__c.ST.filter(q=>q.kind===k)[i]; const m=__c.players[0]; m.x=s.x; m.z=s.z+sg*(s.r+.35); },[k,i,sg]);
  const carry=()=>p.evaluate(()=>__c.players[0].carry&&__c.players[0].carry.type);
  const pulsar=async()=>{ if (!celular) await p.keyboard.press('e'); else await p.tap('#tAct'); await p.waitForTimeout(450); };
  const mantener=async ms=>{ if (!celular){ await p.keyboard.down('e'); await p.waitForTimeout(ms*5); await p.keyboard.up('e'); return; }
    const bb=await p.locator('#tAct').boundingBox(), x=bb.x+bb.width/2, y=bb.y+bb.height/2; await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]}); await p.waitForTimeout(ms*2); await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]}); };
  T.ok(await p.isVisible('#tAct')&&await p.isVisible('#tDrop'),'botones Acción y Soltar visibles'); T.ok(celular?await p.isVisible('#joy'):!(await p.isVisible('#joy')),'palanca solo en celular');
  let peor=[]; for (const [x,z] of [[-2,1.2],[-4,-3],[2,-3],[4,1],[0,4]]){ await p.evaluate(([x,z])=>{ const m=__c.players[0]; m.x=x; m.z=z; },[x,z]); await p.waitForTimeout(600); const o=await solapes(p); if (o.length>peor.length) peor=o; }
  T.ok(peor.length===0,'letreros y HUD sin encimarse '+JSON.stringify(peor));
  await ir('cafeto'); await p.waitForTimeout(400); await pulsar(); T.ok(await carry()==='canasto','acción en el cafeto recoge');
  await p.evaluate(()=>__c.setCarry(__c.players[0],{type:'canasto',n:__c.R.canasto,pen:0,cols:[]})); await ir('despulpadora'); await p.waitForTimeout(400); await pulsar(); T.ok(await carry()==null,'acción echa el canasto');
  await mantener(3300); T.ok(await p.evaluate(()=>__c.ST.find(q=>q.kind==='despulpadora').state)==='lista','mantener muele hasta el final (sin atascos)');
  await pulsar(); T.ok(await carry()==='baba','acción saca el café en baba');
  await ir('tanque'); await p.waitForTimeout(400); await pulsar(); T.ok(await carry()==null,'acción echa al tanque');
  await p.evaluate(()=>{ const s=__c.ST.filter(q=>q.kind==='tanque')[0]; s.state='lista'; s.t=0; }); await p.waitForTimeout(400); await mantener(2000);
  T.ok(await p.evaluate(()=>__c.ST.filter(q=>q.kind==='tanque')[0].state)==='lavado','mantener lava'); await pulsar(); T.ok(await carry()==='lavado','acción saca el lavado');
  await ir('cama',0,-1); await p.waitForTimeout(400); await pulsar(); T.ok(await carry()==null,'acción extiende en la cama');
  await p.evaluate(()=>{ const s=__c.ST.filter(q=>q.kind==='cama')[0]; s.state='seco'; }); await p.waitForTimeout(300); await pulsar(); T.ok(await carry()==='saco','acción empaca el saco');
  await ir('chiva'); await p.waitForTimeout(400); const pts0=await p.evaluate(()=>__c.game.score); await pulsar(); T.ok(await carry()==null&&await p.evaluate(()=>__c.game.score)>pts0,'acción entrega a la chiva y suma puntos');
  await p.evaluate(()=>__c.setCarry(__c.players[0],{type:'saco',q:80})); if (celular) await p.tap('#tDrop'); else await p.keyboard.press('g'); await p.waitForTimeout(400); T.ok(await carry()==null,'Soltar suelta (se pierde)');
  T.ok(p.errs.length===0,'sin errores '+JSON.stringify(p.errs)); await c.close(); }
(async()=>{ await caso('pc',{viewport:{width:1280,height:760}},false); await caso('celular',{viewport:{width:390,height:844},hasTouch:true,isMobile:true,deviceScaleFactor:1},true); await T.fin(); })();
