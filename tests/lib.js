// Ayudas de prueba: servidor estático, Chrome sin pantalla y three.js local (el CDN no es alcanzable aquí).
// Uso: const T=require('./lib'); const {b,c,p,url}=await T.abrir('index.html#prueba',{viewport:{width:390,height:844}});
const { chromium } = require('playwright'); const http=require('http'), fs=require('fs'), path=require('path');
const ROOT=path.resolve(__dirname,'..'), THREE=process.env.THREE_JS||'/tmp/claude-0/-home-user-SABERES-LABOYANOS/c8e33183-b975-5016-aab3-086f259bc394/scratchpad/lib/node_modules/three/build/three.min.js';
const MIME={'.html':'text/html;charset=utf-8','.js':'application/javascript','.json':'application/json','.jpg':'image/jpeg','.png':'image/png','.mp3':'audio/mpeg'};
let srv, port; async function servir(){ if (srv) return port; srv=http.createServer((q,r)=>{ const f=path.join(ROOT,decodeURIComponent(q.url.split('?')[0]).replace(/^\//,'')||'index.html'); fs.readFile(f,(e,d)=>{ if(e){ r.writeHead(404); return r.end(); } r.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream'}); r.end(d); }); });
  await new Promise(ok=>srv.listen(0,ok)); port=srv.address().port; return port; }
let br; async function abrir(ruta,opt={},prep){ const pt=await servir(); br=br||await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--enable-unsafe-swiftshader']});
  const c=await br.newContext(Object.assign({viewport:{width:1280,height:760}},opt)); await c.route('**/three.min.js',r=>r.fulfill({contentType:'application/javascript',body:fs.readFileSync(THREE)}));
  await c.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());   // el CSS remoto bloquea los scripts si la red no responde
  if (prep) await prep(c);   // p. ej. bloquear un archivo: c=>c.route('**/data/x.json',r=>r.abort())
  const p=await c.newPage(); p.errs=[]; p.on('pageerror',e=>p.errs.push(e.message)); await p.goto(`http://localhost:${pt}/${ruta}`); return {c,p,url:`http://localhost:${pt}/`}; }
let fallos=0; const ok=(c,m)=>{ console.log((c?'OK   ':'FALLA ')+m); if(!c) fallos++; };
async function fin(){ if (br) await br.close(); if (srv) srv.close(); console.log(fallos?`${fallos} FALLOS`:'TODO OK'); process.exit(fallos?1:0); }
module.exports={abrir,ok,fin,servir};
