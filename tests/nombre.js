// Aviso: el nombre del usuario es el que aparece bajo el jugador y en los diálogos (no «visitante»).
const T=require('./lib');
(async()=>{ const {p}=await T.abrir('finca.html#prueba'); await p.waitForFunction(()=>window.__f&&__f.npcs&&__f.npcs.length===3,null,{timeout:30000});
  const usuario=await p.evaluate(()=>Guardado.perfil().nombre); await p.waitForTimeout(600);
  const et=await p.evaluate(()=>{ const e=document.getElementById('nombreJ'); if (!e) return null; const r=e.getBoundingClientRect(), pl=__f.player(); return {txt:e.textContent,vis:r.width>0&&r.top>0&&r.top<innerHeight&&!e.hidden}; });
  T.ok(et&&et.txt===usuario&&et.vis,`bajo el jugador aparece el usuario «${usuario}»: ${JSON.stringify(et)}`);
  await p.evaluate(()=>{ const n=__f.npcs[0], pl=__f.player(); pl.x=n.x; pl.z=n.z+1; }); await p.waitForTimeout(500); await p.keyboard.press('e'); await p.waitForTimeout(1500); await p.keyboard.press('e'); await p.waitForTimeout(300);
  const linea=await p.evaluate(()=>document.getElementById('dlgLine').textContent); const dlg=await p.evaluate(()=>__f.LEVEL.npcs[0].dialogo[0]);
  // el primer diálogo saluda con {nombre}: se compara contra el texto ya mostrado
  T.ok(!/visitante/.test(linea)&&(!/\{nombre\}/.test(dlg)||linea.includes(usuario)),`el diálogo usa el usuario, no «visitante»: «${linea.slice(0,60)}»`);
  T.ok(p.errs.length===0,'sin errores '+JSON.stringify(p.errs)); await T.fin(); })();
