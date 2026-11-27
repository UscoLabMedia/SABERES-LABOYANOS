// Aviso: en la finca (PC) las montañas del fondo se superponen a la misma profundidad: se ven los márgenes y tiemblan (z-fighting).
const T=require('./lib');
(async()=>{ for (const q of ['','?nivel=2']){ const {p}=await T.abrir('finca.html'+q+'#prueba'); await p.waitForFunction(()=>window.__f&&__f.montes,null,{timeout:30000}).catch(()=>{});
  const m=await p.evaluate(()=>window.__f&&__f.montes); T.ok(Array.isArray(m)&&m.length>=4,`finca${q}: hay montañas registradas`); if (!Array.isArray(m)) continue;
  let malas=[]; for (let i=0;i<m.length;i++) for (let j=i+1;j<m.length;j++){ const a=m[i],b=m[j]; if (Math.abs(a.x-b.x)<(a.w+b.w)/2 && Math.abs(a.z-b.z)<.2) malas.push([a.x,b.x]); }
  T.ok(malas.length===0,`finca${q}: las que se solapan están a distinta profundidad ${JSON.stringify(malas)}`); await p.context().close(); }
 await T.fin(); })();
