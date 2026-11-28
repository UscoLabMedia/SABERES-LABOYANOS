// Aviso 4 y notas del Nivel 2: joystick en la finca y el taller, cuadros compactos en horizontal, pantalla completa en el celular.
const T=require('./lib');
const CEL_H={viewport:{width:844,height:390},hasTouch:true,isMobile:true}, CEL_V={viewport:{width:390,height:844},hasTouch:true,isMobile:true}, PC={viewport:{width:1280,height:760}};
// finge la API de pantalla completa para contar las llamadas (el Chrome sin pantalla no la concede)
const falsaFS=c=>c.addInitScript(()=>{ window.__fs=0; Element.prototype.requestFullscreen=function(){ window.__fs++; return Promise.resolve(); }; });
const ir=async(ruta,opt,prep)=>{ const r=await T.abrir(ruta,opt,prep); await r.p.waitForFunction(()=>window.__f,null,{timeout:30000}); await r.p.waitForTimeout(1200); return r; };
const visible=(p,s)=>p.evaluate(s=>{ const e=document.querySelector(s); if (!e) return false; const r=e.getBoundingClientRect(); return r.width>0&&r.height>0&&getComputedStyle(e).display!=='none'&&getComputedStyle(e).visibility!=='hidden'; },s);
(async()=>{
 for (const [nombre,ruta] of [['finca','finca.html#prueba'],['taller','finca.html?nivel=2#prueba']]){
  { // joystick en celular (horizontal y vertical)
   for (const [vn,opt] of [['horizontal',CEL_H],['vertical',CEL_V]]){
    const {p}=await ir(ruta,opt); T.ok(await visible(p,'#joy'),`${nombre} (${vn}): hay joystick`);
    if (vn==='horizontal'){
     const caja=await p.locator('#joy').boundingBox(), cx=caja.x+caja.width/2, cy=caja.y+caja.height/2;
     const pos=()=>p.evaluate(()=>{ const q=__f.player(); return [q.x,q.z]; }); const a=await pos();
     await p.mouse.move(cx,cy); await p.mouse.down(); await p.mouse.move(cx+40,cy,{steps:4}); await p.waitForTimeout(700); const b=await pos();
     T.ok(Math.hypot(b[0]-a[0],b[1]-a[1])>1,`${nombre}: arrastrar el joystick mueve al personaje (${Math.hypot(b[0]-a[0],b[1]-a[1]).toFixed(2)} m)`);
     await p.mouse.up(); await p.waitForTimeout(150); const c1=await pos(); await p.waitForTimeout(500); const c2=await pos();
     T.ok(Math.hypot(c2[0]-c1[0],c2[1]-c1[1])<.05,`${nombre}: al soltar, se detiene`);
    }
    T.ok(p.errs.length===0,`${nombre} (${vn}): sin errores `+JSON.stringify(p.errs)); await p.context().close(); }
   const {p}=await ir(ruta,PC); T.ok(!(await visible(p,'#joy')),`${nombre} (PC): sin joystick`); T.ok(!(await visible(p,'#fsBtn')),`${nombre} (PC): sin botón de pantalla completa`); await p.context().close(); }
 }
 { // cuadros compactos en horizontal (taller)
  const {p}=await ir('finca.html?nivel=2#prueba',CEL_H); const H=390,W=844;
  const nivel=await p.evaluate(()=>{ const r=document.querySelector('.level').getBoundingClientRect(); return {h:r.height,w:r.width}; });
  T.ok(nivel.h<=H*.27&&nivel.w<=W*.3,`el cuadro «El taller» es pequeño en horizontal (${Math.round(nivel.w)}×${Math.round(nivel.h)})`);
  await p.evaluate(()=>{ const n=__f.npcs[0], q=__f.player(); q.x=n.x; q.z=n.z+1; }); await p.waitForTimeout(400); await p.keyboard.press('e'); await p.waitForTimeout(900);
  const d=await p.evaluate(()=>{ const r=document.querySelector('.dialog').getBoundingClientRect(), j=document.querySelector('#joy').getBoundingClientRect(); return {h:r.height,w:r.width,l:r.left,choca:!(r.right<=j.left||r.left>=j.right||r.bottom<=j.top||r.top>=j.bottom)}; });
  T.ok(d.h<=H*.3,`el diálogo ocupa poco alto en horizontal (${Math.round(d.h)} de ${H})`); T.ok(d.w<=W-150,`el diálogo deja libre la izquierda para el joystick (${Math.round(d.w)} de ${W})`); T.ok(!d.choca,'el diálogo no tapa el joystick');
  await p.context().close(); }
 { // pantalla completa: botón en celular horizontal; el primer toque la pide; en PC no hay
  const {p}=await ir('finca.html?nivel=2#prueba',CEL_H,falsaFS); T.ok(await visible(p,'#fsBtn'),'celular horizontal: botón de pantalla completa');
  await p.click('#fsBtn'); await p.waitForTimeout(200); T.ok(await p.evaluate(()=>window.__fs)>=1,'el botón pide la pantalla completa'); await p.context().close(); }
 { const {p}=await ir('finca.html?nivel=2#prueba',CEL_H,falsaFS); await p.touchscreen.tap(420,200); await p.waitForTimeout(300);
  T.ok(await p.evaluate(()=>window.__fs)>=1,'en horizontal, el primer toque en pantalla pide la pantalla completa sola'); await p.context().close(); }
 { const {p}=await ir('finca.html?nivel=2#prueba',CEL_V,falsaFS); await p.touchscreen.tap(200,300); await p.waitForTimeout(300);
  T.ok(await p.evaluate(()=>window.__fs)===0,'en vertical no la pide'); await p.context().close(); }
 await T.fin(); })();
