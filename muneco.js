/* muneco.js — muñecos de papel plegado en 3D para "Saberes de Laboyos".
   Muneco.jugador(etapa, fem): 0 inicio · 1 café · 2 alfarería · 3 caballos · 4 música y danza
   Muneco.npc('caficultor' | 'recolectora' | 'catadora' | 'alfarero' | 'pintora' | 'aprendiz')
   Muneco.animar(modelo, dt, caminando, quieto) y Muneco.retrato(fnQueConstruye) -> dataURL.
   Requiere Three.js r128. */
(() => {
'use strict';
/* -------- Papel -------- */
const mk=(w,h)=>{ const c=document.createElement('canvas'); c.width=w; c.height=h; return c; };
const rnd=(a,b)=>a+Math.random()*(b-a);
function fiberCanvas(base){ const c=mk(256,256), g=c.getContext('2d'); g.fillStyle=base; g.fillRect(0,0,256,256);
  for (let i=0;i<900;i++){ const x=rnd(0,256),y=rnd(0,256),a=rnd(0,Math.PI),l=rnd(2,9);
    g.strokeStyle=Math.random()<.5?`rgba(255,255,255,${rnd(.15,.45)})`:`rgba(60,35,10,${rnd(.05,.18)})`; g.lineWidth=rnd(.5,1.2);
    g.beginPath(); g.moveTo(x,y); g.lineTo(x+Math.cos(a)*l,y+Math.sin(a)*l); g.stroke(); } return c; }
const tex=(c,rep=1)=>{ const t=new THREE.CanvasTexture(c); t.encoding=THREE.sRGBEncoding; t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(rep,rep); t.anisotropy=8; return t; };
const PAPER=tex(fiberCanvas('#f4efe4'),1);
const STRAW=(()=>{ const c=mk(256,256), g=c.getContext('2d'); g.fillStyle='#e2b65a'; g.fillRect(0,0,256,256);
  for (let r=4;r<190;r+=7){ g.strokeStyle=r%14?'#c99a3e':'#f0cd7a'; g.lineWidth=3; g.beginPath(); g.arc(128,128,r,0,7); g.stroke(); }
  for (let a=0;a<64;a++){ g.strokeStyle='rgba(150,105,40,.35)'; g.lineWidth=1; g.beginPath(); g.moveTo(128,128); g.lineTo(128+Math.cos(a/10)*190,128+Math.sin(a/10)*190); g.stroke(); }
  return tex(c); })();
const WEAVE=(()=>{ const c=mk(128,128), g=c.getContext('2d'); const cols=['#c0262c','#f2c94c','#2f6b8a','#f4efe4','#2f8a5a','#e07a2b'];
  for (let y=0;y<128;y+=10){ g.fillStyle=cols[(y/10)%cols.length]; g.fillRect(0,y,128,10); g.fillStyle='rgba(0,0,0,.15)'; for(let x=0;x<128;x+=8) g.fillRect(x,y+((x/8)%2)*5,4,5); }
  return tex(c); })();
const PONCHO=(()=>{ const c=mk(128,128), g=c.getContext('2d'); g.fillStyle='#e9dcc0'; g.fillRect(0,0,128,128);
  [[8,10,'#2a1c11'],[22,6,'#c8101e'],[100,6,'#c8101e'],[112,10,'#2a1c11'],[56,16,'#c8101e']].forEach(([x,w,c])=>{ g.fillStyle=c; g.fillRect(x,0,w,128); }); return tex(c); })();
const DENIM=tex(fiberCanvas('#3d5a80'),2);

const mats={};
function mat(color, map=PAPER){ const k=color+(map?map.uuid:''); if (!mats[k]) mats[k]=new THREE.MeshStandardMaterial({color, map, flatShading:true, roughness:.95, metalness:0}); return mats[k]; }
const FOLD=new THREE.LineBasicMaterial({color:'#fff6e2', transparent:true, opacity:.5});
function piece(geo, m, {folds=true}={}){ const mesh=new THREE.Mesh(geo,m); mesh.castShadow=true; mesh.receiveShadow=true;
  if (folds){ mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo,25),FOLD)); } return mesh; }
const SKIN='#b07a52', HAIR='#2a1c11', RED='#c8101e';
const FLORAL=(()=>{ const c=mk(256,256), g=c.getContext('2d'); g.fillStyle='#d6336c'; g.fillRect(0,0,256,256);
  const cols=['#f2c94c','#ffffff','#2f8a5a','#e07a2b','#7b2ff2'];
  for(let i=0;i<40;i++){ const x=rnd(0,256),y=rnd(0,256),r=rnd(6,12),c2=cols[i%cols.length];
    for(let k=0;k<5;k++){ const a=k/5*Math.PI*2; g.fillStyle=c2; g.beginPath(); g.arc(x+Math.cos(a)*r*.6,y+Math.sin(a)*r*.6,r*.45,0,7); g.fill(); }
    g.fillStyle='#f2c94c'; g.beginPath(); g.arc(x,y,r*.3,0,7); g.fill(); } return tex(c,1); })();
function flower(col,r=.035){ const f=new THREE.Group(); for(let k=0;k<5;k++){ const a=k/5*Math.PI*2; const p=new THREE.Mesh(new THREE.IcosahedronGeometry(r*.55,0),mat(col)); p.position.set(Math.cos(a)*r*.6,Math.sin(a)*r*.6,0); f.add(p); }
  const c=new THREE.Mesh(new THREE.IcosahedronGeometry(r*.4,0),mat('#f2c94c')); c.position.z=r*.2; f.add(c); return f; }
function hat(band='#2a1c11'){ const h=new THREE.Group();
  h.add(piece(new THREE.CylinderGeometry(.36,.36,.018,16), mat('#ffffff',STRAW)));
  const crown=piece(new THREE.CylinderGeometry(.13,.16,.15,10), mat('#e2b65a')); crown.position.y=.083; h.add(crown);
  const b=piece(new THREE.CylinderGeometry(.163,.163,.035,10), mat(band),{folds:false}); b.position.y=.03; h.add(b); return h; }
function mochila(){ const g=new THREE.Group(); const m=piece(new THREE.CylinderGeometry(.12,.11,.24,8), mat('#ffffff',WEAVE)); m.scale.z=.45; g.add(m);
  const rim=piece(new THREE.TorusGeometry(.11,.012,4,12), mat(RED),{folds:false}); rim.rotation.x=Math.PI/2; rim.scale.y=.45; rim.position.y=.12; g.add(rim); return g; }


const faceCache={};
function faceTex(o){ const k=JSON.stringify(o); if (faceCache[k]) return faceCache[k];
  const c=mk(256,256), g=c.getContext('2d'); const ink='#2a1810';
  // mejillas
  g.fillStyle='rgba(232,120,110,.45)'; [[62,158],[194,158]].forEach(([x,y])=>{ g.beginPath(); g.ellipse(x,y,22,14,0,0,7); g.fill(); });
  // ojos grandes con brillo
  [[90,124],[166,124]].forEach(([x,y])=>{ g.fillStyle=ink; g.beginPath(); g.ellipse(x,y,19,23,0,0,7); g.fill();
    g.fillStyle='#fff'; g.beginPath(); g.arc(x+6,y-9,7.5,0,7); g.fill(); g.beginPath(); g.arc(x-5,y+6,2.6,0,7); g.fill();
    if (o.lashes){ g.strokeStyle=ink; g.lineWidth=4; g.lineCap='round'; const s=x<128?-1:1; g.beginPath(); g.moveTo(x+s*12,y-12); g.lineTo(x+s*22,y-20); g.stroke(); } });
  // cejas arriba, suaves
  g.strokeStyle=o.brow||ink; g.lineWidth=o.brow?7:5; g.lineCap='round';
  [[92,86],[164,86]].forEach(([x,y])=>{ g.beginPath(); g.arc(x,y+22,20,-Math.PI*.78,-Math.PI*.22); g.stroke(); });
  // bigote
  if (o.mustache){ g.fillStyle=o.brow; g.beginPath(); g.ellipse(112,166,22,9,.25,0,7); g.fill(); g.beginPath(); g.ellipse(144,166,22,9,-.25,0,7); g.fill(); }
  // sonrisa
  g.strokeStyle=ink; g.lineWidth=6; g.beginPath(); g.arc(128,(o.mustache?170:160),24,Math.PI*.15,Math.PI*.85); g.stroke();
  g.fillStyle='rgba(120,60,40,.35)'; g.beginPath(); g.ellipse(128,146,6,4,0,0,7); g.fill(); // nariz
  const t=new THREE.CanvasTexture(c); t.encoding=THREE.sRGBEncoding; t.anisotropy=8; return faceCache[k]=t; }
function addFace(skull,o){ const geo=new THREE.SphereGeometry(.1765,24,16,Math.PI/2-.75,1.5,Math.PI/2-.7,1.3);
  const m=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({map:faceTex(o),transparent:true,depthWrite:false,roughness:.9}));
  m.renderOrder=2; skull.add(m); }

/* Piezas base compartidas por jugador y NPC */
function base(o){
  // o: {legMat, shoe, sole, torso, torsoW, belly, skirt, skirtTex, apron, shirtArm, shortSleeve, puff, hair, hairStyle, cap, hatOn, scarfHead, older, lashes, earrings}
  const root=new THREE.Group(), body=new THREE.Group(); root.add(body);
  const legs=[], arms=[];
  [-1,1].forEach(s=>{ const hip=new THREE.Group(); hip.position.set(s*.075,.42,0);
    const leg=piece(new THREE.CylinderGeometry(.055,.048,.34,5), o.legMat); leg.position.y=-.17; hip.add(leg);
    const shoe=piece(new THREE.BoxGeometry(.1,.07,.17), mat(o.shoe)); shoe.position.set(0,-.36,.025); hip.add(shoe);
    const sole=piece(new THREE.BoxGeometry(.105,.025,.175), mat(o.sole),{folds:false}); sole.position.set(0,-.39,.025); hip.add(sole); body.add(hip); legs.push(hip); });
  if (o.skirt==='sanjuanera'){ const sk=piece(new THREE.CylinderGeometry(.14,.4,.34,14), mat('#ffffff',FLORAL)); sk.position.y=.27; body.add(sk);
    [[.11,.395],[.2,.33]].forEach(([y,r])=>{ const l=piece(new THREE.CylinderGeometry(r+.012,r+.018,.035,14,1,true), mat('#fbf7ee'),{folds:false}); l.material.side=THREE.DoubleSide; l.position.y=y; body.add(l); }); }
  else if (o.skirt==='long'){ const sk=piece(new THREE.CylinderGeometry(.14,.24,.38,8), mat(o.skirtCol)); sk.position.y=.27; body.add(sk); }
  else if (o.skirt==='short'){ const sk=piece(new THREE.CylinderGeometry(.14,.19,.14,8), mat('#ffffff',DENIM)); sk.position.y=.4; body.add(sk); }
  else { const hb=piece(new THREE.CylinderGeometry(.15,.135,.1,6), o.legMat); hb.position.y=.45; body.add(hb); }
  const tw=o.torsoW||[.125,.155]; const torso=piece(new THREE.CylinderGeometry(tw[0],tw[1],.32,6), mat(o.torso)); torso.position.y=.65; body.add(torso);
  if (o.belly){ const b=piece(new THREE.IcosahedronGeometry(.13,0), mat(o.torso)); b.scale.set(1.05,.9,.8); b.position.set(0,.58,.05); body.add(b); }
  if (o.apron){ const ap=piece(new THREE.BoxGeometry(.19,o.apronLen||.36,.01), mat(o.apron)); ap.position.set(0,.5-((o.apronLen||.36)-.36)/2,.135); ap.rotation.x=-.03; body.add(ap); }
  const neck=piece(new THREE.CylinderGeometry(.045,.05,.06,5), mat(SKIN),{folds:false}); neck.position.y=.83; body.add(neck);
  if (o.collar){ const col=piece(new THREE.CylinderGeometry(.2,.22,.02,16), mat('#fbf7ee')); col.position.y=.79; body.add(col);
    const e=new THREE.Mesh(new THREE.TorusGeometry(.215,.012,4,24), mat('#d6336c')); e.rotation.x=Math.PI/2; e.position.y=.79; body.add(e); }
  // cabeza
  const head=new THREE.Group(); head.position.y=.99; body.add(head);
  const skull=piece(new THREE.IcosahedronGeometry(.175,2), mat(SKIN),{folds:false}); skull.scale.set(1,.95,.98); head.add(skull);
  addFace(skull,{lashes:!!o.lashes, brow:o.older?'#e8e2d6':null, mustache:!!o.mustache});
  const hairCol=o.hair||HAIR; const covered=o.cap||o.scarfHead;
  const hair=piece(new THREE.IcosahedronGeometry(.18,1), mat(hairCol));
  if (covered){ hair.scale.set(.99,.8,.97); hair.position.set(0,-.01,-.012); } else { hair.scale.set(1.01,.9,1); hair.position.set(0,.03,-.025); }
  if (o.hairStyle!=='bald') head.add(hair);
  if (o.hairStyle==='ponytail'){ // cola de caballo por detrás de la gorra
    [0,1,2,3].forEach(i=>{ const b=piece(new THREE.IcosahedronGeometry(.05-i*.006,0), mat(hairCol),{folds:false}); b.position.set(0,.0-i*.075,-.2-i*.012); head.add(b); }); }
  if (o.hairStyle==='braid' || o.hairStyle==='bun'){ const bun=piece(new THREE.IcosahedronGeometry(.075,0), mat(hairCol)); bun.position.set(0,.02,-.18); head.add(bun); }
  if (o.hairStyle==='braid'){ for(let i=0;i<4;i++){ const b=piece(new THREE.IcosahedronGeometry(.045-i*.004,0), mat(hairCol),{folds:false}); b.position.set(0,-.1-i*.07,-.19+i*.005); head.add(b); }
    const tie=new THREE.Mesh(new THREE.IcosahedronGeometry(.025,0),mat(RED)); tie.position.set(0,-.36,-.185); head.add(tie); }
  [-1,1].forEach(s=>{ if (o.earrings){ const er=new THREE.Mesh(new THREE.IcosahedronGeometry(.018,0),mat('#e2b65a')); er.position.set(s*.17,-.07,.01); head.add(er); } });
  if (o.cap){ const cap=piece(new THREE.SphereGeometry(.19,8,4,0,Math.PI*2,0,Math.PI/2), mat(o.cap)); cap.position.y=.045; head.add(cap);
    const v=piece(new THREE.BoxGeometry(.24,.02,.14), mat(o.cap)); v.position.set(0,.065,.2); v.rotation.x=-.25; head.add(v); }
  if (o.scarfHead){ const sc=piece(new THREE.SphereGeometry(.19,8,4,0,Math.PI*2,0,Math.PI/2), mat(o.scarfHead)); sc.position.y=.01; sc.scale.set(1,1.05,1.05); head.add(sc);
    const knot=piece(new THREE.ConeGeometry(.05,.1,3), mat(o.scarfHead)); knot.position.set(0,-.02,-.2); knot.rotation.x=-2.4; head.add(knot); }
  if (o.hatOn){ const h=hat(o.hatBand); h.position.y=.1; h.rotation.x=-.06; head.add(h); }
  if (o.flowers){ [['#ffffff',-.11,.12,.1],['#f2c94c',-.15,.06,.08],[RED,-.07,.15,.06],['#d6336c',-.16,.13,.02],['#ffffff',-.12,.02,.12]].forEach(([c,x,y,z])=>{ const f=flower(c,.05); f.position.set(x,y,z); f.rotation.y=-.9; head.add(f); }); }
  // brazos
  [-1,1].forEach(s=>{ const sh=new THREE.Group(); sh.position.set(s*(tw[0]+.035),.77,0); sh.rotation.z=s*.14;
    if (o.puff){ const p=piece(new THREE.IcosahedronGeometry(.07,0), mat('#fbf7ee')); p.position.y=-.03; sh.add(p); const a=piece(new THREE.CylinderGeometry(.034,.032,.24,5), mat(SKIN)); a.position.y=-.19; sh.add(a); }
    else if (o.shortSleeve){ const up=piece(new THREE.CylinderGeometry(.046,.044,.1,5), mat(o.torso)); up.position.y=-.05; sh.add(up); const lo=piece(new THREE.CylinderGeometry(.036,.034,.19,5), mat(SKIN)); lo.position.y=-.19; sh.add(lo); }
    else { const a=piece(new THREE.CylinderGeometry(.042,.036,.29,5), mat(o.torso)); a.position.y=-.145; sh.add(a); }
    const hand=piece(new THREE.IcosahedronGeometry(.045,0), mat(SKIN),{folds:false}); hand.position.y=-.32; sh.add(hand); body.add(sh);
    arms.push(sh); if (s===1) root.userData.rightHand=hand; });
  Object.assign(root.userData,{body,head,legs,arms,ph:Math.random()*6}); return root;
}
function neckScarf(body){ const ring=piece(new THREE.TorusGeometry(.075,.03,5,10), mat(RED)); ring.rotation.x=Math.PI/2; ring.position.y=.81; body.add(ring);
  const tip=piece(new THREE.ConeGeometry(.06,.1,3), mat(RED)); tip.rotation.x=Math.PI; tip.scale.z=.3; tip.position.set(0,.74,.12); body.add(tip);
  const k=piece(new THREE.IcosahedronGeometry(.032,0), mat(RED),{folds:false}); k.position.set(0,.79,.1); body.add(k); }

/* Jugador: 0 inicio · 1 café · 2 caballos · 3 música y danza · 4 alfarería */
function buildMuneco(stage, fem=false){
  const alf=stage>=2, cab=stage>=3, mus=stage>=4;   // alfarería: poncho / flores · caballos: sombrero y pañuelo · música y danza: traje de fiesta
  const o={ legMat: mat('#ffffff',DENIM), shoe: stage>=1?'#e9dcc0':'#f4f4f0', sole: stage>=1?'#5a3a22':RED };
  if (!fem){ Object.assign(o,{ torso: mus?'#f6f1e4':'#2f8a7a', shortSleeve: stage===0, cap: stage<3?RED:null, hatOn: cab });
    if (alf) o.legMat=mat('#efe8d8'); }
  else { Object.assign(o,{ torso: mus?'#f6f1e4':'#7b4fb0', torsoW:[.112,.128], shortSleeve: stage===0, lashes:true, earrings:true,
      hairStyle: mus?'braid':'ponytail', cap: null, hatOn: false, flowers: alf });
    if (!mus){ o.skirt='short'; o.legMat=mat('#2a2a30'); }
    else { o.skirt='sanjuanera'; o.collar=true; o.puff=true; o.legMat=mat(SKIN); } }
  const m=base(o), body=m.userData.body;
  if (!fem && mus){ const f=piece(new THREE.CylinderGeometry(.158,.158,.06,6), mat(RED)); f.position.y=.52; body.add(f); }
  if (fem && mus){ const c=piece(new THREE.CylinderGeometry(.13,.135,.05,6), mat(RED)); c.position.y=.5; body.add(c); }
  if (cab){ if (fem && mus){ const r=piece(new THREE.TorusGeometry(.06,.02,5,10), mat(RED)); r.rotation.x=Math.PI/2; r.position.y=.83; body.add(r); } else neckScarf(body); }
  if (stage===0){ const bag=piece(new THREE.BoxGeometry(.22,.26,.1), mat('#e0a43a')); bag.position.set(0,.66,-.19); body.add(bag);
    const flap=piece(new THREE.BoxGeometry(.225,.1,.105), mat('#c07f22')); flap.position.set(0,.76,-.19); body.add(flap); }
  else if (fem && alf){ // mochila al costado con cordón café; el sombrero (caballos) va a la espalda
    if (cab){ const h=hat(); h.rotation.x=1.35; h.position.set(0,.68,-.22); body.add(h); }
    const cord=piece(new THREE.BoxGeometry(.018,.46,.012), mat('#5a3a22'),{folds:false}); cord.position.set(.02,.64,.14); cord.rotation.z=.62; body.add(cord);
    const mo=mochila(); mo.rotation.y=Math.PI/2; mo.position.set(.2,.46,.02); mo.scale.setScalar(.85); body.add(mo); }
  else { const mo=mochila(); mo.position.set(0,.62,-.185); body.add(mo); }
  if (!fem && alf){ const pm=mat('#ffffff',PONCHO), grp=new THREE.Group(); grp.position.set(-.075,.81,0); body.add(grp);
    grp.add(piece(new THREE.BoxGeometry(.13,.016,.29), pm,{folds:false}));
    [[1,.3],[-1,.24]].forEach(([s,len])=>{ const h=piece(new THREE.BoxGeometry(.13,len,.014), pm,{folds:false}); h.position.set(0,-len/2,s*.142); h.rotation.x=s*-.1; grp.add(h);
      for(let i=0;i<5;i++){ const f=new THREE.Mesh(new THREE.BoxGeometry(.012,.04,.008), mat('#2a1c11')); f.position.set(-.05+i*.025,-len-.015,s*(.142+len*.1)); grp.add(f); } }); }
  return m;
}

/* NPC genéricos: mismo muñeco, sin atuendos de nivel */
function buildNPC(kind){
  let m;
  if (kind==='caficultor'){ m=base({legMat:mat('#6b5440'), shoe:'#3a2a1c', sole:'#1f150e', torso:'#e8e2d0', belly:true, torsoW:[.13,.17], hair:'#d9d2c4', older:true, mustache:true, hatOn:true, hatBand:'#2a1c11'});
    const b=m.userData.body; const belt=piece(new THREE.CylinderGeometry(.172,.172,.04,6), mat('#3a2a1c'),{folds:false}); belt.position.y=.5; b.add(belt); }
  else if (kind==='recolectora'){ m=base({legMat:mat(SKIN), shoe:'#3d4a3a', sole:'#1f150e', torso:'#d97a3a', torsoW:[.115,.135], skirt:'long', skirtCol:'#3f6b4a', scarfHead:'#2f6b8a', lashes:true, hairStyle:'bun'});
    const b=m.userData.body; const basket=piece(new THREE.CylinderGeometry(.11,.09,.13,8), mat('#9a6a33')); basket.position.set(0,.5,.17); b.add(basket);
    for(let i=0;i<7;i++){ const c=new THREE.Mesh(new THREE.IcosahedronGeometry(.022,0),mat(RED)); c.position.set(Math.cos(i)*.06,.57,.17+Math.sin(i)*.04); b.add(c); }
    const strap=piece(new THREE.BoxGeometry(.02,.3,.012), mat('#5a3a22'),{folds:false}); strap.position.set(0,.66,.16); b.add(strap); }
  else if (kind==='alfarero'){ m=base({legMat:mat('#6b5440'), shoe:'#3a2a1c', sole:'#1f150e', torso:'#c9b79a', belly:true, torsoW:[.125,.15], hair:'#cfc8bb', older:true, mustache:true, apron:'#7a4a2a', apronLen:.36});
    const pot=new THREE.Group(); const c=piece(new THREE.CylinderGeometry(.045,.03,.06,8), mat('#b5652f')); pot.add(c); const lip=piece(new THREE.CylinderGeometry(.05,.045,.015,8), mat('#9e5428')); lip.position.y=.037; pot.add(lip);
    pot.position.set(0,.02,.05); pot.scale.setScalar(1.5); m.userData.rightHand.add(pot); const arm=m.userData.rightHand.parent; arm.rotation.x=-1.25; arm.rotation.z=.45; }
  else if (kind==='pintora'){ m=base({legMat:mat(SKIN), shoe:'#3a2a1c', sole:'#1f150e', torso:'#f6f1e4', torsoW:[.112,.128], skirt:'long', skirtCol:'#2f6b8a', scarfHead:'#c0262c', lashes:true, hairStyle:'bun', hair:'#2a1a10'});
    const br=piece(new THREE.CylinderGeometry(.008,.008,.16,5), mat('#8a5a32'),{folds:false}); br.position.set(0,.02,.06); br.rotation.x=1.1; const tip=piece(new THREE.CylinderGeometry(.012,.004,.03,5), mat('#c0262c'),{folds:false}); tip.position.set(0,.09,.0); br.add(tip);
    m.userData.rightHand.add(br); const arm=m.userData.rightHand.parent; arm.rotation.x=-1.1; arm.rotation.z=.4; }
  else if (kind==='aprendiz'){ m=base({legMat:mat('#2f4a63'), shoe:'#3a2a1c', sole:'#1f150e', torso:'#2f8a7a', cap:'#efe3c0', apron:'#8a5a32', apronLen:.3, shortSleeve:true}); }
  else { m=base({legMat:mat('#2a2a30'), shoe:'#3a2a1c', sole:'#1f150e', torso:'#f6f1e4', torsoW:[.112,.128], apron:'#5a3a22', apronLen:.3, lashes:true, hairStyle:'bun', hair:'#3a2214'});
    const cup=new THREE.Group(); const c=piece(new THREE.CylinderGeometry(.04,.032,.05,8), mat('#fbf7ee')); cup.add(c); const coffee=new THREE.Mesh(new THREE.CircleGeometry(.036,8),mat('#4a2a14')); coffee.rotation.x=-Math.PI/2; coffee.position.y=.026; cup.add(coffee);
    cup.position.set(0,.02,.05); cup.scale.setScalar(1.4); m.userData.rightHand.add(cup); const arm=m.userData.rightHand.parent; arm.rotation.x=-1.25; arm.rotation.z=.45; }
  return m;
}

function animar(m, dt, walking, still){
  const u=m.userData; if (!u.legs) return;
  if (walking && !still){ u.ph+=dt*10; const s=Math.sin(u.ph);
    u.legs[0].rotation.x=s*.6; u.legs[1].rotation.x=-s*.6;
    if (!u.carry){ u.arms[0].rotation.x=-s*.5; u.arms[1].rotation.x=s*.5; }
    u.body.position.y=Math.abs(Math.cos(u.ph))*.035; }
  else { u.ph+=dt*2; u.legs.forEach(l=>l.rotation.x*=.8); u.body.position.y*=.8;
    if (!u.carry && !u.pose) u.arms.forEach((a,i)=>a.rotation.x=(still?0:Math.sin(u.ph))*.04*(i?1:-1)); }
  if (u.carry) u.arms.forEach(a=>{ a.rotation.x+=(-1.15-a.rotation.x)*.3; });
}
let pr=null;
function retrato(build){
  try {
    if (!pr){ const c=document.createElement('canvas'); c.width=c.height=192;
      const r=new THREE.WebGLRenderer({canvas:c,antialias:true,alpha:true,preserveDrawingBuffer:true}); r.outputEncoding=THREE.sRGBEncoding; r.toneMapping=THREE.ACESFilmicToneMapping;
      const sc=new THREE.Scene(); sc.add(new THREE.HemisphereLight('#fff1d6','#3a2414',.8)); const k=new THREE.DirectionalLight('#ffdcaa',1.1); k.position.set(-1,2,3); sc.add(k);
      const cam=new THREE.PerspectiveCamera(30,1,.05,20); cam.position.set(0,1.05,1.9); cam.lookAt(0,.92,0); pr={c,r,sc,cam}; }
    const m=build(); m.rotation.y=-.25; pr.sc.add(m); pr.r.clear(); pr.r.render(pr.sc,pr.cam); const url=pr.c.toDataURL(); pr.sc.remove(m); return url;
  } catch(e){ return ''; }
}
/* Dos retratos para elegir personaje, sin etiqueta de género. alCambiar(v) con v = 'muneco' | 'muneca'. */
const PJ=[['muneco',false,'Pelo corto con gorra'],['muneca',true,'Cola de caballo con aretes']], PJ_IMG={};
function selector(el, valor, alCambiar){
  if (!document.getElementById('pjCss')){ const st=document.createElement('style'); st.id='pjCss'; st.textContent=`.pj{display:grid;grid-template-columns:1fr 1fr;gap:.8rem;margin:.3rem 0 .2rem}
.pj button{display:flex;flex-direction:column;align-items:center;padding:.4rem;border:2px solid rgba(60,40,20,.35);border-radius:10px;background:#fbf7ee;cursor:pointer}
.pj button[aria-pressed=true]{border:3px solid #3a2414;background:#fff;box-shadow:0 0 0 4px #e9c46a}
.pj button:focus-visible{outline:3px solid #1d4f8c;outline-offset:3px}
.pj img{width:100%;max-width:150px;aspect-ratio:1}
.pj .ok{visibility:hidden;font-weight:700;font-size:1.3rem;line-height:1;color:#3a2414}.pj [aria-pressed=true] .ok{visibility:visible}`; document.head.appendChild(st); }
  PJ.forEach(([v,fem])=>{ if (!PJ_IMG[v]) PJ_IMG[v]=retrato(()=>{ const g=new THREE.Group(), m=buildMuneco(0,fem); m.rotation.y=-.35; g.add(m); return g; }); });
  el.innerHTML='<div class="pj" role="group">'+PJ.map(([v,,alt])=>`<button type="button" data-pj="${v}" aria-pressed="${v===valor}"><img src="${PJ_IMG[v]||''}" alt="${alt}"><span class="ok" aria-hidden="true">✓</span></button>`).join('')+'</div>';
  el.querySelectorAll('[data-pj]').forEach(b=>b.addEventListener('click',()=>{ valor=b.dataset.pj; el.querySelectorAll('[data-pj]').forEach(x=>x.setAttribute('aria-pressed',x===b)); if (alCambiar) alCambiar(valor); }));
  return { valor:()=>valor };
}
window.Muneco={ jugador:buildMuneco, npc:buildNPC, animar, retrato, selector };
})();
