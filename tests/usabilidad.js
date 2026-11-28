// Usabilidad general: cada pantalla en celular vertical, celular horizontal y PC.
// Revisa: scroll horizontal, controles fuera de pantalla, textos o botones encimados, controles tapados por otro elemento.
// Uso: node tests/usabilidad.js [pagina]   (p. ej. node tests/usabilidad.js carrera). Con VER=1 imprime también los avisos.
const T=require('./lib');
const PAGINAS=[['index.html#prueba','index'],['finca.html#prueba','finca'],['finca.html?nivel=2#prueba','taller'],['cosecha.html#prueba','cosecha'],['oleadas.html#prueba','oleadas'],
  ['alfareria.html#prueba','alfareria'],['carrera.html#prueba','carrera'],['trivia.html#prueba','trivia'],['trivia.html?nivel=2#prueba','trivia2']];
const VISTAS=[['vertical',{viewport:{width:390,height:844},hasTouch:true,isMobile:true}],['horizontal',{viewport:{width:844,height:390},hasTouch:true,isMobile:true}],['PC',{viewport:{width:1280,height:760}}]];
const IGNORAR='#girar,#cuenta,[aria-hidden="true"]';   // el aviso de girar y la cuenta 3-2-1 se encima a propósito
// Se ejecuta dentro de la página. Devuelve la lista de problemas.
function revisar(ignorar){
  const W=innerWidth,H=innerHeight,out=[]; const nom=e=>(e.id?'#'+e.id:e.tagName.toLowerCase()+(e.className&&typeof e.className==='string'?'.'+e.className.trim().split(/\s+/)[0]:''))+(e.textContent.trim()?` «${e.textContent.trim().slice(0,24)}»`:'');
  const vis=e=>{ const s=getComputedStyle(e); if (s.display==='none'||s.visibility==='hidden'||e.closest(ignorar)) return null; for (let n=e;n&&n!==document.documentElement;n=n.parentElement) if (+getComputedStyle(n).opacity<0.3) return null; /* oculto o desvaneciéndose */ const r=e.getBoundingClientRect(); return r.width>2&&r.height>2?r:null; };
  const grande=e=>{ const r=e.getBoundingClientRect(); return r.width*r.height>=0.8*W*H; };   // pantalla de entrada, escena o capa de letreros: no cuenta como tapa
  const capaMundo=e=>{ for (let n=e.parentElement;n&&n!==document.body;n=n.parentElement) if (getComputedStyle(n).pointerEvents==='none'&&grande(n)) return true; return false; };   // letreros 3D pegados a objetos: salen de pantalla con su objeto
  if (document.documentElement.scrollWidth>W+1) out.push(`scroll horizontal (${document.documentElement.scrollWidth}px > ${W}px)`);
  // Controles: botones, enlaces, campos y cualquier elemento fijo con texto.
  const ctl=[...document.querySelectorAll('button,a[href],input,select,textarea,[role=button],[onclick]')].filter(e=>e.tagName!=='CANVAS'&&vis(e)&&!e.disabled);
  const cajas=ctl.map(e=>({e,r:vis(e)}));
  // Textos: elementos hoja con texto propio, de los que están fijos o absolutos (HUD y letreros).
  const hud=[...document.querySelectorAll('body *')].filter(e=>{ if (e.children.length||!e.textContent.trim()||!vis(e)) return false; const p=e.closest('*'); for (let n=e;n&&n!==document.body;n=n.parentElement){ const pos=getComputedStyle(n).position; if (pos==='fixed'||pos==='absolute') return true; } return false; }).map(e=>({e,r:vis(e)}));
  for (const {e,r} of cajas){   // fuera de pantalla (solo los que no se desplazan con la página)
    let fijo=false; for (let n=e;n&&n!==document.body;n=n.parentElement) if (getComputedStyle(n).position==='fixed') fijo=true;
    if (fijo&&(r.left<-1||r.top<-1||r.right>W+1||r.bottom>H+1)) out.push(`control fuera de pantalla: ${nom(e)} (${Math.round(r.left)},${Math.round(r.top)} → ${Math.round(r.right)},${Math.round(r.bottom)})`);
    if (fijo&&(r.width<24||r.height<24)) out.push(`control muy pequeño para tocar: ${nom(e)} (${Math.round(r.width)}×${Math.round(r.height)})`);
    // tapado: el centro del control no responde al control
    const cx=Math.min(Math.max(r.left+r.width/2,0),W-1),cy=Math.min(Math.max(r.top+r.height/2,0),H-1),t=document.elementFromPoint(cx,cy);
    if (fijo&&t&&t!==e&&!e.contains(t)&&!t.contains(e)&&!t.closest(ignorar)&&!grande(t)) out.push(`control tapado por ${nom(t)}: ${nom(e)}`);
  }
  const todos=[...cajas,...hud.filter(h=>!cajas.some(c=>c.e===h.e||c.e.contains(h.e)))];
  const inter=(a,b)=>Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left))*Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top));
  for (let i=0;i<todos.length;i++) for (let j=i+1;j<todos.length;j++){ const a=todos[i],b=todos[j]; if (a.e.contains(b.e)||b.e.contains(a.e)) continue;
    const m=Math.min(a.r.width*a.r.height,b.r.width*b.r.height); if (m>0&&inter(a.r,b.r)/m>0.25) out.push(`encimados: ${nom(a.e)} y ${nom(b.e)}`); }
  for (const {e,r} of hud) if (!capaMundo(e)&&(r.left<-1||r.top<-1||r.right>W+1||r.bottom>H+1)){ let fijo=false; for (let n=e;n&&n!==document.body;n=n.parentElement) if (getComputedStyle(n).position==='fixed') fijo=true; if (fijo) out.push(`texto fuera de pantalla: ${nom(e)}`); }
  return [...new Set(out)];
}
(async()=>{ const solo=process.argv[2]; let total=0;
  for (const [ruta,nombre] of PAGINAS){ if (solo&&solo!==nombre) continue;
    for (const [vn,opt] of VISTAS){
      const {p}=await T.abrir(ruta,opt); await p.waitForTimeout(2500);   // deja cargar la escena y los datos
      const pb=await p.evaluate(revisar,IGNORAR); total+=pb.length;
      if (vn==='horizontal') T.ok(await p.evaluate(()=>{ const b=document.getElementById('fsBtn'); return !!b&&!b.hidden&&b.getBoundingClientRect().width>0; }),`${nombre} (${vn}): botón de pantalla completa visible`);
      if (vn!=='PC') T.ok(await p.evaluate(()=>!!document.getElementById('fsBtn')||innerHeight>innerWidth),`${nombre} (${vn}): tiene pantalla completa`);
      T.ok(p.errs.length===0,`${nombre} (${vn}): sin errores de JS ${JSON.stringify(p.errs)}`);
      T.ok(pb.length===0,`${nombre} (${vn}): sin problemas de interfaz`+(pb.length?'\n      - '+pb.join('\n      - '):''));
      await p.context().close(); } }
  console.log(`problemas de interfaz: ${total}`); await T.fin(); })();
