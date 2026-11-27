// Avisos de una probadora: (1) mantener pulsado un botón no selecciona texto; (2) el sonido se reanuda al volver a la app.
const T=require('./lib');
(async()=>{ for (const pg of ['cosecha','oleadas','alfareria']){
  const {p}=await T.abrir(`${pg}.html#prueba`,{viewport:{width:390,height:844},hasTouch:true,isMobile:true}); await p.waitForFunction(()=>window.__c||window.__o||window.__a,null,{timeout:30000});
  const sel=await p.evaluate(()=>{ const b=document.querySelector('.touch button'); const s=getComputedStyle(b); return [s.userSelect||s.webkitUserSelect,s.webkitTouchCallout]; });
  T.ok(sel[0]==='none',`${pg}: los botones táctiles no seleccionan texto (${sel})`);
  const ev=await p.evaluate(()=>{ const e=new Event('contextmenu',{bubbles:true,cancelable:true}); document.querySelector('.touch button').dispatchEvent(e); return e.defaultPrevented; });
  T.ok(ev,`${pg}: la pulsación larga no abre el menú del navegador`);
  // sonido: crear el audio con un gesto, pausarlo (como al salir de la app) y volver
  await p.evaluate(()=>{ Papel.Sound.init(); }); await p.mouse.click(200,300); await p.waitForTimeout(300);
  await p.evaluate(()=>Papel.Sound.ctx.suspend()); T.ok(await p.evaluate(()=>Papel.Sound.ctx.state)==='suspended',`${pg}: el audio queda en pausa al salir`);
  await p.evaluate(()=>{ Object.defineProperty(document,'hidden',{value:false,configurable:true}); document.dispatchEvent(new Event('visibilitychange')); }); await p.waitForTimeout(400);
  T.ok(await p.evaluate(()=>Papel.Sound.ctx.state)==='running',`${pg}: al volver a la app el sonido se reanuda`);
  await p.evaluate(()=>Papel.Sound.ctx.suspend()); await p.mouse.click(200,300); await p.waitForTimeout(400); T.ok(await p.evaluate(()=>Papel.Sound.ctx.state)==='running',`${pg}: tocar la pantalla también lo reanuda`);
  T.ok(p.errs.length===0,`${pg}: sin errores `+JSON.stringify(p.errs)); }
 await T.fin(); })();
