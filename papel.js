/* papel.js — utilidades compartidas de "Saberes de Laboyos":
   ajustes guardados, sonido sintetizado, recortes de papel troquelado,
   dibujos de personajes y objetos, y texturas de fachadas.
   Requiere Three.js (r128) cargado antes. Expone window.Papel. */
(() => {
'use strict';
/* ---------------- Ajustes (guardados en este navegador) ---------------- */
const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const DEFAULTS = {music:60, sfx:80, mute:false, quality:'media', shadows:true, text:'normal', motion:prefersReduced, subs:true, name:'', players:'1'};
const S = {...DEFAULTS};
try { Object.assign(S, JSON.parse(localStorage.getItem('laboyos.settings') || '{}')); } catch (e) {}
const save = () => { try { localStorage.setItem('laboyos.settings', JSON.stringify(S)); } catch (e) {} };


/* ---------------- Audio: tiple y bajo sintetizados ---------------- */
const Sound = {
  ctx:null, master:null, mus:null, fx:null, next:0, step:0, timer:null, fast:false,
  init(){
    if (this.ctx) return;
    try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    const c = this.ctx;
    this.master = c.createGain(); this.master.connect(c.destination);
    this.mus = c.createGain(); this.mus.connect(this.master);
    this.fx = c.createGain(); this.fx.connect(this.master);
    this.apply();
  },
  apply(){
    if (!this.ctx) return;
    this.master.gain.value = S.mute ? 0 : 1;
    this.mus.gain.value = (S.music/100) * 0.22;
    this.fx.gain.value = (S.sfx/100) * 0.5;
  },
  pluck(freq, t, dur=1.2, vol=.5, out){
    const c=this.ctx, o=c.createOscillator(), o2=c.createOscillator(), g=c.createGain(), f=c.createBiquadFilter();
    o.type='triangle'; o.frequency.value=freq; o2.type='sine'; o2.frequency.value=freq*2;
    f.type='lowpass'; f.frequency.setValueAtTime(freq*7,t); f.frequency.exponentialRampToValueAtTime(freq*1.5,t+dur);
    g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(vol,t+.008); g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
    o.connect(f); o2.connect(f); f.connect(g); g.connect(out||this.mus);
    o.start(t); o2.start(t); o.stop(t+dur+.05); o2.stop(t+dur+.05);
  },
  startMusic(){
    if (!this.ctx || this.timer) return;
    // Aire de bambuco en 6/8 sobre Re mayor: I – IV – V – I
    const N = n => 440*Math.pow(2,(n-69)/12);
    const prog = [[50,[62,66,69]],[55,[62,67,71]],[57,[61,64,69]],[50,[62,66,69]]];
    const mel = [74,76,78,81,78,76,74,73,71,69];
    this.next = this.ctx.currentTime + .2;
    this.timer = setInterval(() => {
      while (this.next < this.ctx.currentTime + .25) {
        const beat = 60/(this.fast?200:132);
        const bar = Math.floor(this.step/6)%4, pos = this.step%6, [bass, ch] = prog[bar];
        if (pos===0) this.pluck(N(bass-12), this.next, 1.6, .55);
        if (pos===3) this.pluck(N(bass-5), this.next, 1.0, .35);
        if (pos===2 || pos===5 || pos===4) ch.forEach((n,i)=>this.pluck(N(n), this.next+i*.012, .5, .16));
        if (this.fast && pos%2===1) this.pluck(N(bass+12), this.next, .18, .2);
        if ((pos===0||pos===3) && Math.random()<(this.fast?.8:.45)) this.pluck(N(mel[(Math.random()*mel.length)|0]), this.next+beat*.5, .9, .14);
        this.next += beat; this.step++;
      }
    }, 90);
  },
  whoosh(){
    if (!this.ctx) return; const c=this.ctx, t=c.currentTime;
    const b=c.createBuffer(1,c.sampleRate*.9,c.sampleRate), d=b.getChannelData(0);
    for (let i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,1.5);
    const s=c.createBufferSource(), f=c.createBiquadFilter(), g=c.createGain();
    s.buffer=b; f.type='bandpass'; f.frequency.setValueAtTime(400,t); f.frequency.exponentialRampToValueAtTime(1800,t+.5); f.Q.value=.8;
    g.gain.value=.9; s.connect(f); f.connect(g); g.connect(this.fx); s.start(t);
  },
  pop(i=0){
    if (!this.ctx) return; const c=this.ctx, t=c.currentTime, o=c.createOscillator(), g=c.createGain();
    o.type='sine'; o.frequency.setValueAtTime(520+i*40,t); o.frequency.exponentialRampToValueAtTime(180,t+.12);
    g.gain.setValueAtTime(.35,t); g.gain.exponentialRampToValueAtTime(.0001,t+.16);
    o.connect(g); g.connect(this.fx); o.start(t); o.stop(t+.2);
  },
  chime(){ if (!this.ctx) return; const t=this.ctx.currentTime; [76,81,85,88].forEach((n,i)=>this.pluck(440*Math.pow(2,(n-69)/12), t+i*.09, .9, .3, this.fx)); },
  footstep(){ if (!this.ctx) return; const c=this.ctx,t=c.currentTime,o=c.createOscillator(),g=c.createGain(); o.type='triangle'; o.frequency.value=rnd(90,130); g.gain.setValueAtTime(.12,t); g.gain.exponentialRampToValueAtTime(.0001,t+.07); o.connect(g); g.connect(this.fx); o.start(t); o.stop(t+.08); },
  tick(){ if (this.ctx) this.pluck(880, this.ctx.currentTime, .15, .2, this.fx); }
};

/* ---------------- Utilidades de papel ---------------- */
const mk = (w,h) => { const c=document.createElement('canvas'); c.width=w; c.height=h; return c; };
const rnd = (a,b) => a + Math.random()*(b-a);
const FIBER = (() => { // fibras sueltas sobre fondo transparente
  const c=mk(256,256), g=c.getContext('2d');
  for (let i=0;i<700;i++){ const x=rnd(0,256), y=rnd(0,256), a=rnd(0,Math.PI), l=rnd(2,9);
    g.strokeStyle = Math.random()<.5 ? `rgba(255,255,255,${rnd(.15,.5)})` : `rgba(60,35,10,${rnd(.08,.3)})`;
    g.lineWidth = rnd(.5,1.3); g.beginPath(); g.moveTo(x,y); g.lineTo(x+Math.cos(a)*l,y+Math.sin(a)*l); g.stroke(); }
  return c; })();
function fiber(g,w,h,alpha=1){ g.save(); g.globalCompositeOperation='source-atop'; g.globalAlpha=alpha; g.fillStyle=g.createPattern(FIBER,'repeat'); g.fillRect(0,0,w,h); g.restore(); }

// Recorte troquelado: dibujo + borde de papel blanco + fibra
function cutout(w,h,draw,edge=7){
  const pad=edge+3, A=mk(w+pad*2,h+pad*2), a=A.getContext('2d');
  a.translate(pad,pad); draw(a,w,h);
  const B=mk(A.width,A.height), b=B.getContext('2d');
  for (let k=0;k<18;k++){ const an=k/18*Math.PI*2; b.drawImage(A,Math.cos(an)*edge,Math.sin(an)*edge); }
  b.globalCompositeOperation='source-in'; b.fillStyle='#f6eedb'; b.fillRect(0,0,B.width,B.height);
  b.globalCompositeOperation='source-over'; b.drawImage(A,0,0);
  fiber(b,B.width,B.height,.8);
  return B;
}
function texFrom(c, rep){ const t=new THREE.CanvasTexture(c); t.encoding=THREE.sRGBEncoding; t.anisotropy=8; if(rep){t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(rep[0],rep[1]);} return t; }

const shadowables = [];
function card(c, height, {tint}={}){
  const tex=texFrom(c), w=height*c.width/c.height;
  const geo=new THREE.PlaneGeometry(w,height); geo.translate(0,height/2,0);
  const mat=new THREE.MeshStandardMaterial({map:tex, alphaTest:.5, side:THREE.DoubleSide, roughness:.92, metalness:0});
  if (tint) mat.color.set(tint);
  const m=new THREE.Mesh(geo,mat); m.castShadow=true; m.receiveShadow=true;
  m.customDepthMaterial=new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking, map:tex, alphaTest:.5});
  shadowables.push(m);
  return m;
}
function paperMat(color, map){ return new THREE.MeshStandardMaterial({color, map:map||null, roughness:.95, metalness:0}); }
function boxMesh(w,h,d,mats){ const g=new THREE.BoxGeometry(w,h,d); g.translate(0,h/2,0); const m=new THREE.Mesh(g,mats); m.castShadow=true; m.receiveShadow=true; shadowables.push(m); return m; }

/* ---------------- Dibujos de los recortes ---------------- */
const D = {
  person(o={}){ return (g,w,h) => {
    const skin=o.skin||'#b07a52', shirt=o.shirt||'#e8e2d0', pants=o.pants||'#3c4a63';
    if (o.dress){ g.fillStyle=o.dress; g.beginPath(); g.moveTo(w*.38,h*.52); g.lineTo(w*.62,h*.52); g.lineTo(w*(o.wide?.98:.8),h*.92); g.lineTo(w*(o.wide?.02:.2),h*.92); g.closePath(); g.fill();
      g.strokeStyle=o.trim||'#f2c94c'; g.lineWidth=h*.02; g.beginPath(); g.moveTo(w*(o.wide?.05:.22),h*.88); g.lineTo(w*(o.wide?.95:.78),h*.88); g.stroke();
      g.fillStyle=skin; g.fillRect(w*.4,h*.9,w*.07,h*.1); g.fillRect(w*.53,h*.9,w*.07,h*.1);
    } else { g.fillStyle=pants; g.fillRect(w*.36,h*.56,w*.12,h*.44); g.fillRect(w*.52,h*.56,w*.12,h*.44); }
    g.fillStyle=shirt; g.beginPath(); g.roundRect ? g.roundRect(w*.3,h*.27,w*.4,h*.32,w*.08) : g.rect(w*.3,h*.27,w*.4,h*.32); g.fill();
    g.fillRect(w*.2,h*.29,w*.12,h*.25); g.fillRect(w*.68,h*.29,w*.12,h*.25);
    g.fillStyle=skin; g.fillRect(w*.21,h*.52,w*.1,h*.05); g.fillRect(w*.69,h*.52,w*.1,h*.05);
    if (o.scarf){ g.fillStyle=o.scarf; g.beginPath(); g.moveTo(w*.38,h*.27); g.lineTo(w*.62,h*.27); g.lineTo(w*.5,h*.38); g.fill(); }
    g.fillStyle=skin; g.beginPath(); g.arc(w*.5,h*.19,w*.13,0,7); g.fill();
    if (o.hat!==false){ g.fillStyle=o.hat||'#e9dcb6'; g.beginPath(); g.ellipse(w*.5,h*.12,w*.32,h*.035,0,0,7); g.fill();
      g.fillRect(w*.38,h*.03,w*.24,h*.09); g.fillStyle='#2a1c11'; g.fillRect(w*.38,h*.09,w*.24,h*.02); }
    else { g.fillStyle='#2a1c11'; g.beginPath(); g.arc(w*.5,h*.15,w*.14,Math.PI,0); g.fill(); }
    if (o.basket){ g.fillStyle='#9a6a33'; g.fillRect(w*.32,h*.45,w*.36,h*.16); g.strokeStyle='#6b4520'; g.lineWidth=2;
      for(let i=1;i<4;i++){ g.beginPath(); g.moveTo(w*.32,h*.45+i*h*.04); g.lineTo(w*.68,h*.45+i*h*.04); g.stroke(); }
      g.fillStyle='#b3262b'; for(let i=0;i<6;i++){ g.beginPath(); g.arc(w*(.37+i*.055),h*.45,w*.03,0,7); g.fill(); } }
    if (o.guitar){ g.fillStyle='#a8682e'; g.beginPath(); g.ellipse(w*.42,h*.48,w*.17,h*.08,-.5,0,7); g.fill(); g.fillStyle='#2a1c11'; g.beginPath(); g.arc(w*.42,h*.48,w*.04,0,7); g.fill();
      g.strokeStyle='#6b4520'; g.lineWidth=w*.05; g.beginPath(); g.moveTo(w*.5,h*.44); g.lineTo(w*.85,h*.28); g.stroke(); }
  };},
  coffee(){ return (g,w,h) => {
    g.fillStyle='#5b3b22'; g.fillRect(w*.47,h*.7,w*.06,h*.3);
    const greens=['#2f5a2c','#3c6e35','#4b8040','#2a4f27'];
    for (let i=0;i<34;i++){ const a=rnd(Math.PI*1.05,Math.PI*1.95), r=rnd(0,.42); g.fillStyle=greens[i%4];
      g.beginPath(); g.ellipse(w*.5+Math.cos(a)*w*r, h*.78+Math.sin(a)*h*rnd(.1,.75), w*rnd(.08,.13), h*rnd(.05,.08), rnd(0,3), 0, 7); g.fill(); }
    for (let i=0;i<16;i++){ const x=w*rnd(.22,.78), y=h*rnd(.25,.72); g.fillStyle=Math.random()<.75?'#c0262c':'#e0a43a';
      for (let k=0;k<3;k++){ g.beginPath(); g.arc(x+k*w*.025,y+(k%2)*h*.015,w*.022,0,7); g.fill(); } }
  };},
  tree(colors=['#4f7d3a','#3f6a30','#5e8f45'], trunk='#5b3b22'){ return (g,w,h) => {
    g.fillStyle=trunk; g.beginPath(); g.moveTo(w*.44,h); g.lineTo(w*.47,h*.45); g.lineTo(w*.53,h*.45); g.lineTo(w*.56,h); g.fill();
    const blobs=[[.5,.28,.3],[.3,.38,.22],[.7,.38,.22],[.42,.18,.2],[.6,.2,.2],[.5,.45,.22]];
    blobs.forEach(([x,y,r],i)=>{ g.fillStyle=colors[i%colors.length]; g.beginPath(); g.ellipse(w*x,h*y,w*r,h*r*.75,0,0,7); g.fill(); });
  };},
  plantain(){ return (g,w,h) => {
    g.fillStyle='#7a8a3a'; g.fillRect(w*.46,h*.35,w*.08,h*.65);
    const leaf=(a,l)=>{ g.save(); g.translate(w*.5,h*.38); g.rotate(a); g.fillStyle='#5d9440'; g.beginPath(); g.ellipse(0,-h*l/2,w*.1,h*l/2,0,0,7); g.fill();
      g.strokeStyle='#3f6a30'; g.lineWidth=2; g.beginPath(); g.moveTo(0,0); g.lineTo(0,-h*l); g.stroke(); g.restore(); };
    [-1.3,-.7,-.15,.5,1.1,1.45].forEach((a,i)=>leaf(a,.32+(i%2)*.06));
  };},
  sack(){ return (g,w,h) => {
    g.fillStyle='#c9ab74'; g.beginPath(); g.moveTo(w*.15,h); g.lineTo(w*.1,h*.3); g.quadraticCurveTo(w*.5,h*.05,w*.9,h*.3); g.lineTo(w*.85,h); g.closePath(); g.fill();
    g.strokeStyle='#8f7445'; g.lineWidth=3; for(let i=1;i<6;i++){ g.beginPath(); g.moveTo(w*.12,h*(.3+i*.12)); g.lineTo(w*.88,h*(.3+i*.12)); g.stroke(); }
    g.fillStyle='#7a2a1c'; g.font=`700 ${h*.2}px "Alegreya SC", serif`; g.textAlign='center'; g.fillText('CAFÉ',w*.5,h*.72);
  };},
  mountains(){ return (g,w,h) => {
    const ridge=(base,col,peaks)=>{ g.fillStyle=col; g.beginPath(); g.moveTo(0,h); peaks.forEach(([x,y])=>g.lineTo(w*x,h*y)); g.lineTo(w,h); g.closePath(); g.fill(); };
    ridge(0,'#7d9a8c',[[0,.55],[.15,.2],[.3,.45],[.48,.05],[.66,.4],[.82,.18],[1,.5]]);
    g.fillStyle='#eef0e6'; [[.15,.2],[.48,.05],[.82,.18]].forEach(([x,y])=>{ g.beginPath(); g.moveTo(w*x,h*y); g.lineTo(w*(x-.05),h*(y+.12)); g.lineTo(w*(x+.05),h*(y+.12)); g.fill(); });
    ridge(0,'#5f8270',[[0,.75],[.2,.45],[.38,.62],[.58,.35],[.78,.6],[1,.42]]);
    ridge(0,'#4a6b4c',[[0,.9],[.25,.68],[.5,.82],[.75,.62],[1,.8]]);
  };},
  fence(){ return (g,w,h) => {
    g.fillStyle='#8a5a32'; for (let x=0;x<=w-10;x+=w/6) g.fillRect(x,h*.1,w*.035,h*.9);
    g.fillRect(0,h*.25,w,h*.12); g.fillRect(0,h*.6,w,h*.12);
  };},
  horse(col='#7a4a2a', rider){ return (g,w,h) => {
    const leg=(x)=>{ g.fillRect(w*x,h*.6,w*.045,h*.4); g.fillStyle='#2a1c11'; g.fillRect(w*x,h*.95,w*.045,h*.05); g.fillStyle=col; };
    g.fillStyle=col; [.27,.35,.62,.7].forEach(leg);
    g.beginPath(); g.ellipse(w*.48,h*.55,w*.27,h*.16,0,0,7); g.fill();
    g.beginPath(); g.moveTo(w*.66,h*.5); g.lineTo(w*.8,h*.18); g.lineTo(w*.88,h*.2); g.lineTo(w*.78,h*.58); g.fill();
    g.beginPath(); g.ellipse(w*.88,h*.24,w*.09,h*.07,.5,0,7); g.fill();
    g.beginPath(); g.moveTo(w*.81,h*.12); g.lineTo(w*.84,h*.04); g.lineTo(w*.86,h*.14); g.fill();
    g.strokeStyle='#2a1c11'; g.lineWidth=w*.025; g.beginPath(); g.moveTo(w*.8,h*.15); g.lineTo(w*.7,h*.48); g.stroke();
    g.beginPath(); g.moveTo(w*.22,h*.48); g.quadraticCurveTo(w*.1,h*.55,w*.13,h*.82); g.stroke();
    if (rider){ D.person({shirt:'#f4f0e4',pants:'#3a3a3a',hat:'#efe3c0',scarf:'#b3262b'})( (g.save(),g.translate(w*.33,-h*.05),g), w*.3, h*.62); g.restore(); }
  };},
  stageBack(){ return (g,w,h) => {
    g.fillStyle='#6b3e22'; g.fillRect(0,h*.08,w,h*.92);
    g.fillStyle='#2b1810'; g.fillRect(w*.1,h*.3,w*.8,h*.7);
    g.fillStyle='#a3242a'; g.beginPath(); g.moveTo(w*.1,h*.3); g.quadraticCurveTo(w*.28,h*.55,w*.2,h); g.lineTo(w*.1,h); g.fill();
    g.beginPath(); g.moveTo(w*.9,h*.3); g.quadraticCurveTo(w*.72,h*.55,w*.8,h); g.lineTo(w*.9,h); g.fill();
    g.fillStyle='#d9ae55'; g.fillRect(0,h*.08,w,h*.05);
    g.fillStyle='#2f6b8a'; g.fillRect(w*.04,h*.13,w*.92,h*.15);
    const cols=['#f2c94c','#c0262c','#2f8a5a','#f2f2e6','#e07a2b'];
    for (let i=0;i<14;i++){ g.fillStyle=cols[i%5]; const x=w*(.07+i*.064); g.beginPath(); g.moveTo(x,h*.3); g.lineTo(x+w*.05,h*.3); g.lineTo(x+w*.025,h*.4); g.fill(); }
    g.fillStyle='#f6eedb'; g.font=`700 ${h*.1}px "Alegreya SC", serif`; g.textAlign='center'; g.fillText('SAN PEDRO',w*.5,h*.25);
  };},
  kiln(){ return (g,w,h) => {
    g.fillStyle='#b0582f'; g.beginPath(); g.moveTo(w*.08,h); g.lineTo(w*.08,h*.45); g.quadraticCurveTo(w*.5,-h*.15,w*.92,h*.45); g.lineTo(w*.92,h); g.fill();
    g.strokeStyle='#7d3a1c'; g.lineWidth=2; for(let y=.5;y<1;y+=.09){ g.beginPath(); g.moveTo(w*.08,h*y); g.lineTo(w*.92,h*y); g.stroke(); }
    g.fillStyle='#2a140b'; g.beginPath(); g.moveTo(w*.3,h); g.lineTo(w*.3,h*.65); g.arc(w*.5,h*.65,w*.2,Math.PI,0); g.lineTo(w*.7,h); g.fill();
    const fg=g.createRadialGradient(w*.5,h*.92,2,w*.5,h*.85,w*.22); fg.addColorStop(0,'#ffd36b'); fg.addColorStop(.5,'#f07a24'); fg.addColorStop(1,'rgba(160,40,10,0)');
    g.fillStyle=fg; g.fillRect(w*.3,h*.6,w*.4,h*.4);
  };},
  pots(){ return (g,w,h) => {
    const pot=(x,s,c)=>{ g.fillStyle=c; g.beginPath(); g.ellipse(w*x,h*(1-s*.45),w*s*.22,h*s*.45,0,0,7); g.fill(); g.fillRect(w*(x-s*.08),h*(1-s*.98),w*s*.16,h*s*.2);
      g.fillStyle='rgba(255,240,210,.45)'; g.fillRect(w*(x-s*.2),h*(1-s*.55),w*s*.4,h*s*.05); };
    pot(.2,.8,'#b5652f'); pot(.5,1,'#c4723a'); pot(.8,.7,'#9e5428');
  };},
  chiva(){ return (g,w,h) => { // chiva de barro: el bus de escalera que se modela en Pitalito
    g.fillStyle='#f4efe3'; g.fillRect(w*.04,h*.22,w*.92,h*.58);
    const cols=['#c0262c','#f2c94c','#2f6b8a','#2f8a5a'];
    cols.forEach((c,i)=>{ g.fillStyle=c; g.fillRect(w*.04,h*(.62+i*.045),w*.92,h*.04); });
    g.fillStyle='#2a1c11'; for(let i=0;i<5;i++) g.fillRect(w*(.1+i*.17),h*.3,w*.12,h*.22);
    g.fillStyle='#c0262c'; g.fillRect(w*.04,h*.14,w*.92,h*.08);
    g.fillStyle='#8a5a32'; [.15,.38,.6].forEach(x=>g.fillRect(w*x,h*.02,w*.16,h*.12));
    g.fillStyle='#2a1c11'; [.22,.78].forEach(x=>{ g.beginPath(); g.arc(w*x,h*.85,h*.14,0,7); g.fill(); });
  };},
  lock(){ return (g,w,h) => {
    g.fillStyle='#efe3c6'; g.fillRect(0,h*.15,w,h*.85); g.strokeStyle='#2a1c11'; g.lineWidth=w*.07;
    g.beginPath(); g.arc(w*.5,h*.48,w*.17,Math.PI,0); g.stroke(); g.fillStyle='#2a1c11'; g.fillRect(w*.28,h*.48,w*.44,h*.32);
    g.fillStyle='#efe3c6'; g.beginPath(); g.arc(w*.5,h*.6,w*.05,0,7); g.fill();
  };},
};

/* ---------------- Texturas de fachadas ---------------- */
function tileTex(){ const c=mk(256,256), g=c.getContext('2d'); g.fillStyle='#a84a2a'; g.fillRect(0,0,256,256);
  for (let y=0;y<256;y+=22) for (let x=-(y/22%2)*16;x<256;x+=32){ g.fillStyle=`hsl(${12+rnd(-4,6)},${55+rnd(-8,8)}%,${38+rnd(-6,8)}%)`; g.beginPath(); g.ellipse(x+16,y+14,15,12,0,0,Math.PI); g.fill(); }
  fiber(g,256,256,.6); return texFrom(c,[2,2]); }
function wallTex(kind){ const c=mk(512,256), g=c.getContext('2d');
  if (kind==='finca'){ g.fillStyle='#f3ecdc'; g.fillRect(0,0,512,256); g.fillStyle='#2f6b4a'; g.fillRect(0,200,512,56);
    g.fillStyle='#6b3e22'; g.fillRect(220,110,72,146); [[70,100],[380,100]].forEach(([x,y])=>{ g.fillStyle='#3a6f8f'; g.fillRect(x,y,70,70); g.fillStyle='#2a1c11'; g.fillRect(x+33,y,4,70); });
    g.fillStyle='#8a5a32'; for(let x=10;x<512;x+=100) g.fillRect(x,0,12,256); g.fillRect(0,0,512,14); }
  else if (kind==='tower'){ g.fillStyle='#ece3cf'; g.fillRect(0,0,512,256); g.strokeStyle='rgba(120,100,70,.35)'; g.lineWidth=2;
    for (let y=0;y<256;y+=32){ g.beginPath(); g.moveTo(0,y); g.lineTo(512,y); g.stroke(); }
    g.fillStyle='#3a2a1e'; [[150,60],[310,60],[230,150]].forEach(([x,y])=>{ g.beginPath(); g.moveTo(x,y+70); g.lineTo(x,y+20); g.arc(x+26,y+20,26,Math.PI,0); g.lineTo(x+52,y+70); g.fill(); }); }
  else if (kind==='clock'){ g.fillStyle='#ece3cf'; g.fillRect(0,0,512,256); g.fillStyle='#f8f4ea'; g.beginPath(); g.arc(256,128,80,0,7); g.fill(); g.strokeStyle='#2a1c11'; g.lineWidth=8; g.stroke();
    for (let i=0;i<12;i++){ const a=i/12*Math.PI*2; g.beginPath(); g.moveTo(256+Math.cos(a)*62,128+Math.sin(a)*62); g.lineTo(256+Math.cos(a)*72,128+Math.sin(a)*72); g.stroke(); }
    g.lineWidth=6; g.beginPath(); g.moveTo(256,128); g.lineTo(256,80); g.moveTo(256,128); g.lineTo(290,140); g.stroke();
    g.fillStyle='#d9cdb3'; for (let x=0;x<512;x+=64) g.fillRect(x,0,40,22); }
  else if (kind==='stable'){ g.fillStyle='#8a5a32'; g.fillRect(0,0,512,256); g.strokeStyle='#6b4224'; g.lineWidth=3; for(let x=0;x<512;x+=24){ g.beginPath(); g.moveTo(x,0); g.lineTo(x,256); g.stroke(); }
    g.fillStyle='#3a2414'; for(let i=0;i<4;i++){ g.fillRect(30+i*122,90,90,166); g.strokeStyle='#c9a46a'; g.lineWidth=5; g.beginPath(); g.moveTo(30+i*122,90); g.lineTo(120+i*122,256); g.moveTo(120+i*122,90); g.lineTo(30+i*122,256); g.stroke(); } }
  else if (kind==='adobe'){ g.fillStyle='#b98a5a'; g.fillRect(0,0,512,256); g.fillStyle='#8a5a32'; g.fillRect(40,70,432,10); g.fillRect(40,150,432,10);
    for (let i=0;i<9;i++){ g.fillStyle=['#b5652f','#c4723a','#9e5428'][i%3]; g.beginPath(); g.ellipse(70+i*48,52,16,20,0,0,7); g.fill(); g.beginPath(); g.ellipse(70+i*48,130,14,18,0,0,7); g.fill(); } }
  fiber(g,512,256,.7); return texFrom(c); }
function hipRoof(w,d,h,mat){ const g=new THREE.ConeGeometry(Math.SQRT1_2,h,4,1); g.rotateY(Math.PI/4); g.translate(0,h/2,0);
  const m=new THREE.Mesh(g,mat); m.scale.set(w,1,d); m.castShadow=true; m.receiveShadow=true; shadowables.push(m); return m; }

window.Papel = { DEFAULTS, S, save, Sound, mk, rnd, FIBER, fiber, cutout, texFrom, card, shadowables, paperMat, boxMesh, D, tileTex, wallTex, hipRoof };
})();
