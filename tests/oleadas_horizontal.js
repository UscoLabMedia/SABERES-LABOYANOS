// Aviso de la probadora: en oleadas con el celular en horizontal el panel de arriba y el aviso de abajo ocupan demasiado y tapan los controles.
const T=require('./lib');
(async()=>{ for (const [n,vw,vh] of [['horizontal 844x390',844,390],['horizontal 740x360',740,360]]){
  const {p}=await T.abrir('oleadas.html#prueba',{viewport:{width:vw,height:vh},hasTouch:true,isMobile:true}); await p.waitForFunction(()=>window.__o&&__o.game.on,null,{timeout:30000});
  const r=await p.evaluate(()=>{ const b=document.getElementById('banner'); b.className='banner show'; b.innerHTML='<b>¡Oleada superada!</b><span>La broca es un cucarrón diminuto que perfora la cereza para poner sus huevos. Recoger los granos que caen al suelo ayuda a cortar su ciclo.</span>';
    const R=e=>{ const r=e.getBoundingClientRect(); return {l:r.left,t:r.top,r:r.right,b:r.bottom,w:r.width,h:r.height}; }; const pan=R(document.querySelector('.panel')), ban=R(b), joy=R(document.getElementById('joy')), palo=R(document.getElementById('tHit')), pow=document.getElementById('powBtn').hidden?null:R(document.getElementById('powBtn'));
    const cruza=(a,c)=>c&&a.l<c.r&&a.r>c.l&&a.t<c.b&&a.b>c.t; return {H:innerHeight,pan,ban,tapa:[cruza(ban,joy),cruza(ban,palo),cruza(ban,pow)]}; });
  T.ok(r.pan.h<=r.H*.22,`${n}: el panel de arriba ocupa poco (${Math.round(r.pan.h)} de ${r.H} px)`);
  T.ok(r.ban.h<=r.H*.18,`${n}: el aviso de abajo ocupa poco (${Math.round(r.ban.h)} de ${r.H} px)`);
  T.ok(!r.tapa.some(Boolean),`${n}: el aviso no tapa la palanca ni los botones ${JSON.stringify(r.tapa)}`);
  await p.context().close(); }
 await T.fin(); })();
