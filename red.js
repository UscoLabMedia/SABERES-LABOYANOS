/* red.js — salas para jugar en red: cada jugador en su propio celular o PC.
   Usa PeerJS (WebRTC). El anfitrión corre el juego; los demás envían sus controles y reciben el estado.
   Red.sala(contenedor, opciones) arma la pantalla de sala dentro de la hoja de inicio de cada minijuego.
   Mensajes del anfitrión: {t:'lobby'}, {t:'inicio', jugadores}, {t:'estado', s}, {t:'fin', r}, {t:'ir', url}.
   Mensajes de los invitados: {t:'hola', nombre, avatar}, {t:'in', ...controles}. */
(() => {
'use strict';
const CFG = (window.LABOYOS_CONFIG || {}).peer || {};
const PREF = 'laboyos-sala-';
const MAX = 4;
const SS = { get(){ try { const v = JSON.parse(sessionStorage.getItem('laboyos.sala') || 'null'); return v && Date.now() - v.t < 15*60e3 ? v : null; } catch (e) { return null; } },
             set(v){ try { sessionStorage.setItem('laboyos.sala', JSON.stringify({ ...v, t:Date.now() })); } catch (e) {} },
             clear(){ try { sessionStorage.removeItem('laboyos.sala'); } catch (e) {} } };
const codigo4 = () => { const A='ABCDEFGHJKLMNPQRSTUVWXYZ'; let s=''; for (let i=0;i<4;i++) s+=A[Math.random()*A.length|0]; return s; };
const disponible = () => typeof window.Peer !== 'undefined';
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

const CSS = `
.sala{display:grid;gap:.7rem;margin-top:.8rem}
.sala .modo{display:inline-flex;border:1.5px solid currentColor;flex-wrap:wrap;width:max-content;max-width:100%}
.sala .modo button{font:700 .92rem var(--f-ui,system-ui);background:transparent;border:0;padding:.45rem .85rem;cursor:pointer;color:inherit}
.sala .modo button + button{border-left:1.5px solid currentColor}
.sala .modo button[aria-pressed="true"]{background:var(--ink,#2a1c11);color:var(--paper,#efe3c6)}
.sala .caja{background:rgba(42,28,17,.06);padding:.7rem .9rem;display:grid;gap:.45rem}
.sala .cod{font:800 2.2rem var(--f-display,serif);letter-spacing:.25em;line-height:1}
.sala .ayuda{font-size:.9rem;color:var(--ink-soft,#6b5640);margin:0}
.sala ul{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:.4rem}
.sala li{font-weight:700;font-size:.9rem;padding:.2rem .6rem;border:1.5px solid rgba(42,28,17,.35)}
.sala li.tu{border-color:var(--cherry,#c8101e)}
.sala .fila{display:flex;gap:.5rem;flex-wrap:wrap;align-items:center}
.sala input{font:800 1.4rem var(--f-display,serif);letter-spacing:.25em;text-transform:uppercase;width:7.5rem;padding:.35rem .5rem;border:1.5px solid var(--ink,#2a1c11);background:#fbf5e6;color:var(--ink,#2a1c11)}
.sala .estado{font-weight:700;font-size:.92rem;margin:0}
.sala .estado.err{color:var(--cherry,#c8101e)}`;

function sala(cont, o){
  if (!document.getElementById('sala-css')){ const st=document.createElement('style'); st.id='sala-css'; st.textContent=CSS; document.head.appendChild(st); }
  const yo = { nombre:o.nombre||'Jugador', avatar:o.avatar||'muneco' };
  const S = { rol:'solo', peer:null, conns:[], conn:null, code:null, slot:0, jugadores:[{slot:0,...yo}], empezado:false };
  cont.innerHTML = `<div class="sala">
    <div class="modo" role="group" aria-label="Cómo jugar">
      <button data-m="solo">Solo</button><button data-m="host">Crear sala</button><button data-m="cliente">Unirme a una sala</button>
    </div>
    <div class="caja" data-p="host" hidden>
      <span class="ayuda">Código de la sala</span><span class="cod" aria-live="polite">····</span>
      <p class="ayuda">En los otros celulares o computadores abran el juego, entren a esta misma pantalla, elijan «Unirme a una sala» y escriban el código. Máximo ${MAX} jugadores.</p>
      <ul aria-label="Jugadores en la sala"></ul><p class="estado" aria-live="polite"></p>
    </div>
    <div class="caja" data-p="cliente" hidden>
      <div class="fila"><label for="sala-cod" class="ayuda">Código</label><input id="sala-cod" maxlength="4" autocomplete="off" inputmode="text"><button class="btn" data-entrar>Entrar</button></div>
      <ul aria-label="Jugadores en la sala"></ul><p class="estado" aria-live="polite"></p>
    </div></div>`;
  const $ = s => cont.querySelector(s);
  const estado = (p, txt, err) => { const e=$(`[data-p="${p}"] .estado`); e.textContent=txt; e.classList.toggle('err', !!err); };
  const lista = () => { cont.querySelectorAll('ul').forEach(ul => ul.innerHTML = S.jugadores.map(j=>`<li class="${j.slot===S.slot?'tu':''}">J${j.slot+1} · ${esc(j.nombre)}${j.slot===S.slot?' (tú)':''}</li>`).join('')); };
  const avisar = () => o.onCambio && o.onCambio(api);

  function modo(m){
    if (S.empezado) return;
    if (m !== S.rol) cerrar(false);
    S.rol = m; cont.querySelectorAll('[data-m]').forEach(b=>b.setAttribute('aria-pressed', b.dataset.m===m));
    $('[data-p="host"]').hidden = m!=='host'; $('[data-p="cliente"]').hidden = m!=='cliente';
    S.slot = 0; S.jugadores = [{slot:0,...yo}];
    if (m==='host') crear(); if (m==='cliente'){ lista(); $('#sala-cod').focus(); estado('cliente',''); }
    if (m==='solo') SS.clear();
    avisar();
  }
  cont.querySelectorAll('[data-m]').forEach(b=>b.addEventListener('click',()=>modo(b.dataset.m)));

  // ---- anfitrión
  function crear(code, intento=0){
    if (!disponible()){ estado('host','No se pudo cargar el sistema de salas. Revisa la conexión.',true); return; }
    code = code || codigo4(); estado('host','Abriendo la sala…'); $('.cod').textContent='····';
    const peer = new window.Peer(PREF+code, { ...CFG, debug:0 }); S.peer = peer;
    peer.on('open', () => { S.code=code; $('.cod').textContent=code; estado('host','Sala abierta. Esperando jugadores.'); SS.set({rol:'host',code}); lista(); avisar(); });
    peer.on('error', e => {
      if (e.type==='unavailable-id' && intento<8){ peer.destroy(); setTimeout(()=>{ if (S.rol==='host') crear(SS.get()?.code===code?code:null, intento+1); }, 1500); return; }
      estado('host', e.type==='network'||e.type==='server-error'||e.type==='socket-error' ? 'Sin conexión con el servidor de salas. Revisa el internet.' : 'No se pudo abrir la sala.', true); });
    peer.on('connection', conn => {
      conn.on('open', () => {
        if (S.empezado || S.conns.length >= MAX-1){ conn.send({t:'lleno'}); setTimeout(()=>conn.close(),300); return; }
        const usados=new Set(S.jugadores.map(j=>j.slot)); let slot=1; while (usados.has(slot)) slot++;
        conn.slot=slot; S.conns.push(conn); });
      conn.on('data', d => {
        if (d && d.t==='hola'){ S.jugadores=S.jugadores.filter(j=>j.slot!==conn.slot); S.jugadores.push({slot:conn.slot,nombre:String(d.nombre||'Jugador').slice(0,24),avatar:d.avatar==='muneca'?'muneca':'muneco'});
          S.jugadores.sort((a,b)=>a.slot-b.slot); conn.send({t:'bienvenida',slot:conn.slot}); difundir({t:'lobby',jugadores:S.jugadores}); lista(); avisar(); return; }
        o.onMensaje && o.onMensaje(d, conn.slot); });
      conn.on('close', () => { S.conns=S.conns.filter(c=>c!==conn); if (!S.empezado){ S.jugadores=S.jugadores.filter(j=>j.slot!==conn.slot); difundir({t:'lobby',jugadores:S.jugadores}); lista(); avisar(); }
        o.onSalida && o.onSalida(conn.slot); });
    });
  }
  // ---- invitado
  function unirse(code, intento=0){
    code = String(code||'').toUpperCase().replace(/[^A-Z]/g,'');
    if (code.length!==4){ estado('cliente','Escribe las 4 letras del código.',true); return; }
    if (!disponible()){ estado('cliente','No se pudo cargar el sistema de salas. Revisa la conexión.',true); return; }
    cerrar(false); estado('cliente', intento?'Reconectando…':'Buscando la sala…');
    const peer = new window.Peer({ ...CFG, debug:0 }); S.peer = peer;
    peer.on('open', () => {
      const conn = peer.connect(PREF+code, { reliable:true, serialization:'json' }); S.conn = conn;
      conn.on('open', () => { S.code=code; conn.send({t:'hola',...yo}); SS.set({rol:'cliente',code}); });
      conn.on('data', d => {
        if (d.t==='bienvenida'){ S.slot=d.slot; estado('cliente','Dentro de la sala. Espera a que el anfitrión empiece.'); avisar(); return; }
        if (d.t==='lobby'){ S.jugadores=d.jugadores; lista(); avisar(); return; }
        if (d.t==='lleno'){ estado('cliente','La sala está llena o ya empezó.',true); return; }
        if (d.t==='inicio'){ S.jugadores=d.jugadores; S.empezado=true; o.onEmpezar && o.onEmpezar(S.jugadores, api, d); return; }
        if (d.t==='ir'){ SS.set({rol:'cliente',code:S.code}); location.href=d.url; return; }
        o.onMensaje && o.onMensaje(d, 0); });
      conn.on('close', () => { if (S.rol!=='cliente') return; o.onCierre ? o.onCierre() : null; estado('cliente','Se cerró la sala.',true); S.empezado=false; });
    });
    peer.on('error', e => {
      if (e.type==='peer-unavailable' && intento<10 && SS.get()?.code===code){ peer.destroy(); setTimeout(()=>{ if (S.rol==='cliente') unirse(code,intento+1); },1500); return; }
      estado('cliente', e.type==='peer-unavailable' ? 'No existe una sala con ese código.' : 'Sin conexión con el servidor de salas. Revisa el internet.', true); });
  }
  $('[data-entrar]').addEventListener('click',()=>unirse($('#sala-cod').value));
  $('#sala-cod').addEventListener('keydown',e=>{ if (e.key==='Enter'){ e.preventDefault(); unirse(e.target.value); } });

  function difundir(d){ S.conns.forEach(c=>{ if (c.open) c.send(d); }); }
  function cerrar(borrar=true){ try { S.conn && S.conn.close(); } catch(e){} try { S.peer && S.peer.destroy(); } catch(e){} S.peer=null; S.conn=null; S.conns=[]; if (borrar) SS.clear(); }

  const api = {
    get rol(){ return S.rol; }, get slot(){ return S.slot; }, get jugadores(){ return S.jugadores; }, get code(){ return S.code; },
    get listo(){ return S.rol==='solo' || (S.rol==='host' && !!S.code) ; },
    empezar(){ if (S.rol==='host'){ S.empezado=true; difundir({t:'inicio',jugadores:S.jugadores}); } return S.jugadores; },
    reabrir(){ S.empezado=false; },
    difundir, enviar(d){ if (S.conn && S.conn.open) S.conn.send(d); },
    ir(url){ if (S.rol==='host'){ difundir({t:'ir',url}); SS.set({rol:'host',code:S.code}); setTimeout(()=>location.href=url,350); } else location.href=url; },
    salir(){ cerrar(true); },
  };
  // Volver a la misma sala al pasar de un minijuego a otro
  const prev = SS.get();
  if (prev && prev.rol==='host'){ cont.querySelectorAll('[data-m]').forEach(b=>b.setAttribute('aria-pressed', b.dataset.m==='host')); S.rol='host'; $('[data-p="host"]').hidden=false; crear(prev.code); }
  else if (prev && prev.rol==='cliente'){ S.rol='cliente'; cont.querySelectorAll('[data-m]').forEach(b=>b.setAttribute('aria-pressed', b.dataset.m==='cliente')); $('[data-p="cliente"]').hidden=false; $('#sala-cod').value=prev.code; unirse(prev.code); }
  else modo('solo');
  setTimeout(avisar);
  return api;
}

window.Red = { sala, disponible };
})();
