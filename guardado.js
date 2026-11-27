/* guardado.js — perfiles y progreso de "Saberes de Laboyos".
   - Cada equipo puede tener varios perfiles (uno por estudiante).
   - El progreso se guarda en el navegador y, si config.js tiene Supabase, también en la nube.
   - Un código de respaldo permite llevar el progreso a otro equipo.
   API: Guardado.tienePin(id), .ponerPin(id,pin), .verificarPin(id,pin), .progresoDe(id), Guardado.perfil(), .perfiles(), .progreso(), .guardar(prog), .crearPerfil(nombre),
        .usarPerfil(id), .actualizarPerfil({nombre, avatar}), .codigo(), .importar(codigo),
        .nube.estado ('local' | 'sincronizado' | 'pendiente' | 'error'), .sincronizar() */
(() => {
'use strict';
const CFG = (window.LABOYOS_CONFIG || {}).supabase || {};
const LS = {
  get(k, d){ try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
};
const K = { perfiles:'laboyos.perfiles', activo:'laboyos.perfil', prog:id=>'laboyos.progreso.'+id, pend:id=>'laboyos.pendiente.'+id, ajustes:'laboyos.settings' };
function nuevoId(){ const A='ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s=''; for (let i=0;i<6;i++) s+=A[Math.random()*A.length|0]; return 'LAB-'+s; }

let perfiles = LS.get(K.perfiles, []);
let activo = LS.get(K.activo, null);
// Primera vez: crea un perfil y trae el progreso de la versión anterior.
if (!perfiles.length){
  const aj = LS.get(K.ajustes, {});
  const p = { id:nuevoId(), nombre:(aj.name||'').trim() || 'Jugador 1', avatar:aj.avatar || 'muneco' };
  perfiles = [p]; activo = p.id;
  const viejo = LS.get('laboyos.progress', null);
  if (viejo) LS.set(K.prog(p.id), { ...viejo, actualizado:Date.now() });
  LS.set(K.perfiles, perfiles); LS.set(K.activo, activo);
}
if (!perfiles.find(p => p.id === activo)){ activo = perfiles[0].id; LS.set(K.activo, activo); }

const perfil = () => perfiles.find(p => p.id === activo);
const progreso = () => Object.assign({ etapa:0 }, LS.get(K.prog(activo), {}));
function guardar(prog){ prog.actualizado = Date.now(); LS.set(K.prog(activo), prog); LS.set(K.pend(activo), true); nube.subir(); return prog; }
function sincAjustes(){ const aj = LS.get(K.ajustes, {}); const p = perfil(); aj.name = p.nombre; aj.avatar = p.avatar; LS.set(K.ajustes, aj); }
// PIN opcional de 4 números. Es un freno contra entradas por error en un equipo compartido, no seguridad fuerte.
const hashPin = (id, pin) => { let h = 5381; for (const c of id + ':' + pin) h = ((h << 5) + h + c.charCodeAt(0)) | 0; return (h >>> 0).toString(36); };
const pinValido = pin => /^\d{4}$/.test(String(pin));
const tienePin = id => !!(perfiles.find(p => p.id === id) || {}).pin;
function ponerPin(id, pin){ const p = perfiles.find(q => q.id === id); if (!p) return false;
  if (!pin) delete p.pin; else if (pinValido(pin)) p.pin = hashPin(id, pin); else return false;
  LS.set(K.perfiles, perfiles); return true; }
const verificarPin = (id, pin) => { const p = perfiles.find(q => q.id === id); return !!p && (!p.pin || p.pin === hashPin(id, String(pin))); };
const progresoDe = id => Object.assign({ etapa:0 }, LS.get(K.prog(id), {}));
function crearPerfil(nombre, pin){ const p = { id:nuevoId(), nombre:(nombre||'').trim().slice(0,24) || `Jugador ${perfiles.length+1}`, avatar:'muneco' };
  if (pin && pinValido(pin)) p.pin = hashPin(p.id, pin);
  perfiles.push(p); LS.set(K.perfiles, perfiles); return p; }
function usarPerfil(id){ if (!perfiles.find(p => p.id === id)) return false; activo = id; LS.set(K.activo, id); sincAjustes(); return true; }
function actualizarPerfil(cambios){ const p = perfil(); if (cambios.nombre !== undefined) p.nombre = String(cambios.nombre).trim().slice(0,24) || p.nombre;
  if (cambios.avatar) p.avatar = cambios.avatar; LS.set(K.perfiles, perfiles); sincAjustes(); nube.subir(); return p; }

// Código de respaldo: perfil + progreso en un texto que se puede copiar.
function codigo(){ const json = JSON.stringify({ v:1, perfil:perfil(), progreso:progreso() });
  return btoa(unescape(encodeURIComponent(json))).replace(/=+$/,''); }
function importar(cod){
  let data; try { data = JSON.parse(decodeURIComponent(escape(atob(String(cod).trim())))); } catch (e) { throw new Error('El código no es válido. Revisa que esté completo.'); }
  if (!data || data.v !== 1 || !data.perfil || !data.perfil.id) throw new Error('El código no es de este juego.');
  const p = { id:data.perfil.id, nombre:data.perfil.nombre || 'Jugador', avatar:data.perfil.avatar || 'muneco' };
  if (data.perfil.pin) p.pin = data.perfil.pin;
  const i = perfiles.findIndex(q => q.id === p.id); if (i >= 0) perfiles[i] = p; else perfiles.push(p);
  LS.set(K.perfiles, perfiles); activo = p.id; LS.set(K.activo, activo);
  const local = LS.get(K.prog(p.id), null), remoto = data.progreso || {};
  if (!local || (remoto.actualizado||0) >= (local.actualizado||0)) LS.set(K.prog(p.id), remoto);
  sincAjustes(); return p;
}

// Nube opcional (Supabase): funciones leer_progreso y guardar_progreso (ver docs/guardado.md).
const nube = {
  activa: !!(CFG.url && CFG.key),
  estado: 'local',
  _set(e){ this.estado = e; window.dispatchEvent(new CustomEvent('laboyos:nube', { detail:e })); },
  _h(){ return { apikey:CFG.key, Authorization:'Bearer '+CFG.key, 'Content-Type':'application/json' }; },
  async subir(){
    if (!this.activa) return; const id = activo, prog = progreso(), p = perfil();
    try {
      const r = await fetch(`${CFG.url}/rest/v1/rpc/guardar_progreso`, { method:'POST', headers:this._h(),
        body:JSON.stringify({ p_id:id, p_nombre:p.nombre, p_avatar:p.avatar||'muneco', p_datos:prog }) });
      if (!r.ok) throw new Error(r.status); LS.set(K.pend(id), false); this._set('sincronizado');
    } catch (e) { this._set(navigator.onLine === false ? 'pendiente' : 'error'); }
  },
  async bajar(){
    if (!this.activa) return; const id = activo;
    try {
      const r = await fetch(`${CFG.url}/rest/v1/rpc/leer_progreso`, { method:'POST', headers:this._h(), body:JSON.stringify({ p_id:id }) });
      if (!r.ok) throw new Error(r.status); const [fila] = await r.json();
      const local = progreso();
      if (fila && (fila.datos?.actualizado||0) > (local.actualizado||0)){ LS.set(K.prog(id), fila.datos); window.dispatchEvent(new CustomEvent('laboyos:progreso')); }
      if (!fila || LS.get(K.pend(id), false)) await this.subir(); else this._set('sincronizado');   // perfil nuevo: aún no está en la nube
    } catch (e) { this._set(navigator.onLine === false ? 'pendiente' : 'error'); }
  },
};
// Código corto LAB-XXXXXX: trae el perfil desde la nube (solo si Supabase está activo).
async function traerDeNube(id){
  if (!nube.activa) throw new Error('El código corto necesita la nube. Usa el código de respaldo largo.');
  let r; try { r = await fetch(`${CFG.url}/rest/v1/rpc/leer_progreso`, { method:'POST', headers:nube._h(), body:JSON.stringify({ p_id:id }) }); }
  catch (e) { throw new Error('No hay conexión. Intenta de nuevo con internet.'); }
  if (!r.ok) throw new Error('No se pudo consultar la nube. Intenta de nuevo.');
  const [fila] = await r.json(); if (!fila) throw new Error('No encontré ese código. Revísalo.');
  const p = { id, nombre:fila.nombre || 'Jugador', avatar:fila.avatar || 'muneco' };
  const i = perfiles.findIndex(q => q.id === id); if (i >= 0) perfiles[i] = { ...perfiles[i], ...p }; else perfiles.push(p);
  LS.set(K.perfiles, perfiles); activo = id; LS.set(K.activo, id);
  const local = LS.get(K.prog(id), null); if (!local || (fila.datos?.actualizado||0) >= (local.actualizado||0)) LS.set(K.prog(id), fila.datos || {});
  sincAjustes(); return p;
}
const entrarConCodigo = async txt => /^LAB-[A-Z0-9]{6}$/i.test(String(txt).trim()) ? traerDeNube(String(txt).trim().toUpperCase()) : importar(txt);
addEventListener('online', () => { if (LS.get(K.pend(activo), false)) nube.subir(); });
sincAjustes();
if (nube.activa) nube.bajar();

window.Guardado = { entrarConCodigo, perfil, perfiles:()=>perfiles.slice(), progreso, progresoDe, tienePin, ponerPin, verificarPin, guardar, crearPerfil, usarPerfil, actualizarPerfil, codigo, importar, nube, sincronizar:()=>nube.bajar() };
})();
