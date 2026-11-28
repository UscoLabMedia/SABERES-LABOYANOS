// Lógica pura de recetas: Node sin navegador. Uso: node tests/recetas.js
const T=require('./lib'), fs=require('fs'), path=require('path'), vm=require('vm');
const ROOT=path.resolve(__dirname,'..');
const sb={console}; sb.window=sb; vm.createContext(sb); vm.runInContext(fs.readFileSync(path.join(ROOT,'recetas.js'),'utf8'),sb);
const R=sb.Recetas, datos=JSON.parse(fs.readFileSync(path.join(ROOT,'data/recetas2.json'),'utf8'));
const j=x=>JSON.stringify(x);
T.ok(!!R,'window.Recetas existe'); R.usar(datos); T.ok(R.datos===datos,'usar fija datos');
const rec={ matera:'barro,amasar,torno,secar,hornear,entregar', jarron:'barro,amasar,torno,secar,hornear,pintar,entregar',
  frutero:'barro,amasar,modelar,secar,hornear,pintar,entregar', chiva:'barro,amasar,carroceria,carga,pegar,secar,hornear,pintar,entregar' };
const pts={matera:10,jarron:14,frutero:14,chiva:40};
for (const f in rec){ const d=R.datos.figuras[f]; T.ok(d&&d.pasos.join()===rec[f],'receta '+f); T.ok(d.puntos===pts[f],'puntos '+f);
  T.ok(d.fuente===(f==='chiva'?'verificada':'juego'),'fuente '+f); T.ok(d.colores===(f==='chiva'),'colores '+f);
  d.pasos.forEach(p=>T.ok(!!R.datos.pasos[p],'nombre visible de '+p)); }
T.ok(j(R.datos.colores)===j(['rojo','amarillo','azul','verde']),'colores');
const est={barro:'barro',amasar:'amasado',torno:'torno',modelar:'mesa',carroceria:'mesa',carga:'mesa',pegar:'mesa',secar:'secadero',hornear:'horno',pintar:'pintura',entregar:'mostrador'};
for (const p in est) T.ok(R.estacion(p)===est[p],'estacion '+p);
T.ok(R.paso({fig:null,i:0})==='barro'&&R.paso({fig:null,i:1})==='amasar','prefijo común');
T.ok(R.paso({fig:null,i:2})===null,'fig null i>=2 -> null');
T.ok(R.paso({fig:'matera',i:9})===null,'fuera de receta -> null');
T.ok(R.paso({fig:'matera',i:2})==='torno','paso matera 2');
T.ok(R.acepta('pintura',{fig:'matera',i:5})===false&&R.acepta('mostrador',{fig:'matera',i:5})===true,'acepta');
T.ok(R.acepta('barro',{fig:null,i:0})===true,'acepta barro null');
const a={fig:'jarron',i:1}, b=R.avanza(a); T.ok(b.i===2&&a.i===1&&b.fig==='jarron'&&b!==a,'avanza copia');
T.ok(j(R.figurasPara('torno',[{fig:'chiva'},{fig:'jarron'},{fig:'matera'},{fig:'jarron'}]))===j(['jarron','matera']),'figurasPara torno');
T.ok(j(R.figurasPara('mesa',[{fig:'chiva'},{fig:'jarron'},{fig:'frutero'},{fig:'chiva'}]))===j(['chiva','frutero']),'figurasPara mesa');
T.ok(j([1,2,3,4].map(R.paciencia))===j([120,90,70,70]),'paciencia');
T.ok(j([1,2,3,4].map(R.maxClientes))===j([2,3,3,3]),'maxClientes');
let bien=true; for (let k=0;k<200;k++){ const c=R.coloresAzar(); if(c.length!==2||c[0]===c[1]||!datos.colores.includes(c[0])||!datos.colores.includes(c[1])) bien=false; }
T.ok(bien,'coloresAzar 200 veces');
T.ok(j(R.coloresAzar(()=>0))===j(['rojo','amarillo']),'coloresAzar con rnd fijo');
T.fin();
