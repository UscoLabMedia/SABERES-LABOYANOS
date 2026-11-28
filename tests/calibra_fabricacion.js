// Calibración de la fabricación (alfareria.html): un jugador automático juega solo el juego real (step/take/use de __a)
// con tiempos de caminar y de reacción de tres niveles de habilidad. Fija las estrellas y comprueba que la chiva rinde más.
// Uso: THREE_JS=... node tests/calibra_fabricacion.js   (determinista: Math.random con semilla)
const T=require('./lib');
const SEMILLAS=[1,2,3,4,5,6];
const NIVELES=[   // extra: segundos de reacción por acción; walk: factor de caminata
  {n:'experto',extra:0,walk:1,figs:null,min:3},
  {n:'medio',extra:1.5,walk:1.25,figs:null,min:2},
  {n:'novato',extra:3.5,walk:1.3,figs:null,min:1},
  {n:'primera partida (solo matera y jarron)',extra:3.5,walk:1.3,figs:['matera','jarron'],max:2}];

// Todo lo de abajo corre dentro de la página: usa solo window.__a (juego real).
function jugar(P){
  const A=__a, g=A.game, ST=A.ST, Rc=A.Recetas, F=Rc.datos.figuras;
  let s0=P.semilla>>>0; Math.random=()=>{ s0=(s0+0x6D2B79F5)>>>0; let t=Math.imul(s0^s0>>>15,1|s0); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; };
  A.begin([{slot:0,nombre:'Bot',avatar:'muneco',etapa:0}]); const p=A.players[0]; g.paused=true;   // pausa: el bucle de dibujo no avanza; el bot llama step()
  if (P.unica){ g.orders.length=0; g.nextOrder=1e9; A.pedir(P.unica); }
  const out={acc:0,ent:{matera:0,jarron:0,frutero:0,chiva:0},perd:0,busy:0}; let pos={x:p.x,z:p.z}, ocupado=true, ids=new Map(g.orders.map(o=>[o.id,o.fig])), perd0=0, pie0=0;
  const adv=t=>{ while(t>1e-9 && g.on){ const d=Math.min(.05,t); A.step(d); t-=d; if (ocupado) out.busy+=d;
    const cur=new Map(g.orders.map(o=>[o.id,o.fig])), dp=g.stats.perdidos-perd0, dq=g.stats.piezas-pie0;
    ids.forEach((f,id)=>{ if (!cur.has(id)){ if (dp>0&&dq===0) out.perd++; else if (dp===0) out.ent[f]++; } }); ids=cur; perd0=g.stats.perdidos; pie0=g.stats.piezas; } };
  const espera=t=>{ ocupado=false; adv(t); ocupado=true; out.idle=(out.idle||0)+t; };
  const masa=c=>c&&!c.fig&&c.i>=2, barro=c=>c&&!c.fig&&c.i===1;
  const ir=s=>{ const d=Math.max(0,Math.hypot(s.x-pos.x,s.z-pos.z)-1.2); adv(d/(p.carry?4.2:4.6)*P.walk);
    for (const [dx,dz] of [[0,1.35],[0,-1.35],[-1.35,0],[1.35,0],[0,1.8],[-1.8,0],[1.8,0]]){ p.x=s.x+dx; p.z=s.z+dz; if (A.nearest(p)===s) break; } pos={x:s.x,z:s.z}; };
  const tomar=()=>{ out.acc++; adv(.5+P.extra); p.inp.take=true; A.step(.02); p.inp.take=false; };
  const mantener=(cond,max=15)=>{ out.acc++; adv(.5+P.extra); p.inp.use=true; let t=0; while(g.on&&!cond()&&t<max){ A.step(.05); t+=.05; if (ocupado) out.busy+=.05; } p.inp.use=false; A.step(.02); };
  const lib=k=>ST.filter(s=>s.kind===k&&s.state==='vacio');
  const cerca=L=>L.sort((a,b)=>Math.hypot(a.x-pos.x,a.z-pos.z)-Math.hypot(b.x-pos.x,b.z-pos.z))[0];
  const permitido=f=>!P.figs||P.figs.includes(f);
  const viable=o=>!P.est||o.left>1.5*(P.est[o.fig].L*P.walk+P.est[o.fig].n*P.extra);   // el jugador sabe cuánto tarda y no empieza lo que no alcanza
  const hayViables=()=>g.orders.some(o=>permitido(o.fig)&&viable(o));
  // pedidos sin cubrir (los más impacientes primero) y masas que faltan
  function pendientes(){ const sup={}, formadas=[p.carry,...ST.map(s=>s.pz),...g.repisa]; let parcial=false;
    formadas.forEach(z=>{ if (z&&z.fig) sup[z.fig]=(sup[z.fig]||0)+1; }); ST.forEach(s=>{ if (s.espera) parcial=true; });
    const sin=[]; [...g.orders].sort((a,b)=>a.left-b.left).forEach(o=>{ if (!permitido(o.fig)) return; if (!viable(o)&&hayViables()) return; if (sup[o.fig]>0) sup[o.fig]--; else sin.push(o); });
    let masas=0, usado=false; sin.forEach(o=>{ if (o.fig==='chiva'){ masas+=parcial&&!usado?1:2; usado=true; } else masas++; });
    return {sin,masas}; }
  const crudas=()=>[p.carry,...ST.map(s=>s.pz)].filter(z=>z&&!z.fig).length;
  function paso(){
    const c=p.carry;
    if (c){
      if (barro(c)){ const s=cerca(lib('amasado')); if (!s) return espera(.5); ir(s); tomar(); mantener(()=>s.state==='listo'); tomar(); return; }
      if (masa(c)){ const {sin}=pendientes(), o=sin[0]; if (!o){ const q=g.orders.find(x=>permitido(x.fig)); if (!q) return espera(.5); return modelar(q.fig); } return modelar(o.fig); }
      const k=Rc.paso(c), kind=Rc.estacion(k);
      if (k==='entregar'){ const s=ST.find(q=>q.kind==='mostrador'); ir(s); return tomar(); }
      if (kind==='mesa'){ const s=ST.find(q=>q.kind==='mesa'); ir(s); return tomar(); }
      if (kind==='pintura'){ const s=cerca(lib('pintura')); if (!s) return espera(.5); ir(s); tomar(); if (s.state!=='pintando') return;
        const cs=s.pz.colores; if (!cs) mantener(()=>s.state==='listo'); else cs.forEach(col=>{ s.color=Rc.datos.colores.indexOf(col); mantener(()=>s.state==='listo'||(s.pz.pintados||[]).includes(col)); }); tomar(); return; }
      const s=cerca(lib(kind)); if (!s){ if ((out.bloq=(out.bloq||0)+.5)>40){ out.bloq=0; A.tirar(p); return; } return espera(.5); } ir(s); return tomar(); }
    out.bloq=0;
    let s=ST.filter(q=>q.kind==='horno'&&(q.state==='lista'||q.state==='pasada')).sort((a,b)=>b.t-a.t)[0];
    if (!s){ const hl=lib('horno').length>0||ST.some(q=>q.kind==='horno'&&q.state==='quemando'&&R_.quema-q.t<2.5); if (hl) s=ST.find(q=>q.kind==='secadero'&&q.state==='seco'); }
    if (!s) s=ST.find(q=>q.kind==='amasado'&&q.state==='listo');
    if (s){ ir(s); return tomar(); }
    const {masas}=pendientes();
    if (crudas()<masas){ const b=ST.find(q=>q.kind==='barro'); ir(b); return tomar(); }
    espera(.25); }
  const R_=A.R;
  function modelar(f){ const kind=Rc.estacion(F[f].pasos[2]); let s=cerca(ST.filter(q=>q.kind===kind)); ir(s); const L=Rc.figurasPara(kind,g.orders); s.sel=Math.max(0,L.indexOf(f));
    mantener(()=>!masa(p.carry)); }
  let n=0; while(g.on && n++<200000){ if (P.unica && g.stats.piezas>=1) break; paso(); }
  out.t=+g.t.toFixed(1); out.score=g.score; out.piezas=g.stats.piezas; out.estrellas=P.unica?null:+document.querySelector('#stars').getAttribute('aria-label')[0]; return out; }

(async()=>{
  const {p}=await T.abrir('alfareria.html#prueba'); await p.waitForFunction(()=>window.__a&&__a.game.on,null,{timeout:30000});
  const info=await p.evaluate(()=>({R:{duracionSolo:__a.R.duracionSolo,duracion:__a.R.duracion,secado:__a.R.secado,quema:__a.R.quema,ventana:__a.R.ventana,estrellas:__a.R.estrellas},pts:Object.fromEntries(Object.entries(__a.Recetas.datos.figuras).map(([k,v])=>[k,v.puntos]))}));
  console.log('Reglas:',JSON.stringify(info));
  const ES=info.R.estrellas, est=sc=>ES.filter(x=>sc>=x).length, res={};
  // 1) una sola pieza por figura, experto: puntos por segundo ocupado, duración de principio a fin y número de acciones
  const ppb={}, EST={}; for (const f of Object.keys(info.pts)){ const r=await p.evaluate(jugar,{semilla:7,extra:0,walk:1,figs:null,unica:f}); ppb[f]=info.pts[f]/r.busy; EST[f]={L:r.t,n:r.acc};
    console.log(`   ${f}: ${info.pts[f]} puntos / ${r.busy.toFixed(1)} s ocupado = ${ppb[f].toFixed(2)} puntos por segundo (de principio a fin ${r.t} s, ${r.acc} acciones)`); }
  T.ok(ppb.chiva>Math.max(ppb.matera,ppb.jarron,ppb.frutero),'la chiva rinde más puntos por segundo ocupado que las demás');
  T.ok(info.pts.chiva>=3*info.pts.matera,'chiva ≥ 3× matera');
  T.ok(info.R.duracionSolo===300&&info.R.duracion===180,'solo 300 s, equipo 180 s');
  // 2) partidas completas por nivel
  for (const N of NIVELES){ const rs=[]; for (const s of SEMILLAS) rs.push(await p.evaluate(jugar,{semilla:s,extra:N.extra,walk:N.walk,figs:N.figs,est:EST}));
    const media=rs.reduce((a,r)=>a+r.score,0)/rs.length, min=Math.min(...rs.map(r=>r.score)), max=Math.max(...rs.map(r=>r.score)), sum=k=>rs.reduce((a,r)=>a+r.ent[k],0)/rs.length;
    res[N.n]={media,min,max,rs};
    console.log(`\n== ${N.n}: puntos medios ${media.toFixed(1)} (min ${min}, max ${max}) · estrellas con la media ${est(media)} · por partida ${rs.map(r=>r.estrellas).join('')}`);
    console.log('   entregas medias: matera '+sum('matera').toFixed(1)+' · jarrón '+sum('jarron').toFixed(1)+' · frutero '+sum('frutero').toFixed(1)+' · chiva '+sum('chiva').toFixed(1)+' · clientes perdidos '+(rs.reduce((a,r)=>a+r.perd,0)/rs.length).toFixed(1)+' · ocioso '+(rs.reduce((a,r)=>a+(r.idle||0),0)/rs.length).toFixed(0)+' s · puntos por partida '+rs.map(r=>r.score).join(','));
    if (N.min){ const bien=rs.filter(r=>r.estrellas>=N.min).length; T.ok(est(media)>=N.min&&bien>=4,`${N.n}: ${est(media)} estrellas con la media (≥ ${N.min}) y ${bien} de ${rs.length} partidas llegan a ${N.min}`); }
    if (N.max!==undefined) T.ok(rs.every(r=>r.estrellas<3)&&est(media)<3,`${N.n}: menos de 3 estrellas (media ${est(media)})`); }
  T.ok(res.experto.media>res.medio.media&&res.medio.media>res.novato.media,'experto > medio > novato en puntos');
  T.ok(res.novato.media>res['primera partida (solo matera y jarron)'].media,'quien hace todas las figuras gana más que quien solo hace dos');
  await T.fin(); })();
