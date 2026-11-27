/* inicio.js — pantalla de entrada: usuario y contraseña, y luego Continuar / Nueva partida.
   Se muestra mientras no haya sesión y partida abierta (la sesión vive solo en la pestaña).
   Usa Guardado.cuenta (ver guardado.js). */
(() => {
'use strict';
const C = Guardado.cuenta;
window.cerrarSesion = () => { C.salir(); location.reload(); };
window.cambiarPartida = () => { C.cerrarPartida(); location.reload(); };
if (C.activa()) return;

const $ = s => document.querySelector(s), box = $('#inicio'), paso = $('#inPaso');
const esc = s => String(s == null ? '' : s).replace(/[<>&"]/g, '');
const fecha = iso => { try { return new Date(iso).toLocaleDateString('es-CO', { day:'numeric', month:'short', year:'numeric' }); } catch (e) { return ''; } };
const resumen = d => { d = d || {}; return d.nivel1 ? 'Nivel 1 superado' : (d.pistas1 && d.pistas1.length ? `${d.pistas1.length} de 3 pistas` : 'Sin avance'); };
const titulo = t => { $('#inTitle').textContent = t; };
const ocupado = (btn, txt) => { btn.disabled = true; btn.dataset.t = btn.textContent; btn.textContent = txt; };
const libre = btn => { btn.disabled = false; btn.textContent = btn.dataset.t || btn.textContent; };
const campo = (id, rotulo, tipo, extra = '') => `<label for="${id}">${rotulo}</label><input type="${tipo}" id="${id}" ${extra}>`;

function pantallaLogin(msg){
  titulo('Entrar');
  paso.innerHTML = `<form class="in-form" novalidate>${campo('inUser', 'Usuario', 'text', 'autocomplete="username" autocapitalize="none" maxlength="20"')}
    ${campo('inPass', 'Contraseña', 'password', 'autocomplete="current-password"')}
    <p class="in-err" id="inErr" role="alert">${esc(msg || '')}</p>
    <button class="btn solid" id="inGo">Entrar</button>
    <p class="in-alt">¿No tienes usuario? <button type="button" class="in-link" id="inReg">Crear usuario</button></p>
    <p class="in-ayuda" id="inOlvide">¿Olvidaste tu contraseña? No se puede recuperar sola: pide ayuda a tu docente.</p></form>`;
  $('#inUser').focus(); $('#inReg').onclick = () => pantallaRegistro();
  paso.querySelector('form').onsubmit = async e => { e.preventDefault(); const b = $('#inGo'), err = $('#inErr'); err.textContent = ''; ocupado(b, 'Entrando…');
    try { await C.entrar($('#inUser').value, $('#inPass').value); await pantallaPartidas(); } catch (x) { err.textContent = x.message; libre(b); } };
}
function pantallaRegistro(){
  titulo('Crear usuario');
  paso.innerHTML = `<form class="in-form" novalidate>${campo('inUser', 'Usuario (un apodo, sin apellidos)', 'text', 'autocomplete="username" autocapitalize="none" maxlength="20" placeholder="ana_07"')}
    <span class="in-ayuda">3 a 20 letras, números o guion bajo.</span>
    <p class="in-aviso"><b>Anota tu usuario y tu contraseña.</b> Si la olvidas no se puede recuperar sola: tendrás que pedir ayuda a tu docente. Usa un apodo, no tu nombre completo.</p>
    ${campo('inPass', 'Contraseña (mínimo 6)', 'password', 'autocomplete="new-password"')}
    ${campo('inPass2', 'Repite la contraseña', 'password', 'autocomplete="new-password"')}
    <p class="in-err" id="inErr" role="alert"></p>
    <div class="in-acts"><button type="button" class="btn" id="inVol">Volver</button><button class="btn solid" id="inGo">Crear usuario</button></div></form>`;
  $('#inUser').focus(); $('#inVol').onclick = () => pantallaLogin();
  paso.querySelector('form').onsubmit = async e => { e.preventDefault(); const b = $('#inGo'), err = $('#inErr'); err.textContent = '';
    if ($('#inPass').value !== $('#inPass2').value) return err.textContent = 'Las contraseñas no son iguales.';
    ocupado(b, 'Creando…'); try { await C.registrar($('#inUser').value, $('#inPass').value); await pantallaPartidas(); } catch (x) { err.textContent = x.message; libre(b); } };
}
async function pantallaPartidas(msg){
  titulo(`Hola, ${esc(C.usuario())}`); paso.innerHTML = '<p>Buscando tus partidas…</p>';
  let lista; try { lista = await C.partidas(); } catch (x) { return paso.innerHTML = `<p class="in-err">${esc(x.message)}</p><div class="in-acts"><button class="btn" id="inSal">Cerrar sesión</button><button class="btn solid" id="inRe">Reintentar</button></div>`,
    $('#inSal').onclick = window.cerrarSesion, $('#inRe').onclick = () => pantallaPartidas(); }
  const ult = lista[0];
  paso.innerHTML = `<div class="in-menu">
    ${ult ? `<button class="btn solid" data-a="cont">Continuar: ${esc(ult.nombre)}<small>${esc(resumen(ult.datos))} · ${esc(fecha(ult.actualizada))}</small></button>` : '<p>Aún no tienes partidas. Crea la primera.</p>'}
    <button class="btn${ult ? '' : ' solid'}" data-a="nueva">Nueva partida</button></div>
    ${lista.length ? `<h3 class="in-sub">Mis partidas</h3><ul class="in-lista">${lista.map(p => `<li><button class="btn" data-abrir="${esc(p.id)}">${esc(p.nombre)}<small>${esc(resumen(p.datos))} · ${esc(fecha(p.actualizada))}</small></button><button class="btn in-borrar" data-borrar="${esc(p.id)}" aria-label="Borrar la partida ${esc(p.nombre)}">Borrar</button></li>`).join('')}</ul>` : ''}
    <p class="in-err" id="inErr" role="alert">${esc(msg || '')}</p>
    <div class="in-pie"><button class="in-link" data-a="salir">Cerrar sesión</button><button class="in-link" data-a="cuenta">Borrar mi cuenta</button></div>`;
  const abrir = p => { C.abrir(p); location.reload(); };
  paso.onclick = e => { const t = e.target.closest('button'); if (!t) return;
    if (t.dataset.a === 'cont') return abrir(ult);
    if (t.dataset.a === 'nueva') return pantallaNueva();
    if (t.dataset.a === 'salir') return window.cerrarSesion();
    if (t.dataset.a === 'cuenta') return pantallaBorrarCuenta();
    if (t.dataset.abrir) return abrir(lista.find(p => p.id === t.dataset.abrir));
    if (t.dataset.borrar) return pantallaBorrarPartida(lista.find(p => p.id === t.dataset.borrar)); };
  (paso.querySelector('.solid') || paso.querySelector('.btn')).focus();
}
function pantallaNueva(){
  titulo('Nueva partida');
  paso.innerHTML = `<form class="in-form" novalidate>${campo('inNom', 'Nombre de la partida (opcional)', 'text', `maxlength="40" placeholder="${esc(Guardado.nombreAuto())}" autocomplete="off"`)}
    <span class="in-ayuda">Si lo dejas vacío, se llamará como la fecha y la hora de ahora.</span>
    <p class="in-err" id="inErr" role="alert"></p>
    <div class="in-acts"><button type="button" class="btn" id="inVol">Volver</button><button class="btn solid" id="inGo">Empezar</button></div></form>`;
  $('#inNom').focus(); $('#inVol').onclick = () => pantallaPartidas();
  paso.querySelector('form').onsubmit = async e => { e.preventDefault(); const b = $('#inGo'); ocupado(b, 'Creando…');
    try { await C.nueva($('#inNom').value); location.reload(); } catch (x) { $('#inErr').textContent = x.message; libre(b); } };
}
function pantallaBorrarPartida(p){
  titulo('Borrar partida');
  paso.innerHTML = `<p>¿Borrar «${esc(p.nombre)}»? Se pierde su progreso y no se puede recuperar.</p><p class="in-err" id="inErr" role="alert"></p>
    <div class="in-acts"><button class="btn" id="inNo">Cancelar</button><button class="btn solid" id="inSi">Sí, borrar</button></div>`;
  $('#inNo').focus(); $('#inNo').onclick = () => pantallaPartidas();
  $('#inSi').onclick = async () => { const b = $('#inSi'); ocupado(b, 'Borrando…'); try { await C.borrarPartida(p.id); await pantallaPartidas(`Se borró «${p.nombre}».`); } catch (x) { $('#inErr').textContent = x.message; libre(b); } };
}
function pantallaBorrarCuenta(){
  titulo('Borrar mi cuenta');
  paso.innerHTML = `<form class="in-form" novalidate><p>Se borra tu usuario <b>${esc(C.usuario())}</b> y <b>todas</b> sus partidas. No se puede recuperar.</p>
    ${campo('inConf', 'Para confirmar, escribe tu usuario', 'text', 'autocomplete="off" autocapitalize="none"')}
    <p class="in-err" id="inErr" role="alert"></p>
    <div class="in-acts"><button type="button" class="btn" id="inNo">Cancelar</button><button class="btn solid" id="inSi">Borrar mi cuenta</button></div></form>`;
  $('#inConf').focus(); $('#inNo').onclick = () => pantallaPartidas();
  paso.querySelector('form').onsubmit = async e => { e.preventDefault(); if ($('#inConf').value.trim().toLowerCase() !== C.usuario()) return $('#inErr').textContent = 'Escribe tu usuario tal como es.';
    const b = $('#inSi'); ocupado(b, 'Borrando…'); try { await C.borrarCuenta(); pantallaLogin('Tu cuenta se borró.'); } catch (x) { $('#inErr').textContent = x.message; libre(b); } };
}

// mientras la pantalla está abierta, el libro de atrás no recibe teclas
addEventListener('keydown', e => { if (!box.hidden && !box.contains(e.target)) e.stopImmediatePropagation(); }, true);
addEventListener('keydown', e => { if (!box.hidden && e.key === 'Escape') e.stopImmediatePropagation(); }, true);
addEventListener('laboyos:sesion-vencida', () => location.reload());
box.hidden = false;
(C.conSesion() ? pantallaPartidas() : pantallaLogin());
})();
