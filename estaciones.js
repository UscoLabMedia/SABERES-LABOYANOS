/* estaciones.js — motor común de los minijuegos de estaciones (cosecha, fabricación de artesanías).
   Entrada con un solo botón de Acción (tocar = tomar/dejar; mantener = usar) y botón Soltar, en teclado, ratón, mando y celular;
   control de los invitados por red; colocación de letreros sin encimarse; texto del botón de Acción.
   Cada minijuego pone sus estaciones (ST), sus reglas y su función accion(p,s) -> {t:'Texto', hold?:bool, prog?:0..1}.
   Uso: const E=Estaciones.entrada({canvas,camera,game,togglePause,ST,players,mySlot,accion,reachOf,touch,lob:()=>lob}); E.readInput(); */
(() => {
'use strict';
function entrada(cfg){
  const { canvas, camera, game, ST, players, mySlot, accion, reachOf, touch } = cfg;
  const $=s=>document.querySelector(s);
const down=new Set(), pressed=new Set();
addEventListener('keydown',e=>{ if (e.target.tagName==='INPUT') return; if (e.repeat) return; down.add(e.code); pressed.add(e.code);
  if (e.code==='Escape' && game.on) cfg.togglePause(); if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code) && game.on) e.preventDefault(); });
addEventListener('keyup',e=>down.delete(e.code));
addEventListener('blur',()=>down.clear());
const K=Object.assign({u:['KeyW','ArrowUp'],d:['KeyS','ArrowDown'],l:['KeyA','ArrowLeft'],r:['KeyD','ArrowRight'],take:['KeyE','Space','Enter'],use:['KeyQ','KeyF','ShiftLeft','ShiftRight'],drop:['KeyG','KeyX']},cfg.teclas||{});
const tch={x:0,z:0,take:false,use:false,useEdge:false,drop:false,actDown:false,actEdge:false};
const act={hold:false};   // la acción en curso pide mantener (moler, lavar, voltear)
const any=(arr,set)=>arr.some(c=>set.has(c));
let pad={};
function localInput(){
  const I={x:0,z:0,take:false,use:false,useEdge:false,drop:false};
  if (any(K.u,down)) I.z-=1; if (any(K.d,down)) I.z+=1; if (any(K.l,down)) I.x-=1; if (any(K.r,down)) I.x+=1;
  I.use=any(K.use,down); I.useEdge=any(K.use,pressed); I.drop=any(K.drop,pressed);
  let actDown=any(K.take,down), actEdge=any(K.take,pressed);
  const gp=(navigator.getGamepads?[...navigator.getGamepads()]:[]).filter(Boolean)[0];
  if (gp){ const ax=gp.axes[0]||0, az=gp.axes[1]||0; if (Math.hypot(ax,az)>.25){ I.x+=ax; I.z+=az; }
    const a=gp.buttons[0]?.pressed||gp.buttons[2]?.pressed, b=gp.buttons[1]?.pressed; if (a){ actDown=true; if (!pad.a) actEdge=true; } if (b && !pad.b) I.drop=true; pad={a,b}; }
  if (touch){ I.x+=tch.x; I.z+=tch.z; }
  I.drop=I.drop||tch.drop; actDown=actDown||tch.actDown; actEdge=actEdge||tch.actEdge;
  // un solo botón de acción: tocar = tomar/dejar; si la estación pide mantener, mantener = usar
  const me=players.find(q=>q.slot===mySlot());
  if (actEdge && me){ act.hold=!!accion(me).hold; if (act.hold){ I.use=true; I.useEdge=true; } else I.take=true; }
  else if (actDown && act.hold) I.use=true;
  if (!actDown) act.hold=false;
  mouseInput(I);
  pressed.clear(); tch.drop=false; tch.actEdge=false; return I; }
// Ratón: clic en el suelo para caminar; clic en una estación para ir y tomar o soltar; mantener el clic para usarla
const mouse={target:null,station:null,down:false,pending:false,since:0,edge:false};
const mray=new THREE.Raycaster(), mndc=new THREE.Vector2(), floorPlane=new THREE.Plane(new THREE.Vector3(0,1,0),0), mpt=new THREE.Vector3();
function stationAt(e){ const r=canvas.getBoundingClientRect(); mndc.set((e.clientX-r.left)/r.width*2-1,-((e.clientY-r.top)/r.height)*2+1); mray.setFromCamera(mndc,camera);
  const meshes=ST.filter(s=>s.mesh).map(s=>s.mesh); const h=mray.intersectObjects(meshes,true)[0];
  if (h){ let o=h.object; while (o && !meshes.includes(o)) o=o.parent; const s=ST.find(q=>q.mesh===o); if (s) return {s}; }
  if (mray.ray.intersectPlane(floorPlane,mpt)) return {x:mpt.x,z:mpt.z}; return null; }
canvas.addEventListener('contextmenu',e=>{ e.preventDefault(); if (game.on) pressed.add('KeyG'); });
canvas.addEventListener('pointerdown',e=>{ if (e.pointerType!=='mouse' || e.button!==0 || !game.on) return; const t=stationAt(e); if (!t) return;
  mouse.down=true; mouse.edge=false; if (t.s){ mouse.station=t.s; mouse.target={x:t.s.x,z:t.s.z}; mouse.pending=true; } else { mouse.station=null; mouse.target={x:t.x,z:t.z}; mouse.pending=false; } });
addEventListener('pointerup',e=>{ if (e.pointerType==='mouse') mouse.down=false; });
canvas.addEventListener('pointermove',e=>{ if (e.pointerType!=='mouse' || !game.on) return; const t=stationAt(e); canvas.style.cursor=t&&t.s?'pointer':'default'; });
function mouseInput(I){
  if (Math.hypot(I.x,I.z)>.15){ mouse.target=null; mouse.station=null; return; }
  const p=players.find(q=>q.slot===mySlot()); if (!p || !mouse.target) return;
  const s=mouse.station;
  if (s){ const d=Math.hypot(s.x-p.x,s.z-p.z)-s.r;
    if (d<reachOf(s)-.1){ I.si=ST.indexOf(s);
      if (mouse.pending){ mouse.pending=false; mouse.since=performance.now(); if (accion(p,s).hold){ I.use=true; I.useEdge=true; mouse.edge=true; } else I.take=true; }
      else if (mouse.down && (mouse.edge || performance.now()-mouse.since>250) && s.kind!=='palanca'){ I.use=true; if (!mouse.edge){ I.useEdge=true; mouse.edge=true; } }
      if (!mouse.down && !mouse.pending){ mouse.target=null; mouse.station=null; } }
    else { const dx=s.x-p.x, dz=s.z-p.z, l=Math.hypot(dx,dz)||1; I.x=dx/l; I.z=dz/l; } }
  else { const dx=mouse.target.x-p.x, dz=mouse.target.z-p.z, l=Math.hypot(dx,dz); if (l<.25) mouse.target=null; else { I.x=dx/l; I.z=dz/l; } }
}
// Controles de los invitados: los toques se cuentan para no perder ninguno por la red
const remote={}; const sent={tk:0,ue:0,dr:0,last:0,key:''};
function readInput(){
  const lob=cfg.lob(), I=localInput();
  if (lob && lob.rol==='cliente'){
    if (I.take) sent.tk++; if (I.useEdge) sent.ue++; if (I.drop) sent.dr++;
    const msg={t:'in',x:+I.x.toFixed(2),z:+I.z.toFixed(2),u:I.use?1:0,tk:sent.tk,ue:sent.ue,dr:sent.dr,si:I.si??-1}, key=JSON.stringify(msg), now=performance.now();
    if (key!==sent.key || now-sent.last>200){ lob.enviar(msg); sent.key=key; sent.last=now; } return; }
  players.forEach(p=>{
    if (p.slot===mySlot()){ p.inp=I; return; }
    const r=remote[p.slot]; if (!r){ p.inp={x:0,z:0,take:false,use:false,useEdge:false,drop:false}; return; }
    p.inp={x:r.x||0,z:r.z||0,use:!!r.u,take:r.tk!==r.ptk,useEdge:r.ue!==r.pue,drop:r.dr!==r.pdr,si:r.si>=0?r.si:null}; r.ptk=r.tk; r.pue=r.ue; r.pdr=r.dr; });
}
// joystick táctil
(() => { const joy=$('#joy'), knob=joy.querySelector('i'); let id=null, cx=0, cy=0;
  joy.addEventListener('pointerdown',e=>{ id=e.pointerId; const r=joy.getBoundingClientRect(); cx=r.left+r.width/2; cy=r.top+r.height/2; joy.setPointerCapture(id); move(e); });
  const move=e=>{ if (e.pointerId!==id) return; let dx=e.clientX-cx, dy=e.clientY-cy; const d=Math.hypot(dx,dy), m=45; if (d>m){ dx*=m/d; dy*=m/d; }
    knob.style.transform=`translate(${dx}px,${dy}px)`; tch.x=dx/m; tch.z=dy/m; };
  joy.addEventListener('pointermove',move);
  const up=e=>{ if (e.pointerId!==id) return; id=null; knob.style.transform=''; tch.x=tch.z=0; }; joy.addEventListener('pointerup',up); joy.addEventListener('pointercancel',up);
  $('#tDrop').addEventListener('pointerdown',e=>{ e.preventDefault(); tch.drop=true; });
  // un solo botón: toque = tomar/dejar; si la estación pide mantener (moler, lavar, voltear), mantenerlo = usar
  $('#tAct').addEventListener('pointerdown',e=>{ e.preventDefault(); tch.actDown=true; tch.actEdge=true; });
  ['pointerup','pointercancel','pointerleave'].forEach(ev=>$('#tAct').addEventListener(ev,()=>tch.actDown=false)); })();
  return { readInput, localInput, remote, down, pressed, mouse };
}

// Letreros de las estaciones: si dos se tapan, el de atrás sube; nunca debajo del HUD de arriba (reloj, pedidos, botones).
// Cada s en ST necesita s.el (div), s.lx y s.ly (posición en pantalla).
function colocarLetreros(ST, hud=['.clock','#orders','.tools']){
  const techo=Math.max(0,...hud.map(q=>{ const e=document.querySelector(q); return e?e.getBoundingClientRect().bottom:0; }))+4;
  const puestos=[]; ST.filter(s=>s.el).sort((a,b)=>b.ly-a.ly).forEach(s=>{ const w=s.el.offsetWidth, h=s.el.offsetHeight; let y=s.ly, baja=false;
    for (let k=0;k<8;k++){ const o=puestos.find(q=>Math.abs(q.x-s.lx)<(q.w+w)/2+2 && y>q.y-q.h-2 && y-h<q.y+2); if (!o) break; y=baja?o.y+h+3:o.y-o.h-3; if (!baja && y-h<techo){ baja=true; y=s.ly; } }
    if (y-h<techo) y=techo+h;   // nunca debajo del HUD de arriba
    puestos.push({x:s.lx,y,w,h}); s.el.style.left=s.lx+'px'; s.el.style.top=y+'px'; });
}

// Botón de Acción: texto según la estación cercana y avance (anillo verde) mientras se mantiene.
function botonAccion(me, accion, touch){
  const b=document.querySelector('#tAct'); if (!me||!b) return; const a=accion(me), k=a.t+(a.hold?1:0);
  if (b.dataset.k!==k){ b.dataset.k=k; b.firstChild.textContent=a.t; b.lastChild.innerHTML=(touch?'':'<kbd>E</kbd> ')+(a.hold?'mantén pulsado':''); b.classList.toggle('hold',!!a.hold); b.setAttribute('aria-label',a.t+(a.hold?', mantén pulsado':'')); }
  b.style.setProperty('--p',a.hold&&a.prog?Math.min(1,a.prog):0);
}

window.Estaciones={ entrada, colocarLetreros, botonAccion };
})();
