// Task 1: orden de niveles (Café → Alfarería → Caballos → Música y Danza) y atuendos por etapa.
const T=require('./lib');
(async()=>{ const {p,url}=await T.abrir('index.html#prueba'); await p.waitForFunction(()=>window.__i&&typeof THREE!=='undefined',null,{timeout:20000}); await p.addScriptTag({url:url+'muneco.js'});   // la portada no carga el muñeco; se inyecta
 const r=await p.evaluate(()=>{ const cuenta=(e,f)=>{ let n=0; Muneco.jugador(e,f).traverse(o=>{ if (o.isMesh) n++; }); return n; };
   return { need:{taller:__i.PLACES.taller.need,caballos:__i.PLACES.caballos.need,tarima:__i.PLACES.tarima.need}, lv:__i.PLACES.taller.level+'|'+__i.PLACES.caballos.level+'|'+__i.PLACES.tarima.level, LEVELS:__i.LEVELS.map(l=>l.join(':')).join(','),
     m:[0,1,2,3,4].map(e=>cuenta(e,false)), f:[0,1,2,3,4].map(e=>cuenta(e,true)) }; });
 T.ok(r.need.taller==='El Café','taller exige El Café ('+r.need.taller+')'); T.ok(r.need.caballos==='La Alfarería','caballos exige La Alfarería ('+r.need.caballos+')'); T.ok(r.need.tarima==='Los Caballos','tarima exige Los Caballos ('+r.need.tarima+')');
 T.ok(r.lv==='Nivel 2 · La Alfarería|Nivel 3 · Los Caballos|Nivel 4 · Música y Danza','etiquetas de nivel '+r.lv);
 T.ok(r.LEVELS==='El Café:nivel1,La Alfarería:nivel2,Los Caballos:nivel3,Música y Danza:nivel4','LEVELS '+r.LEVELS);
 T.ok(r.m.every(n=>n>0)&&r.f.every(n=>n>0),'las 5 etapas construyen (muñeco '+r.m+' / muñeca '+r.f+')');
 T.ok(r.m[3]>r.m[2]&&r.m[4]>r.m[3],'muñeco: cada etapa 2→3→4 suma prendas '+r.m);
 T.ok(p.errs.length===0,'sin errores '+JSON.stringify(p.errs)); await T.fin(); })();
