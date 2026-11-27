/* inicio.js — pantalla "¿Quién juega?" antes del libro.
   Se muestra una vez por visita (sessionStorage), así volver de un minijuego no la repite.
   Usa Guardado: crearPerfil, usarPerfil, importar, tienePin, verificarPin, progresoDe. */
(() => {
'use strict';
const KEY = 'laboyos.entrada';
const ses = { get(){ try { return sessionStorage.getItem(KEY); } catch (e) { return '1'; } },
              set(){ try { sessionStorage.setItem(KEY, '1'); } catch (e) {} },
              del(){ try { sessionStorage.removeItem(KEY); } catch (e) {} } };
window.cerrarSesion = () => { ses.del(); location.reload(); };
if (ses.get()) return;

const $ = s => document.querySelector(s), box = $('#inicio'), paso = $('#inPaso');
const esc = s => String(s).replace(/[<>&"]/g, '');
const vacio = p => p.nombre === 'Jugador 1' && !Guardado.progresoDe(p.id).actualizado;   // perfil automático sin uso
const usables = () => Guardado.perfiles().filter(p => !vacio(p));
const entrar = id => { Guardado.usarPerfil(id); ses.set(); location.reload(); };
const pedirPin = id => Guardado.tienePin(id) ? pantallaPin(id) : entrar(id);
const resumen = p => { const g = Guardado.progresoDe(p.id); return g.nivel1 ? 'Nivel 1 superado' : (g.pistas1 && g.pistas1.length ? `${g.pistas1.length} pistas` : 'Sin avance'); };

function pantallaMenu(){
  const lista = usables(), act = Guardado.perfil(), cont = lista.find(p => p.id === act.id) || lista[0];
  paso.innerHTML = `<div class="in-menu">
    ${cont ? `<button class="btn solid" data-a="cont">Continuar como ${esc(cont.nombre)}<small>${esc(resumen(cont))}${Guardado.tienePin(cont.id) ? ' · con PIN' : ''}</small></button>` : ''}
    <button class="btn${cont ? '' : ' solid'}" data-a="nueva">Nueva partida</button>
    ${lista.length > 1 ? '<button class="btn" data-a="lista">Cambiar de persona</button>' : ''}
    <button class="btn" data-a="codigo">Entrar con mi código</button></div>`;
  paso.onclick = e => { const a = e.target.closest('[data-a]'); if (!a) return;
    ({ cont: () => pedirPin(cont.id), nueva: pantallaNueva, lista: pantallaLista, codigo: pantallaCodigo })[a.dataset.a](); };
  (paso.querySelector('.solid') || paso.querySelector('.btn')).focus();
}
function pantallaNueva(){
  paso.innerHTML = `<form class="in-form" autocomplete="off" novalidate>
    <label for="inNombre">Tu nombre</label><input type="text" id="inNombre" maxlength="24" placeholder="Nombre del estudiante" required>
    <label for="inPin">PIN de 4 números (opcional)</label><input type="password" id="inPin" inputmode="numeric" maxlength="4" pattern="\\d{4}" placeholder="Para que nadie entre a tu avance">
    <p class="in-err" id="inErr" role="alert"></p>
    <div class="in-acts"><button type="button" class="btn" data-a="volver">Volver</button><button class="btn solid">Empezar</button></div></form>`;
  $('#inNombre').focus();
  paso.querySelector('[data-a="volver"]').onclick = pantallaMenu;
  paso.querySelector('form').onsubmit = e => { e.preventDefault();
    const nombre = $('#inNombre').value.trim(), pin = $('#inPin').value.trim(), err = $('#inErr');
    if (!nombre) return err.textContent = 'Escribe tu nombre.';
    if (pin && !/^\d{4}$/.test(pin)) return err.textContent = 'El PIN son 4 números, o déjalo vacío.';
    const vac = Guardado.perfiles().find(vacio);               // reusa el perfil automático vacío
    let p; if (vac){ Guardado.usarPerfil(vac.id); Guardado.actualizarPerfil({ nombre }); p = Guardado.perfil(); if (pin) Guardado.ponerPin(p.id, pin); }
    else p = Guardado.crearPerfil(nombre, pin);
    entrar(p.id); };
}
function pantallaLista(){
  paso.innerHTML = `<ul class="in-lista">${usables().map(p => `<li><button class="btn" data-id="${p.id}">${esc(p.nombre)}<small>${esc(resumen(p))}${Guardado.tienePin(p.id) ? ' · con PIN' : ''}</small></button></li>`).join('')}</ul>
    <div class="in-acts"><button class="btn" data-a="volver">Volver</button></div>`;
  paso.onclick = e => { if (e.target.closest('[data-a="volver"]')) return pantallaMenu(); const b = e.target.closest('[data-id]'); if (b) pedirPin(b.dataset.id); };
}
function pantallaPin(id){
  const p = Guardado.perfiles().find(q => q.id === id);
  paso.innerHTML = `<form class="in-form" autocomplete="off" novalidate><label for="inPin2">PIN de ${esc(p.nombre)}</label>
    <input type="password" id="inPin2" inputmode="numeric" maxlength="4" pattern="\\d{4}" required><p class="in-err" id="inErr" role="alert"></p>
    <div class="in-acts"><button type="button" class="btn" data-a="volver">Volver</button><button class="btn solid">Entrar</button></div></form>`;
  $('#inPin2').focus(); paso.querySelector('[data-a="volver"]').onclick = pantallaMenu;
  paso.querySelector('form').onsubmit = e => { e.preventDefault();
    if (Guardado.verificarPin(id, $('#inPin2').value)) entrar(id); else { $('#inErr').textContent = 'PIN incorrecto.'; $('#inPin2').value = ''; } };
}
function pantallaCodigo(){
  paso.innerHTML = `<form class="in-form"><label for="inCod">Tu código (LAB-XXXXXX o el de respaldo)</label>
    <textarea id="inCod" rows="3" placeholder="LAB-K7M2PQ" style="font:.8rem/1.3 monospace;width:100%;box-sizing:border-box;border:1.5px solid var(--ink);background:#fbf5e6;padding:.5rem"></textarea>
    <p class="in-err" id="inErr" role="alert"></p>
    <div class="in-acts"><button type="button" class="btn" data-a="volver">Volver</button><button class="btn solid">Cargar</button></div></form>`;
  $('#inCod').focus(); paso.querySelector('[data-a="volver"]').onclick = pantallaMenu;
  paso.querySelector('form').onsubmit = async e => { e.preventDefault(); const err = $('#inErr'); err.textContent = 'Buscando…';
    try { const p = await Guardado.entrarConCodigo($('#inCod').value); entrar(p.id); } catch (x) { err.textContent = x.message; } };
}

// bloquea Enter/Espacio/Escape del libro mientras la pantalla está abierta
addEventListener('keydown', e => { if (!box.hidden && !box.contains(e.target)) e.stopImmediatePropagation(); }, true);
addEventListener('keydown', e => { if (!box.hidden && e.key === 'Escape') e.stopImmediatePropagation(); }, true);
box.hidden = false; pantallaMenu();
})();
