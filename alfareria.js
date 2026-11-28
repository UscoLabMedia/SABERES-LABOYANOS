addEventListener('contextmenu',e=>{ if (e.target.closest&&e.target.closest('.touch')) e.preventDefault(); });
(() => {
'use strict';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
function fail(m){ document.body.insertAdjacentHTML('beforeend',`<div class="fallback">${m}</div>`); }
if (typeof THREE==='undefined' || !window.Papel || !window.Muneco || !window.Recetas){ fail('No se pudo cargar el motor 3D. Revisa la conexión y recarga la página.'); return; }
const { S, save, Sound, cutout, D, texFrom, paperMat, boxMesh, hipRoof, tileTex, mk } = Papel;
document.documentElement.classList.toggle('big-text', S.text==='grande');
const touch=matchMedia('(pointer: coarse)').matches;
Papel.avisoGirar();
let PROG=Guardado.progreso();
if (!PROG.taller2 && (location.hash!=='#prueba' || location.search.includes('exigir'))){ location.replace('finca.html?nivel=2'); return; }   // primero la exploración del taller
const saveProg=()=>{ Guardado.guardar(PROG); };

/* ---------------- Reglas (fáciles de ajustar) ---------------- */
const R = {
  duracion:180, calidadBase:90, especial:80,
  amasar:1.6, modelar:1.8, secado:10, quema:14, ventana:10, pintar:1.6, pasadaPorSeg:.8, toque:.25,   // toque: menos que esto es tocar (alternar), no mantener
  clienteCada:22, bono:5, qPorPunto:4, repisa:2, pts:{perdido:-5},   // bono: puntos extra por rapidez; qPorPunto: calidad perdida por quemado que resta 1 punto
  estrellas:[30,60,95],
};

/* ---------------- Escena: el taller por dentro ---------------- */
const canvas=$('#scene'); let renderer;
try { renderer=new THREE.WebGLRenderer({canvas,antialias:true}); } catch(e){ fail('Este navegador no puede mostrar gráficos 3D (WebGL).'); return; }
renderer.outputEncoding=THREE.sRGBEncoding; renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.05;
renderer.shadowMap.enabled=true; renderer.shadowMap.type=S.quality==='alta'?THREE.PCFSoftShadowMap:THREE.BasicShadowMap;
const scene=new THREE.Scene(); scene.background=new THREE.Color('#2a1d14');
const camera=new THREE.PerspectiveCamera(38,1,.1,200);
const hemi=new THREE.HemisphereLight('#fff1d6','#4a3320',.7); scene.add(hemi);
const sun=new THREE.DirectionalLight('#ffdcaa',1.15); sun.position.set(-6,16,6); sun.castShadow=true; sun.shadow.mapSize.set(2048,2048); sun.shadow.radius=4; sun.shadow.bias=-.0006;
Object.assign(sun.shadow.camera,{left:-14,right:14,top:12,bottom:-12,near:1,far:50}); scene.add(sun);
const front=new THREE.DirectionalLight('#ffe8cc',.35); front.position.set(0,6,14); scene.add(front);
const AW=11, AD=6.2;   // medio ancho y media profundidad del taller (sin pared delantera)
const mat=(c,m)=>paperMat(c,m);
const TERRA='#b5652f', CLAY='#a96a3c', WOOD='#8a5a32', BEAM='#6b4224', WALL='#ead7b8';
{ const desk=new THREE.Mesh(new THREE.PlaneGeometry(120,120), new THREE.MeshStandardMaterial({color:'#3a2416',roughness:.85})); desk.rotation.x=-Math.PI/2; desk.position.y=-.3; scene.add(desk);
  const tiles=tileTex(); tiles.repeat.set(AW*.45,AD*.45); const side=paperMat('#7a3a22');
  const floor=new THREE.Mesh(new THREE.BoxGeometry(AW*2,.3,AD*2),[side,side,new THREE.MeshStandardMaterial({map:tiles,roughness:.9}),side,side,side]); floor.position.y=-.15; floor.receiveShadow=true; scene.add(floor);
  const back=boxMesh(AW*2+.6,3.2,.3,mat(WALL)); back.position.set(0,0,-AD-.15); scene.add(back);   // pared del fondo
  [-7.5,-2.6,2.6,7.5].forEach(x=>{ const f=boxMesh(2,1.3,.08,mat(BEAM)); f.position.set(x,1.1,-AD+.02); scene.add(f); const v=boxMesh(1.7,1.05,.1,mat('#9cc7d8')); v.position.set(x,1.22,-AD+.03); scene.add(v);   // ventanas
    const c=boxMesh(.08,1.05,.12,mat(BEAM)); c.position.set(x,1.22,-AD+.04); scene.add(c); });
  for (let x=-AW;x<=AW+.01;x+=AW/2.5){ const b=boxMesh(.28,3.2,.34,mat(BEAM)); b.position.set(x,0,-AD); scene.add(b); }   // vigas
  { const b=boxMesh(AW*2+.6,.3,.4,mat(BEAM)); b.position.set(0,2.9,-AD); scene.add(b); }
  [-1,1].forEach(sx=>{ const w=boxMesh(.3,1,AD*2,mat(WALL)); w.position.set(sx*(AW+.15),0,0); scene.add(w); const t=boxMesh(.4,.12,AD*2,mat(BEAM)); t.position.set(sx*(AW+.15),1,0); scene.add(t); });   // paredes laterales bajas
}

/* ---------------- Figuras y piezas ---------------- */
// Una pieza es {type:'pieza', fig, i, q, colores?, pintados?, parte?}: fig = figura (null mientras es barro), i = próximo paso de su receta.
const COL={rojo:'#c0262c',amarillo:'#f2c94c',azul:'#2f6b8a',verde:'#2f8a5a'};
const ETCOL={barro:CLAY, masa:'#c98a58', cruda:'#7a4a2a', seca:'#c98a58', cocida:'#b5652f', pintada:'#f4efe3'};
function etapa(pz){ if (!pz.fig) return pz.i>=2?'masa':'barro'; const L=Recetas.datos.figuras[pz.fig].pasos, hecho=k=>{ const n=L.indexOf(k); return n>=0&&n<pz.i; };
  return hecho('pintar')?'pintada':hecho('hornear')?'cocida':hecho('secar')?'seca':'cruda'; }
const lump=(col,r=.28)=>{ const m=new THREE.Mesh(new THREE.IcosahedronGeometry(r,1),new THREE.MeshStandardMaterial({color:col,roughness:.9,flatShading:true})); m.castShadow=true; return m; };
const lathe=(pts,col)=>{ const m=new THREE.Mesh(new THREE.LatheGeometry(pts.map(([x,y])=>new THREE.Vector2(x,y)),12),new THREE.MeshStandardMaterial({color:col,roughness:.85,flatShading:true,side:THREE.DoubleSide})); m.castShadow=true; return m; };
const PERFIL={ matera:[[0,0],[.2,0],[.27,.26],[.3,.28],[.3,.31]], jarron:[[0,0],[.13,0],[.21,.14],[.16,.32],[.08,.42],[.11,.5]], frutero:[[0,0],[.12,0],[.06,.07],[.06,.12],[.26,.2],[.32,.3]] };
function chivaMesh(col,parte,cs=[]){ const g=new THREE.Group();
  if (parte!=='carga'){ const b=boxMesh(.55,.28,.26,mat(cs[0]?COL[cs[0]]:col)); b.position.y=.2; g.add(b); const h=boxMesh(.18,.2,.24,mat('#2f6b8a')); h.position.set(.36,.16,0); g.add(h);
    [[-.2,.14],[.2,.14],[-.2,-.14],[.2,-.14]].forEach(([x,z])=>{ const w=new THREE.Mesh(new THREE.CylinderGeometry(.07,.07,.05,8),mat('#2a1c11')); w.rotation.x=Math.PI/2; w.position.set(x,.08,z); g.add(w); }); }
  if (parte!=='carroceria'){ const rk=boxMesh(.5,.06,.24,mat(cs[1]?COL[cs[1]]:parte==='carga'?col:'#f2c94c')); rk.position.y=parte==='carga'?0:.38; g.add(rk);
    [-.14,.06].forEach(x=>{ const c=boxMesh(.14,.12,.16,mat(col)); c.position.set(x,(parte==='carga'?.06:.44),0); g.add(c); }); }
  g.traverse(o=>{ if (o.isMesh) o.castShadow=true; }); return g; }
function pieceMesh(pz){ const e=etapa(pz), col=ETCOL[e]; if (!pz.fig) return lump(col,.22);
  if (pz.fig==='chiva') return chivaMesh(col,pz.parte,e==='pintada'?pz.colores:(pz.pintados||[]));
  const m=lathe(PERFIL[pz.fig],col); if (e==='pintada'){ const b=new THREE.Mesh(new THREE.CylinderGeometry(.2,.2,.05,12),mat('#c0262c')); b.position.y=.16; m.add(b); } return m; }
function itemMesh(it){ const g=new THREE.Group(), m=pieceMesh(it); m.scale.setScalar(it.fig==='chiva'?.7:.8); m.position.y=it.fig?0:.12; g.add(m); return g; }
const NAMES={barro:'Mina', amasado:'Amasado', torno:'Torno', mesa:'Mesa de modelar', secadero:'Secadero', horno:'Horno', pintura:'Pintura', mostrador:'Mostrador'};
const figNom=f=>Recetas.datos.figuras[f].nombre;
const esMasa=c=>!!c&&!c.fig&&c.i===2;
const pasoNom=pz=>{ const k=Recetas.paso(pz); return k?Recetas.datos.pasos[k]:'Modelar'; };   // la masa (sin figura) sigue en el torno o la mesa
const destino=pz=>{ const k=Recetas.paso(pz); return k?NAMES[Recetas.estacion(k)]:'Torno o Mesa de modelar'; };
const nom=it=> it.fig ? figNom(it.fig)+(it.parte?` (${Recetas.datos.pasos[it.parte].toLowerCase()})`:'') : (it.i>=2?'Barro amasado':'Barro');

/* ---------------- Estaciones (3 columnas: izquierda barro→modelar, medio secar/hornear, derecha pintar/entregar) ---------------- */
const ST=[], colliders=[];
function station(kind,x,z,r,name,mesh,slotY){ const s={kind,x,z,r,name,state:'vacio',t:0,prog:0,pz:null,espera:null,sel:0,color:0,mesh}; ST.push(s); colliders.push({x,z,r}); if (mesh){ mesh.position.set(x,0,z); scene.add(mesh);
    if (slotY!=null){ s.slot=new THREE.Group(); s.slot.position.y=slotY; mesh.add(s.slot); } }
  if (name){ s.el=document.createElement('div'); s.el.className='st'; $('#labels').appendChild(s.el); } return s; }
const tableMesh=(w,d,h=.7,col=WOOD)=>{ const g=new THREE.Group(); const top=boxMesh(w,.12,d,mat(col)); top.position.y=h; g.add(top); [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx,sz])=>{ const l=boxMesh(.1,h,.1,mat(BEAM)); l.position.set(sx*(w/2-.1),0,sz*(d/2-.1)); g.add(l); }); return g; };
const ZA=-4.3, ZM=-.8, ZB=3.3;   // filas: arriba, medio, abajo
// izquierda abajo: mina de arcilla
{ const g=new THREE.Group(); [[0,0,.5],[.5,.2,.38],[-.5,.1,.42],[.1,-.5,.34]].forEach(([x,z,r])=>{ const m=lump(CLAY,r); m.position.set(x,r*.6,z); g.add(m); }); station('barro',-7,ZB,1,'Mina',g); }
// izquierda medio: 2 mesas de amasado
[-8.6,-5.4].forEach(x=>station('amasado',x,ZM,1,'Amasado',tableMesh(1.5,1,.7),.95));
// izquierda arriba: torno · mesa de modelar · torno
[-9.2,-4.6].forEach(x=>{ const g=tableMesh(1.5,1.2,.7); const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.42,.42,.08,16),mat('#5a3a22')); wheel.position.y=.82; g.add(wheel); const s=station('torno',x,ZA,1,'Torno',g,.86); s.wheel=wheel; });
station('mesa',-6.9,ZA,1,'Mesa de modelar',tableMesh(1.6,1.2,.7),.76);
// medio arriba: 2 hornos (arrancan solos al cargar)
[-.3,2.7].forEach(x=>{ const g=new THREE.Group(); const base=boxMesh(1.7,.5,1.5,mat('#9a6a3c')); g.add(base);
  const dome=new THREE.Mesh(new THREE.SphereGeometry(.9,14,8,0,Math.PI*2,0,Math.PI/2),new THREE.MeshStandardMaterial({color:'#b0582f',roughness:.9,flatShading:true})); dome.position.y=.5; dome.scale.set(1,.9,.9); dome.castShadow=true; g.add(dome);
  const door=new THREE.Mesh(new THREE.CircleGeometry(.3,12),new THREE.MeshStandardMaterial({color:'#2a140b'})); door.position.set(0,.85,.82); g.add(door);
  const fire=new THREE.Mesh(new THREE.CircleGeometry(.22,12),new THREE.MeshBasicMaterial({color:'#ff9a2a'})); fire.position.set(0,.85,.83); fire.visible=false; g.add(fire);
  const s=station('horno',x,ZA,1.1,'Horno',g); s.fire=fire; });
// medio abajo: secadero de 3 puestos (un solo letrero, en el del centro)
[-.3,1.2,2.7].forEach((x,i)=>station('secadero',x,ZB,.6,i===1?'Secadero':'',tableMesh(1.3,1.2,.5,'#9a6a3a'),.62));
// derecha arriba y medio: 2 mesas de pintura
[ZA,ZM].forEach(z=>{ const g=tableMesh(1.5,1.1,.7); Object.values(COL).forEach((c,k)=>{ const b=new THREE.Mesh(new THREE.CylinderGeometry(.08,.07,.07,8),mat(c)); b.position.set(-.5+k*.33,.8,.3); g.add(b); }); station('pintura',8,z,1,'Pintura',g,.76); });
// derecha abajo: mostrador (los clientes esperan a su izquierda)
{ const g=new THREE.Group(); const top=boxMesh(3.2,.2,1.1,mat('#8a5a32')); top.position.y=.75; g.add(top); const fr=boxMesh(3.2,.75,.12,mat('#6b3e22')); fr.position.set(0,0,.5); g.add(fr);
  const load=new THREE.Group(); load.position.set(0,.95,-.1); g.add(load); const s=station('mostrador',8.2,3.6,1.6,'Mostrador',g); s.load=load; colliders.pop(); colliders.push({x0:6.6,x1:9.8,z0:3.05,z1:4.15}); }

/* ---------------- Jugadores ---------------- */
const PCOL=['#c8101e','#2f6b8a','#d9ae55','#2f8a5a'];
const players=[];
function makePlayers(list){
  players.forEach(p=>{ scene.remove(p.holder); p.el.remove(); }); players.length=0;
  list.forEach((j,i)=>{
    const holder=new THREE.Group(); const model=Muneco.jugador(j.slot===mySlot()?(PROG.etapa||0):(j.etapa||0), j.avatar==='muneca'); holder.add(model);
    const ring=new THREE.Mesh(new THREE.RingGeometry(.38,.5,24), new THREE.MeshBasicMaterial({color:PCOL[j.slot%4],transparent:true,opacity:.85})); ring.rotation.x=-Math.PI/2; ring.position.y=.02; holder.add(ring);
    const hand=new THREE.Group(); hand.position.set(0,.62,.32); holder.add(hand);
    const x=-.6+i*1.2, z=1.2; holder.position.set(x,0,z); holder.scale.setScalar(1.3); scene.add(holder);
    const el=document.createElement('div'); el.className='pl'; el.style.background=PCOL[j.slot%4]; $('#labels').appendChild(el);
    players.push({i,slot:j.slot,nombre:j.nombre||('J'+(j.slot+1)),holder,model,hand,x,z,tx:x,tz:z,face:Math.PI,carry:null,carryKey:'',el,moving:false,useT:0,useS:null,inp:{x:0,z:0,take:false,use:false,drop:false,useEdge:false}});
  }); }
function setCarry(p,it){ p.carry=it; p.carryKey=it?JSON.stringify(it):''; p.hand.clear(); if (it) p.hand.add(itemMesh(it)); p.model.userData.carry=!!it; }

/* ---------------- Entrada (motor común en estaciones.js) ---------------- */
let E=null;   // se crea tras definir `game` (ver más abajo)
/* ---------------- Estado del juego ---------------- */
const game={on:false,paused:false,mode:'reloj',t:0,score:0,orders:[],repisa:[],nextOrder:0,stats:{piezas:0,especial:0,perdidos:0}};
E=Estaciones.entrada({canvas,camera,game,togglePause:()=>togglePause(),ST,players,mySlot:()=>mySlot(),accion:(p,x)=>accion(p,x),reachOf:x=>reachOf(x),touch,lob:()=>lob});
const { readInput, remote, down, pressed, mouse } = E;
let banTimer, who=null; const evq=[];
const hosting=()=>lob && lob.rol==='host' && game.on;
function snd(n,a){ Sound[n](a); if (hosting()) evq.push({s:n,a}); }
function banner(msg,kind=''){ const to=who; if (hosting()) evq.push({b:msg,k:kind,to}); if (to!==null && to!==mySlot()) return; showBanner(msg,kind); }
function showBanner(msg,kind=''){ const b=$('#banner'); b.textContent=msg; b.className='banner show '+kind; clearTimeout(banTimer); banTimer=setTimeout(()=>b.classList.remove('show'),2600); }
function floatText(txt,x,y,z){ if (hosting()) evq.push({f:txt,x,y,z}); showFloat(txt,x,y,z); }
function showFloat(txt,x,y,z){ const el=document.createElement('div'); el.className='float'; el.textContent=txt; $('#labels').appendChild(el);
  const v=new THREE.Vector3(x,y,z).project(camera); el.style.left=((v.x+1)/2*innerWidth)+'px'; el.style.top=((1-v.y)/2*innerHeight)+'px';
  requestAnimationFrame(()=>{ el.style.transform='translate(-50%,-260%)'; el.style.opacity='0'; }); setTimeout(()=>el.remove(),1100); }
/* ---------------- Pedidos ---------------- */
// Un cliente: {id, fig, colores, left, total, tipo, npc}. La pieza se ata a la figura, no al cliente. Los terminados sin cliente esperan en game.repisa.
const TIPOS=['caficultor','recolectora','catadora','alfarero','pintora','aprendiz'];
const mismos=(a,b)=>String([...(a||[])].sort())===String([...(b||[])].sort());
function pedir(fig,colores){ const t=Recetas.paciencia(players.length), o={id:Math.random(),fig,colores:Recetas.datos.figuras[fig].colores?(colores||Recetas.coloresAzar()):null,left:t,total:t,tipo:TIPOS[Math.floor(Math.random()*TIPOS.length)]};
  game.orders.push(o); const k=game.repisa.findIndex(z=>z.fig===fig&&(!o.colores||mismos(z.colores,o.colores))); if (k>=0) entregar(game.repisa.splice(k,1)[0],o); renderOrders(); }
function addOrder(){ const f=Object.keys(Recetas.datos.figuras); pedir(f[Math.floor(Math.random()*f.length)]); }
// Tarjetas de clientes (botones): figura, n/N, paso siguiente de la pieza mas avanzada de esa figura y barra de paciencia.
function avance(fig){ let b=null; [...players.map(p=>p.carry),...ST.map(s=>s.pz),...game.repisa].forEach(z=>{ if (z&&z.fig===fig&&(!b||z.i>b.i)) b=z; }); return b; }
function datosTarjeta(o){ const F=Recetas.datos.figuras[o.fig], b=avance(o.fig), k=b?Recetas.paso(b):null, i=b?Math.min(b.i,F.pasos.length-1):0;
  return {n:i+1,N:F.pasos.length,sig:b&&k?Recetas.datos.pasos[k]:Recetas.datos.pasos.barro,i}; }
function renderOrders(){ $('#clientes').innerHTML=game.orders.map(o=>`<button type="button" class="cli ${o.fig==='chiva'?'especial':''}" data-id="${o.id}"><span class="t"><b>${figNom(o.fig)}</b><span class="n"></span></span><span class="sig"></span>${game.mode==='reloj'?'<div class="bar"><i></i></div>':''}</button>`).join(''); pintaClientes(); }
const pon=(el,k,v)=>{ if (k==='innerHTML'){ if (el._h!==v){ el._h=v; el.innerHTML=v; } } else if (el[k]!==v) el[k]=v; };   // escribir solo si cambia (no romper la seleccion ni el foco)
function pintaClientes(){ game.orders.forEach(o=>{ const el=$('#clientes').querySelector(`[data-id="${o.id}"]`); if (!el) return; const d=datosTarjeta(o), f=o.left/o.total;
  pon(el.querySelector('.n'),'textContent',d.n+'/'+d.N); pon(el.querySelector('.sig'),'textContent',d.sig);
  const al=`${figNom(o.fig)}${o.colores?' pintada de '+o.colores.join(' y '):''}, paso ${d.n} de ${d.N}, sigue ${d.sig}. Ver receta`; if (el.getAttribute('aria-label')!==al) el.setAttribute('aria-label',al);
  const i=el.querySelector('.bar i'); if (i) i.style.width=Math.max(0,f)*100+'%'; el.classList.toggle('mid',game.mode==='reloj'&&f<.5&&f>=.25); el.classList.toggle('low',game.mode==='reloj'&&f<.25); }); }
/* ---------------- Receta completa ---------------- */
let recId=null, recFig=null, recPausa=false;
function pintaReceta(){ if (!recFig) return; const F=Recetas.datos.figuras[recFig.fig], b=avance(recFig.fig), cur=b?Math.min(b.i,F.pasos.length-1):0, o=game.orders.find(q=>q.id===recId), col=(o&&o.colores)||recFig.colores;
  pon($('#rTitle'),'textContent',F.nombre+' · receta');
  pon($('#rPasos'),'innerHTML',F.pasos.map((k,i)=>`<li class="${i<cur?'hecho':i===cur?'actual':''}"${i===cur?' aria-current="step"':''}>${i<cur?'✓ ':(i+1)+'. '}${k==='pintar'&&col?'Pintar: '+col.join(' y '):Recetas.datos.pasos[k]}</li>`).join(''));
  pon($('#rNota'),'textContent',[F.fuente==='juego'?'Receta del juego':'',players.length===1?'en modo solo el tiempo se detiene':''].filter(Boolean).join(' · ')); }
function abrirReceta(o){ if (!game.on) return; recId=o.id; recFig={fig:o.fig,colores:o.colores}; pintaReceta(); $('#receta').hidden=false;
  if (players.length===1 && !game.paused){ game.paused=true; recPausa=true; } $('#rCerrar').focus(); }
function cerrarReceta(){ if (recId===null) return; recId=null; recFig=null; $('#receta').hidden=true; if (recPausa){ game.paused=false; recPausa=false; } }
$('#clientes').addEventListener('click',e=>{ const b=e.target.closest('.cli'), o=b&&game.orders.find(q=>String(q.id)===b.dataset.id); if (o) abrirReceta(o); });
$('#rCerrar').addEventListener('click',cerrarReceta);
$('#receta').addEventListener('click',e=>{ if (e.target===$('#receta')) cerrarReceta(); });
// cliente de esa figura con menos paciencia; una pieza con colores (chiva) solo va a un cliente de esos mismos colores
function pedidoDe(fig,c){ return game.orders.filter(o=>o.fig===fig&&(!c||!c.colores||mismos(o.colores,c.colores))).sort((a,b)=>a.left-b.left)[0]; }

function nearest(p){ let best=null, bd=1e9; ST.forEach(s=>{ const d=Math.hypot(s.x-p.x,s.z-p.z)-s.r; if (d<reachOf(s)+.05 && d<bd){ bd=d; best=s; } }); return best; }
const reachOf=s=>s.kind==='mostrador'?1.3:.95;
function pick(p){ const s=p.inp.si!=null?ST[p.inp.si]:null; if (s && Math.hypot(s.x-p.x,s.z-p.z)-s.r<reachOf(s)) return s; return nearest(p); }
// Soltar lo que llevas en las manos: se pierde (no se puede recuperar)
function tirar(p){ if (!p.carry){ banner('No llevas nada que soltar'); return; } const n=nom(p.carry); setCarry(p,null); snd('tick'); banner(`Soltaste: ${n} (se perdió)`); }
const eleccion=s=>{ const o=Recetas.figurasPara(s.kind,game.orders); return o.length?o[s.sel%o.length]:null; };   // figura que se va a modelar en el torno o la mesa
// estaciones que reciben una pieza, la trabajan y la devuelven con el paso hecho
const TRABAJO={amasado:['amasando','listo','Aquí se amasa el barro de la mina'], secadero:['secando','seco','Aquí se secan las piezas modeladas'], horno:['quemando','lista','Aquí se hornean las piezas secas'], pintura:['pintando','listo','Aquí se pintan las piezas cocidas']};
const sacable=s=>s.state===TRABAJO[s.kind][1]||s.state==='pasada';
function accion(p,s=nearest(p)){ const c=p.carry; if (!s) return {t:'Acción'};
  const lleno={t:'Manos llenas'};
  switch(s.kind){
    case 'barro': return {t:c?'Manos llenas':'Tomar barro'};
    case 'amasado': if (s.state==='amasando') return {t:'Amasar',hold:true,prog:s.prog}; if (s.state==='listo') return c?lleno:{t:'Sacar masa'}; return {t:c&&Recetas.acepta('amasado',c)?'Echar barro':'Amasado'};
    case 'torno': case 'mesa': {
      if (s.kind==='mesa' && c&&c.parte) return {t:!s.espera?'Dejar parte':s.espera!==c.parte?'Pegar':'Mesa ocupada'};
      if (!esMasa(c)) return {t:NAMES[s.kind]};
      const f=eleccion(s); return f?{t:'Hacer: '+figNom(f),hold:true,prog:s.prog}:{t:'Nadie lo pide'}; }
    case 'secadero': if (s.state==='vacio') return {t:c&&Recetas.acepta('secadero',c)?'Poner a secar':'Secadero'}; if (s.state==='seco') return c?lleno:{t:'Recoger seca'}; return {t:'Secando…'};
    case 'horno': if (s.state==='vacio') return {t:c&&Recetas.acepta('horno',c)?'Cargar pieza':'Horno'}; if (sacable(s)) return c?lleno:{t:'Sacar pieza'}; return {t:'Horneando…'};
    case 'pintura': if (s.state==='pintando') return {t:s.pz.colores?'Pintar '+Recetas.datos.colores[s.color]:'Pintar',hold:true,prog:s.prog}; if (s.state==='listo') return c?lleno:{t:'Recoger'}; return {t:c&&Recetas.acepta('pintura',c)?'Poner pieza':'Pintura'};
    case 'mostrador': return {t:c?'Entregar':game.repisa.length?'Tomar de la repisa':'Entregar'};
  } return {t:'Acción'}; }
function take(p){
  const s=pick(p), c=p.carry; if (!s) return;
  const noVa=()=>banner('Esta pieza ahora va a: '+destino(c));
  switch(s.kind){
    case 'barro': if (c){ banner('Tienes las manos ocupadas'); return; } setCarry(p,{type:'pieza',fig:null,i:1,q:R.calidadBase}); snd('pop',2); return;
    case 'amasado': case 'secadero': case 'horno': case 'pintura': { const [trabajando,,vacio]=TRABAJO[s.kind];
      if (sacable(s) && !c){ setCarry(p,s.pz); Object.assign(s,{pz:null,state:'vacio',t:0,prog:0}); snd('pop',3); return; }
      if (s.state==='vacio' && c){ if (!Recetas.acepta(s.kind,c)){ noVa(); return; }
        if (s.kind==='pintura' && c.fig==='chiva' && !(c.pintados||[]).length){ const o=pedidoDe('chiva'); if (!o){ banner('Ahora nadie pide una chiva: espera un cliente para pintarla'); return; } c.colores=o.colores.slice(); }
        Object.assign(s,{pz:c,state:trabajando,t:0,prog:0,color:0}); setCarry(p,null); snd('pop',1); return; }
      banner(s.state==='vacio'?vacio:sacable(s)?'Tienes las manos ocupadas':{amasando:'Mantén pulsado para amasar',secando:'Se está secando',quemando:'Todavía se hornea',pintando:'Mantén pulsado para pintar'}[s.state]); return; }
    case 'torno': case 'mesa':
      if (s.kind==='mesa' && c&&c.parte){
        if (!s.espera){ s.espera=c.parte; setCarry(p,null); snd('pop',1); banner(`La ${nom(c).toLowerCase()} queda esperando en la Mesa`); return; }
        if (s.espera===c.parte){ banner('Ya hay una parte igual esperando en la Mesa'); return; }
        s.espera=null; snd('pop',4); banner('¡Chiva armada! Ahora va al Secadero');
        setCarry(p,{type:'pieza',fig:'chiva',i:Recetas.datos.figuras.chiva.pasos.indexOf('secar'),q:c.q,pintados:[]}); return; }
      if (!esMasa(c)){ if (c) noVa(); else banner('Trae barro amasado'); return; }
      banner(eleccion(s)?'Mantén pulsado para modelar':'Ningún cliente pide eso aquí'); return;
    case 'mostrador':
      if (!c){ if (game.repisa.length){ setCarry(p,game.repisa.pop()); snd('pop',3); } else banner('Trae una pieza terminada'); return; }
      if (Recetas.paso(c)!=='entregar'){ noVa(); return; }
      deliver(p,c); return;
  } }
function renderRepisa(){ const n=ST.find(s=>s.kind==='mostrador').load, k=JSON.stringify(game.repisa); if (n.userData.k===k) return; n.userData.k=k; n.clear();
  game.repisa.forEach((pz,i)=>{ const m=pieceMesh(pz); m.scale.setScalar(.7); m.position.set(-.5+i*.9,0,0); n.add(m); }); }
function entregar(c,o){
  const pts=Math.max(0,Recetas.datos.figuras[c.fig].puntos+Math.round(R.bono*Math.max(0,o.left)/o.total)-Math.round(Math.max(0,R.calidadBase-c.q)/R.qPorPunto)), q=Math.round(c.q), m=ST.find(s=>s.kind==='mostrador');
  game.orders.splice(game.orders.indexOf(o),1); game.score+=pts; game.stats.piezas++; if (q>=R.especial) game.stats.especial++;
  snd('chime'); floatText('+'+pts,m.x,2.4,m.z); banner(`${figNom(c.fig)} entregada · calidad ${q}`); }
function deliver(p,c){
  const o=pedidoDe(c.fig,c);
  if (o){ setCarry(p,null); entregar(c,o); renderOrders(); return; }
  if (game.repisa.length>=R.repisa){ banner('La repisa del Mostrador está llena'); return; }
  game.repisa.push(c); setCarry(p,null); snd('pop',2); banner(`Nadie pide ${figNom(c.fig).toLowerCase()} ahora: queda en la repisa`); }
// terminar de modelar en el torno o la mesa
function modelar(p,s,f){ const c=p.carry; snd('pop',4);
  if (f!=='chiva'){ setCarry(p,{type:'pieza',fig:f,i:3,q:c.q}); return; }
  const parte=(!s.espera||s.espera==='carga')?'carroceria':'carga';
  if (!s.espera){ s.espera=parte; setCarry(p,null); banner('La carrocería queda esperando en la Mesa: trae barro amasado para la carga'); return; }
  setCarry(p,{type:'pieza',fig:'chiva',i:Recetas.datos.figuras.chiva.pasos.indexOf(parte)+1,parte,q:c.q}); banner('Toca Acción para pegar las dos partes'); }
function pintar(s){ const pz=s.pz, cs=pz.colores;
  if (cs){ const col=Recetas.datos.colores[s.color];
    if (!cs.includes(col)){ banner(`El cliente pidió ${cs.join(' y ')}`); snd('tick'); return; }
    pz.pintados=(pz.pintados||[]).filter(x=>x!==col).concat(col); if (!cs.every(x=>pz.pintados.includes(x))){ snd('pop',2); banner(`Listo el ${col}: falta ${cs.filter(x=>!pz.pintados.includes(x)).join(' y ')}`); return; } }
  s.pz=Recetas.avanza(pz); s.state='listo'; snd('pop',4); }
// mantener Acción: amasar, modelar o pintar (un toque corto, en cambio, alterna figura o color: ver tocar)
function use(p,dt){
  const s=pick(p); if (p.useS && p.useS!==s && p.useS.state==='modelando') Object.assign(p.useS,{state:'vacio',prog:0});   // se alejó sin soltar
  if (!s) return; p.useT+=dt; p.useS=s; if (p.useT<R.toque) return;
  if (s.kind==='amasado' && s.state==='amasando'){ s.prog+=dt/R.amasar; if (Math.random()<dt*3) snd('footstep'); if (s.prog>=1){ s.state='listo'; s.prog=0; s.pz=Recetas.avanza(s.pz); snd('pop',4); } }
  else if ((s.kind==='torno'||s.kind==='mesa') && esMasa(p.carry)){ const f=eleccion(s); if (!f) return; s.state='modelando'; s.prog+=dt/R.modelar; if (s.wheel) s.wheel.rotation.y+=dt*8; if (s.prog>=1){ s.state='vacio'; s.prog=0; modelar(p,s,f); } }
  else if (s.kind==='pintura' && s.state==='pintando'){ s.prog+=dt/R.pintar; if (s.prog>=1){ s.prog=0; pintar(s); } }
}
function tocar(p,s){ if (!s) return;
  if ((s.kind==='torno'||s.kind==='mesa') && esMasa(p.carry)){ const o=Recetas.figurasPara(s.kind,game.orders); if (o.length>1){ s.sel=(s.sel+1)%o.length; s.prog=0; s.state='vacio'; snd('tick'); } else if (o.length) banner('Mantén pulsado para modelar'); }
  else if (s.kind==='pintura' && s.state==='pintando'){ if (s.pz.colores){ s.color=(s.color+1)%Recetas.datos.colores.length; snd('tick'); } else banner('Mantén pulsado para pintar'); }
  else if (s.kind==='amasado' && s.state==='amasando') banner('Mantén pulsado para amasar'); }

/* ---------------- Vistas de las estaciones (las usan el anfitrión y los invitados) ---------------- */
const NPC=new Map(), SLOT_X=[5.6,4.5,3.4], NPC_Z=4.7;   // clientes: esperan a la izquierda del Mostrador, entran y salen por la derecha
function vistaClientes(dt){
  game.orders.forEach((o,i)=>{ let e=NPC.get(o.id); if (!e){ const m=Muneco.npc(o.tipo||TIPOS[0]), h=new THREE.Group(); h.add(m); h.position.set(AW+1.5,0,NPC_Z); h.rotation.y=-Math.PI/2; scene.add(h); e={h,m}; NPC.set(o.id,e); } e.tx=SLOT_X[i%3]; e.out=false; o.npc=e.h; });
  NPC.forEach((e,id)=>{ if (!game.orders.some(o=>o.id===id)){ e.tx=AW+1.5; e.out=true; }
    const dx=e.tx-e.h.position.x, mov=Math.abs(dx)>.05; if (mov) e.h.position.x+=Math.sign(dx)*Math.min(Math.abs(dx),2.6*dt);
    let d=(mov?Math.sign(dx)*Math.PI/2:Math.PI/2)-e.h.rotation.y; d=Math.atan2(Math.sin(d),Math.cos(d)); e.h.rotation.y+=d*Math.min(1,dt*10);
    Muneco.animar(e.m,dt,mov,S.motion); if (e.out && !mov){ scene.remove(e.h); NPC.delete(id); } }); }
function vistas(dt){
  vistaClientes(dt); renderRepisa();
  ST.forEach(s=>{
    if (s.slot){ const pz=(s.kind==='torno'||s.kind==='mesa')?(s.state==='modelando'?{fig:null,i:2}:s.espera?{fig:'chiva',i:3,parte:s.espera}:null):s.pz, k=pz?JSON.stringify(pz):'';
      if (s.slot.userData.k!==k){ s.slot.clear(); if (pz){ const m=pieceMesh(pz); m.scale.setScalar(pz.fig==='chiva'?.9:1); s.slot.add(m); } s.slot.userData.k=k; } }
    if (s.kind==='torno' && s.state==='modelando') s.wheel.rotation.y+=dt*3;
    if (s.kind==='horno') s.fire.visible=s.state!=='vacio';
  });
}

/* ---------------- Simulación ---------------- */
const PR=.32;
function collide(p){
  for (const c of colliders){
    if (c.r!==undefined){ const dx=p.x-c.x, dz=p.z-c.z, d=Math.hypot(dx,dz), m=c.r+PR; if (d<m && d>1e-4){ p.x=c.x+dx/d*m; p.z=c.z+dz/d*m; } }
    else if (p.x>c.x0-PR && p.x<c.x1+PR && p.z>c.z0-PR && p.z<c.z1+PR){ const o=[[p.x-(c.x0-PR),'x',c.x0-PR],[(c.x1+PR)-p.x,'x',c.x1+PR],[p.z-(c.z0-PR),'z',c.z0-PR],[(c.z1+PR)-p.z,'z',c.z1+PR]].sort((a,b)=>a[0]-b[0]); p[o[0][1]]=o[0][2]; } }
  players.forEach(q=>{ if (q===p) return; const dx=p.x-q.x, dz=p.z-q.z, d=Math.hypot(dx,dz); if (d<.6 && d>1e-4){ p.x=q.x+dx/d*.6; p.z=q.z+dz/d*.6; } });
  p.x=Math.max(-AW+.4,Math.min(AW-.4,p.x)); p.z=Math.max(-AD+.5,Math.min(AD-.4,p.z)); }
function step(dt){
  game.t+=dt; const T=game.t;
  // pedidos
  if (game.mode==='reloj'){ game.orders.forEach(o=>o.left-=dt); const lost=game.orders.filter(o=>o.left<=0);
    if (lost.length){ lost.forEach(o=>{ game.orders.splice(game.orders.indexOf(o),1); game.score+=R.pts.perdido; game.stats.perdidos++; }); banner('Se fue un cliente: pedido perdido'); renderOrders(); } }
  game.nextOrder-=dt; if (game.nextOrder<=0 && game.orders.length<Recetas.maxClientes(players.length)){ addOrder(); game.nextOrder=R.clienteCada; }
  // jugadores
  players.forEach(p=>{ const I=p.inp; const l=Math.hypot(I.x,I.z), moving=l>.15; p.moving=moving; who=p.slot;
    if (moving){ const sp=4.6*Math.min(1,l)*(p.carry?.92:1); p.x+=I.x/Math.max(1,l)*sp*dt; p.z+=I.z/Math.max(1,l)*sp*dt; collide(p); p.face=Math.atan2(I.x,I.z); }
    p.holder.position.set(p.x,0,p.z); let d=p.face-p.holder.rotation.y; d=Math.atan2(Math.sin(d),Math.cos(d)); p.holder.rotation.y+=d*Math.min(1,dt*14);
    Muneco.animar(p.model,dt,moving,S.motion);
    if (I.take) take(p); if (I.drop) tirar(p);
    if (I.use) use(p,dt); else if (p.useT){ const s=p.useS; if (p.useT<R.toque) tocar(p,s); if (s && s.state==='modelando') Object.assign(s,{state:'vacio',prog:0}); p.useT=0; }   /* soltar a mitad: el torno o la mesa quedan libres y la masa sigue en la mano */ who=null; });
  // estaciones
  ST.forEach(s=>{
    if (s.kind==='secadero' && s.state==='secando'){ s.prog+=dt/R.secado; if (s.prog>=1){ s.state='seco'; s.pz=Recetas.avanza(s.pz); snd('pop',5); } }
    if (s.kind==='horno'){
      if (s.state==='quemando'){ s.t+=dt; if (s.t>=R.quema){ s.state='lista'; s.t=0; s.pz=Recetas.avanza(s.pz); snd('pop',5); } }
      else if (s.state==='lista'){ s.t+=dt; if (s.t>=R.ventana){ s.state='pasada'; banner('¡Se está quemando una pieza en el horno!'); } }
      else if (s.state==='pasada'){ s.pz.q=Math.max(0,s.pz.q-R.pasadaPorSeg*dt); } }
  });
  vistas(dt);
  // fin
  if (game.mode==='reloj' && T>=R.duracion) finish();
}

/* ---------------- Red: estado del anfitrión y vista de los invitados ---------------- */
const r1=n=>Math.round(n*100)/100;
function snapshot(){ return { t:r1(game.t), sc:game.score, mo:game.mode, st:game.stats,
  o:game.orders.map(o=>[o.fig,r1(o.left),o.total,o.colores||0,o.id,o.tipo]), rp:game.repisa,
  p:players.map(p=>[r1(p.x),r1(p.z),r1(p.face),p.moving?1:0,p.carryKey]),
  s:ST.map(s=>[s.state,r1(s.t||0),r1(s.prog||0),s.pz?JSON.stringify(s.pz):'',s.espera||'',s.sel,s.color]), ev:evq.splice(0) }; }
let ordKey='';
function applySnapshot(d){
  game.t=d.t; game.score=d.sc; game.mode=d.mo; game.stats=d.st;
  game.orders=d.o.map(([fig,left,total,colores,id,tipo])=>({fig,left,total,colores:colores||null,id,tipo})); game.repisa=d.rp||[]; const k=d.o.map(o=>o[4]).join(); if (k!==ordKey){ ordKey=k; renderOrders(); }
  d.p.forEach((a,i)=>{ const p=players[i]; if (!p) return; p.tx=a[0]; p.tz=a[1]; p.face=a[2]; p.moving=!!a[3]; if (a[4]!==p.carryKey) setCarry(p,a[4]?JSON.parse(a[4]):null); });
  d.s.forEach((a,i)=>{ const s=ST[i]; [s.state,s.t,s.prog,s.sel,s.color]=[a[0],a[1],a[2],a[5],a[6]]; s.espera=a[4]||null; if (a[3]!==(s.pz?JSON.stringify(s.pz):'')) s.pz=a[3]?JSON.parse(a[3]):null; });
  (d.ev||[]).forEach(e=>{ if (e.s) Sound[e.s](e.a); if (e.b!==undefined && (e.to===null||e.to===undefined||e.to===mySlot())) showBanner(e.b,e.k); if (e.f) showFloat(e.f,e.x,e.y,e.z); });
}
function clientFrame(dt){
  players.forEach(p=>{ p.x+=(p.tx-p.x)*Math.min(1,dt*12); p.z+=(p.tz-p.z)*Math.min(1,dt*12); p.holder.position.set(p.x,0,p.z);
    let d=p.face-p.holder.rotation.y; d=Math.atan2(Math.sin(d),Math.cos(d)); p.holder.rotation.y+=d*Math.min(1,dt*14); Muneco.animar(p.model,dt,p.moving,S.motion); });
  vistas(dt);
}

/* ---------------- Etiquetas ---------------- */
const v3=new THREE.Vector3();
function project(x,y,z){ v3.set(x,y,z).project(camera); return [(v3.x+1)/2*innerWidth,(1-v3.y)/2*innerHeight]; }
const LABEL_Y={barro:1.3,amasado:1.5,torno:1.6,mesa:1.6,secadero:1.4,horno:2.0,pintura:1.5,mostrador:1.9};
function labels(){
  const chica=innerWidth<700||innerHeight<520, yo_=players.find(q=>q.slot===mySlot()), cerca=yo_?nearest(yo_):null;
  ST.forEach(s=>{ if (!s.el) return; let txt='', bar=null, cls='';
    if (s.kind==='barro') txt='Toma barro';
    if (s.kind==='amasado'){ txt={vacio:'Trae barro',amasando:'Mantén pulsado',listo:'¡Masa lista!'}[s.state]; if (s.state==='amasando') bar=s.prog; if (s.state==='listo') cls='ok'; }
    if (s.kind==='torno'||s.kind==='mesa'){ const f=yo_&&esMasa(yo_.carry)?eleccion(s):null; txt=f?'Hacer: '+figNom(f):'Trae barro amasado'; if (s.state==='modelando') bar=s.prog;
      if (s.espera){ txt+=` · espera ${Recetas.datos.pasos[s.espera].toLowerCase()}`; cls='warn'; } }
    if (s.kind==='secadero'){ const L=ST.filter(q=>q.kind==='secadero'), n=k=>L.filter(q=>q.state===k).length, sec=L.filter(q=>q.state==='secando');
      txt=[n('secando')&&n('secando')+' secando', n('seco')&&n('seco')+' seca'+(n('seco')>1?'s':''), n('vacio')&&n('vacio')+' libre'+(n('vacio')>1?'s':'')].filter(Boolean).join(' · '); if (sec.length) bar=Math.max(...sec.map(q=>q.prog)); if (n('seco')) cls='ok'; }
    if (s.kind==='horno'){ txt={vacio:'Vacío',quemando:'Horneando',lista:'¡Lista! Sácala',pasada:'¡Se quema! Sácala ya'}[s.state]; if (s.state==='quemando') bar=s.t/R.quema; if (s.state==='lista'){ bar=1-s.t/R.ventana; cls='ok'; } if (s.state==='pasada') cls='bad'; }
    if (s.kind==='pintura'){ txt={vacio:'Trae una pieza cocida',pintando:'Mantén pulsado',listo:'¡Pintada! Recógela'}[s.state];
      if (s.state==='pintando'){ bar=s.prog; if (s.pz.colores) txt=`Color: ${Recetas.datos.colores[s.color]} · pide ${s.pz.colores.join(' y ')}`; } if (s.state==='listo') cls='ok'; }
    if (s.kind==='mostrador') txt='Entrega aquí';
    if (chica && s!==cerca && !(s.kind==='secadero'&&cerca&&cerca.kind==='secadero')) txt='';
    s.el.className='st '+cls+(chica&&!txt?' min':''); s.el.innerHTML=`<b>${s.name}</b>${txt}${bar!==null&&txt?`<div class="bar"><i style="width:${Math.max(0,Math.min(1,bar))*100}%"></i></div>`:''}`;
    const [x,y]=project(s.x,LABEL_Y[s.kind]||1.5,s.z); s.lx=x; s.ly=y; });
  players.forEach(p=>{ const [x,y]=project(p.x,0,p.z+.35); p.el.style.left=x+'px'; p.el.style.top=y+'px';
    p.el.textContent=p.nombre+(p.slot===mySlot()&&players.length>1?' (tú)':'')+(p.carry?` · ${nom(p.carry)} · sigue ${pasoNom(p.carry)}`:''); });
  Estaciones.colocarLetreros(ST,undefined,players.map(p=>p.el));
  Estaciones.botonAccion(players.find(q=>q.slot===mySlot()),accion,touch);
  const m=Math.max(0,game.mode==='reloj'?R.duracion-game.t:game.t), mm=Math.floor(m/60), ss=Math.floor(m%60);
  $('#time').textContent=`${mm}:${String(ss).padStart(2,'0')}`; $('#time').classList.toggle('low',game.mode==='reloj'&&m<30);
  $('#pts').textContent=`${game.score} puntos`;
}

/* ---------------- Cámara y bucle ---------------- */
const CAM={y:15.5,z:11.5,mira:.4};
let camK=1, camX=0;
function followCam(snap,dt){ const hw=Math.tan(19*Math.PI/180)*camera.aspect*Math.hypot(CAM.y,CAM.z)*camK, lim=AW>hw-.6?AW-hw+1.2:0, p=players.find(q=>q.slot===mySlot()), tx=p?Math.max(-lim,Math.min(lim,p.x)):0;
  camX=snap?tx:camX+(tx-camX)*Math.min(1,(dt||0)*5); camera.position.set(camX,CAM.y*camK,CAM.z*camK+CAM.mira); camera.lookAt(camX,0,CAM.mira); }
function resize(){ renderer.setSize(innerWidth,innerHeight,false); camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix();
  const dpr=Math.min(devicePixelRatio||1,2); renderer.setPixelRatio(S.quality==='alta'?dpr:S.quality==='media'?Math.min(dpr,1.5):1);
  sun.castShadow=!!S.shadows && S.quality!=='baja';
  camK=Math.max(1,Math.min(1.75/camera.aspect,1.8)); followCam(true); }
addEventListener('resize',resize);
let last=performance.now(), lastSend=0;
function frame(now){
  const dt=Math.min((now-last)/1000,1/20); last=now;
  const rol=lob?lob.rol:'solo';
  if (game.on && rol==='cliente'){ readInput(); clientFrame(dt); }
  else if (game.on && !(game.paused && (rol==='solo'||players.length===1))){ readInput(); step(dt);
    if (rol==='host' && now-lastSend>66){ lastSend=now; lob.difundir({t:'estado',s:snapshot()}); } }
  else players.forEach(p=>Muneco.animar(p.model,dt,false,S.motion));
  if (game.on){ pintaClientes(); if (recId!==null) pintaReceta(); }
  followCam(false,dt); labels(); renderer.render(scene,camera); requestAnimationFrame(frame);
}

/* ---------------- Menús y sala ---------------- */
let MODE='reloj', lob=null;
const yo=()=>({slot:0,nombre:Guardado.perfil().nombre,avatar:Guardado.perfil().avatar||S.avatar||'muneco',etapa:PROG.etapa||0});
function mySlot(){ return lob ? lob.slot : 0; }
function syncStart(){
  const rol=lob?lob.rol:'solo', n=lob?lob.jugadores.length:1;
  $$('#optMode button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.v===MODE)); $('#modeRow').hidden = rol==='cliente';
  const go=$('#goBtn'); go.hidden = rol==='cliente';
  go.disabled = rol==='host' && !lob.code; go.textContent = rol==='host' ? `Empezar con ${n} jugador${n>1?'es':''}` : 'Empezar';
  const lines=['Moverse: <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> o flechas · acción: <kbd>E</kbd>, <kbd>Espacio</kbd> o <kbd>Enter</kbd> (para amasar, modelar o pintar, mantenla pulsada) · soltar lo que llevas (se pierde): <kbd>G</kbd>, <kbd>X</kbd> o clic derecho<br>Con ratón: clic en el suelo para caminar, clic en una estación para tomar o soltar, mantén el clic para usarla · también con mando'];
  if (touch) lines.unshift('En pantalla táctil: palanca a la izquierda, a la derecha el botón de acción (cambia según donde estés; para amasar, modelar o pintar mantenlo pulsado) y Soltar.');
  lines.push(n===1 ? 'Jugando solo, ningún paso necesita a otra persona.' : 'En equipo pueden repartirse las estaciones: unos amasan, otros modelan, hornean o pintan.');
  $('#keysHelp').innerHTML=lines.join('<br>');
  makePlayers(lob && rol!=='solo' ? lob.jugadores : [yo()]); }
$('#optMode').addEventListener('click',e=>{ const b=e.target.closest('button'); if (!b) return; MODE=b.dataset.v; syncStart(); snd('tick'); });
function reset(list){
  Object.assign(game,{t:0,score:0,orders:[],repisa:[],nextOrder:0,stats:{piezas:0,especial:0,perdidos:0},mode:MODE});
  ST.forEach(s=>{ Object.assign(s,{state:'vacio',t:0,prog:0,pz:null,espera:null,sel:0,color:0}); if (s.load) s.load.clear(); });
  makePlayers(list); NPC.forEach(e=>scene.remove(e.h)); NPC.clear(); renderOrders(); }
function begin(list){
  reset(list); if (!lob || lob.rol!=='cliente'){ for (let i=players.length===1?2:Recetas.maxClientes(players.length);i>0;i--) addOrder(); game.nextOrder=R.clienteCada; }
  $('#start').hidden=true; $('#end').hidden=true; game.on=true; game.paused=false; $('#touch').hidden=false; $('#touch').classList.toggle('pc',!touch); if (!touch) $('#tDrop').innerHTML='Soltar<br><kbd>G</kbd>';
  Sound.init(); Sound.apply(); Sound.fast=true; Sound.startMusic(); showBanner(game.mode==='reloj'?'¡A trabajar el barro! Tienen 3 minutos':'Modo tranquilo: sin reloj'); canvas.focus(); }
$('#goBtn').addEventListener('click',()=>{
  if (lob && lob.rol==='host'){ const list=lob.empezar(); lob.difundir({t:'cfg',mode:MODE}); begin(list); }
  else begin([yo()]); });
$('#again').addEventListener('click',()=>{ if (lob && lob.rol==='host'){ lob.ir('alfareria.html'); return; } $('#end').hidden=true; $('#start').hidden=false; syncStart(); });
$('#nextBtn').addEventListener('click',e=>{ if (lob && lob.rol==='host'){ e.preventDefault(); lob.ir('carrera.html'); } });
function togglePause(){ if (recId!==null){ cerrarReceta(); return; } game.paused=!game.paused; $('#pause').hidden=!game.paused; if (game.paused) $('#resume').focus(); }
$('#pauseBtn').addEventListener('click',()=>{ if (game.on) togglePause(); });
$('#resume').addEventListener('click',togglePause);
$('#endNow').addEventListener('click',()=>{ $('#pause').hidden=true; game.paused=false; if (lob && lob.rol==='cliente') return; finish(); });
$('#soundBtn').addEventListener('click',()=>{ S.mute=!S.mute; save(); Sound.init(); Sound.apply(); Sound.startMusic(); $('#waves').style.display=S.mute?'none':''; });
$('#waves').style.display=S.mute?'none':'';
function finish(r){
  if (r){ game.score=r.sc; game.stats=r.st; game.mode=r.mo; }
  cerrarReceta(); game.on=false; $('#touch').hidden=true; Sound.fast=false; const mult=1+.25*(players.length-1);
  if (lob && lob.rol==='host') lob.difundir({t:'fin',r:{sc:game.score,st:game.stats,mo:game.mode}});
  const stars=R.estrellas.filter(x=>game.score>=x*mult).length;
  $('#stars').innerHTML=[0,1,2].map(i=>i<stars?'★':'<span class="off">★</span>').join(''); $('#stars').setAttribute('aria-label',`${stars} de 3 estrellas`);
  $('#results').innerHTML=`<div><b>${game.score}</b><span>puntos</span></div><div><b>${game.stats.piezas}</b><span>piezas entregadas</span></div><div><b>${game.stats.especial}</b><span>de calidad especial</span></div><div><b>${game.stats.perdidos}</b><span>pedidos perdidos</span></div>`;
  $('#endText').textContent = stars===3 ? 'Taller de maestros: los clientes se fueron contentos con sus piezas. Ganaste ventaja para la trivia.' : stars>=1 ? 'Buen trabajo. Sigan la receta de cada pieza y saquen las piezas del horno a tiempo para subir la calidad.' : 'Se perdieron muchos pedidos. Repartan las estaciones entre todos y sigan la receta de cada pieza.';
  if (game.mode==='reloj'){ PROG.fabrica=Math.max(PROG.fabrica||0,stars); saveProg(); }
  const cli = lob && lob.rol==='cliente'; $('#again').hidden=cli; $('#nextBtn').hidden=cli; $('#waitHost').hidden=!cli;
  $('#end').hidden=false; (cli?$('#end a'):$('#again')).focus(); }

/* ---------------- Arranque ---------------- */
(async()=>{
  try { const r=await fetch('data/recetas2.json'); if (!r.ok) throw 0; Recetas.usar(await r.json()); }
  catch(e){ fail('No se pudieron cargar las recetas (data/recetas2.json). Si abriste el archivo con doble clic, ábrelo desde un servidor web o desde GitHub Pages.'); return; }
  await Promise.race([document.fonts.load('700 28px "Alegreya SC"').catch(()=>{}), new Promise(r=>setTimeout(r,2000))]);
  lob = Red.sala($('#sala'), { nombre:yo().nombre, avatar:yo().avatar,
    onCambio:()=>{ if (!game.on) syncStart(); },
    onEmpezar:(list)=>{ begin(list); },
    onMensaje:(d,slot)=>{
      if (lob.rol==='host'){ if (d.t==='in'){ const r=remote[slot]||(remote[slot]={ptk:d.tk,pue:d.ue,pdr:d.dr}); Object.assign(r,{x:d.x,z:d.z,u:d.u,tk:d.tk,ue:d.ue,dr:d.dr,si:d.si}); } return; }
      if (d.t==='cfg'){ MODE=d.mode; game.mode=d.mode; }
      else if (d.t==='estado') applySnapshot(d.s);
      else if (d.t==='fin'){ finish(d.r); } },
    onSalida:(slot)=>{ delete remote[slot]; const p=players.find(q=>q.slot===slot); if (p && game.on){ p.nombre+=' (salió)'; showBanner('Un jugador salió de la sala'); } },
    onCierre:()=>{ if (game.on){ game.on=false; showBanner('Se cerró la sala del anfitrión'); } $('#end').hidden=true; $('#start').hidden=false; },
  });
  resize(); syncStart(); renderOrders(); requestAnimationFrame(frame); $('#goBtn').focus();
  if (location.hash==='#prueba'){ begin([yo()]); window.__a={setLob:v=>{lob=v;},game,players,ST,take,use,step,R,camera,setCarry,tirar,accion,nearest,pedir,begin,reset,snapshot,applySnapshot,Recetas,colliders}; }
})();
})();
