// Aviso 6: en celular vertical, los juegos avisan que se juega mejor con el celular en horizontal (sin bloquear el juego).
const T=require('./lib');
(async()=>{ for (const pg of ['cosecha','oleadas','alfareria','carrera']){
  const {p}=await T.abrir(`${pg}.html#prueba`,{viewport:{width:390,height:844},hasTouch:true,isMobile:true}); await p.waitForFunction(()=>window.__c||window.__o||window.__a||window.__r,null,{timeout:30000});
  const vis=()=>p.evaluate(()=>{ const e=document.getElementById('girar'); if (!e||e.hidden) return false; const r=e.getBoundingClientRect(); return r.width>0&&getComputedStyle(e).display!=='none'; });
  T.ok(await vis(),`${pg}: en vertical sale el aviso de girar el celular`);
  const bloquea=await p.evaluate(()=>{ const e=document.getElementById('girar'); return e?getComputedStyle(e).pointerEvents:'?'; }); T.ok(bloquea==='none','el aviso no bloquea el juego (pointer-events: '+bloquea+')');
  await p.setViewportSize({width:844,height:390}); await p.waitForTimeout(500); T.ok(!(await vis()),`${pg}: en horizontal desaparece`);
  await p.setViewportSize({width:390,height:844}); await p.waitForTimeout(500); T.ok(await vis(),`${pg}: al volver a vertical reaparece`);
  await p.click('#girarOk'); await p.waitForTimeout(300); T.ok(!(await vis()),`${pg}: «Seguir así» lo cierra`);
  await p.setViewportSize({width:844,height:390}); await p.waitForTimeout(300); await p.setViewportSize({width:390,height:844}); await p.waitForTimeout(500); T.ok(!(await vis()),`${pg}: ya cerrado, no vuelve a molestar`);
  T.ok(p.errs.length===0,`${pg}: sin errores `+JSON.stringify(p.errs)); await p.context().close(); }
 { const {p}=await T.abrir('cosecha.html#prueba',{viewport:{width:900,height:1000}}); await p.waitForFunction(()=>window.__c,null,{timeout:30000}); T.ok(!(await p.evaluate(()=>!!document.getElementById('girar'))),'en PC (sin pantalla táctil) no aparece nunca'); }
 await T.fin(); })();
