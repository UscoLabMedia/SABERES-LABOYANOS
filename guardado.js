/* guardado.js — cuentas y partidas de "Saberes de Laboyos".
   - Cada estudiante tiene un USUARIO con contraseña (Supabase Auth, gratis).
   - Un usuario tiene varias PARTIDAS; cada una guarda su propio progreso.
   - La contraseña nunca se guarda en el navegador. La sesión vive solo en la pestaña (sessionStorage),
     así que al volver al juego otro día se pide de nuevo el usuario y la contraseña.
   - El progreso se copia en el navegador y se sube a la nube; sin internet queda pendiente.
   - Sin Supabase en config.js (o con #prueba) funciona en modo local, sin cuentas.
   API para los minijuegos (no cambia): Guardado.progreso(), .guardar(prog), .perfil(), .actualizarPerfil({avatar}).
   API de cuentas: Guardado.cuenta.{activa, usuario, registrar, entrar, salir, partidas, nueva, abrir,
                   cerrarPartida, borrarPartida, borrarCuenta}.  Estado de la nube: Guardado.nube.estado. */
(() => {
'use strict';
const CFG = (window.LABOYOS_CONFIG || {}).supabase || {};
const API = String(CFG.url || '').replace(/\/$/, ''), KEY = CFG.key || '', DOMINIO = CFG.dominio || 'laboyos.app';
const LOCAL = !(API && KEY) || location.hash === '#prueba';
const mk = get => ({
  get(k, d){ try { const v = get().getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v){ try { get().setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
  del(k){ try { get().removeItem(k); } catch (e) {} } });
const LS = mk(() => localStorage), SS = mk(() => sessionStorage);
const K = { auth:'laboyos.auth', partida:'laboyos.partida', datos:id => 'laboyos.datos.' + id, pend:id => 'laboyos.pend.' + id };
const evento = (n, d) => window.dispatchEvent(new CustomEvent(n, { detail:d }));

let auth = SS.get(K.auth, null), partida = SS.get(K.partida, null);
if (LOCAL && !auth){ auth = { usuario:location.hash === '#prueba' ? 'Prueba' : 'Jugador', local:true }; partida = { id:'local', nombre:'Partida local' };
  SS.set(K.auth, auth); SS.set(K.partida, partida); }
// Los minijuegos no se abren sin sesión: vuelven a la portada.
if (!(auth && partida) && !window.LABOYOS_PORTADA) location.replace('index.html');

/* ---------- red ---------- */
function mensaje(js, status){
  const c = js && (js.error_code || js.code), m = String((js && (js.msg || js.message || js.error_description)) || '');
  if (c === 'invalid_credentials' || /invalid login/i.test(m)) return 'Usuario o contraseña incorrectos.';
  if (c === 'user_already_exists' || /already registered/i.test(m)) return 'Ese usuario ya existe. Prueba con otro.';
  if (c === 'weak_password') return 'La contraseña es muy débil. Usa mínimo 6 caracteres.';
  if (c === 'email_address_invalid') return 'No se pudo crear el usuario: el dominio interno de correo no es válido. Avisa al docente.';
  if (c === 'signup_disabled') return 'El registro de usuarios está desactivado. Avisa al docente.';
  if (c === 'over_request_rate_limit' || c === 'over_email_send_rate_limit' || status === 429) return 'Demasiados intentos. Espera un minuto y vuelve a probar.';
  return m || `No se pudo completar (error ${status}).`;
}
async function http(ruta, o = {}){
  if (o.sesion !== false) await asegurar();
  const h = { apikey:KEY, 'Content-Type':'application/json' };
  const token = o.sesion === false ? null : auth && auth.access;
  if (token) h.Authorization = 'Bearer ' + token; else if (KEY.startsWith('eyJ')) h.Authorization = 'Bearer ' + KEY;
  if (o.pref) h.Prefer = o.pref;
  let r; try { r = await fetch(API + ruta, { method:o.metodo || 'GET', headers:h, body:o.cuerpo !== undefined ? JSON.stringify(o.cuerpo) : undefined }); }
  catch (e) { throw Object.assign(new Error('No hay conexión con internet.'), { red:true }); }
  const txt = await r.text(); let js = null; try { js = txt ? JSON.parse(txt) : null; } catch (e) {}
  if (!r.ok) throw Object.assign(new Error(mensaje(js, r.status)), { status:r.status });
  return js;
}
const sesionDe = (js, usuario) => ({ usuario, user_id:js.user && js.user.id, access:js.access_token, refresh:js.refresh_token, exp:Date.now() + (js.expires_in || 3600) * 1000 });
async function asegurar(){
  if (!auth || auth.local || Date.now() < auth.exp - 60000) return;
  try { const js = await http('/auth/v1/token?grant_type=refresh_token', { metodo:'POST', cuerpo:{ refresh_token:auth.refresh }, sesion:false });
    auth = sesionDe(js, auth.usuario); SS.set(K.auth, auth); }
  catch (e) { if (!e.red){ SS.del(K.auth); SS.del(K.partida); auth = partida = null; evento('laboyos:sesion-vencida'); } }
}

/* ---------- datos de la partida activa ---------- */
const progreso = () => Object.assign({ etapa:0 }, partida ? LS.get(K.datos(partida.id), {}) : {});
const nube = {
  activa:!LOCAL, estado:LOCAL ? 'local' : 'sincronizado', _ocupado:false, _otra:false,
  _set(e){ this.estado = e; evento('laboyos:nube', e); },
  async subir(){
    if (LOCAL || !partida || !auth) return;
    if (this._ocupado){ this._otra = true; return; } this._ocupado = true;
    const id = partida.id;
    try { await http(`/rest/v1/partidas?id=eq.${encodeURIComponent(id)}`, { metodo:'PATCH', pref:'return=minimal', cuerpo:{ datos:progreso(), actualizada:new Date().toISOString() } });
      LS.set(K.pend(id), false); this._set('sincronizado'); }
    catch (e) { this._set(e.red || navigator.onLine === false ? 'pendiente' : 'error'); }
    this._ocupado = false; if (this._otra){ this._otra = false; this.subir(); }
  } };
function guardar(prog){ prog.actualizado = Date.now(); if (!partida) return prog; LS.set(K.datos(partida.id), prog); LS.set(K.pend(partida.id), true); nube.subir(); return prog; }
const perfil = () => ({ id:partida ? partida.id : null, nombre:auth ? auth.usuario : '', avatar:progreso().avatar || 'muneco', partida:partida ? partida.nombre : '' });
function actualizarPerfil(c){ if (c && c.avatar){ const p = progreso(); p.avatar = c.avatar; guardar(p); } return perfil(); }

/* ---------- cuenta ---------- */
const usuarioOk = u => /^[a-z0-9_]{3,20}$/.test(u);
const limpio = u => String(u || '').trim().toLowerCase();
const correo = u => `${u}@${DOMINIO}`;
function validar(u, c){
  if (!usuarioOk(u)) throw new Error('El usuario son 3 a 20 letras, números o guion bajo (sin espacios ni tildes).');
  if (String(c || '').length < 6) throw new Error('La contraseña debe tener mínimo 6 caracteres.'); }
const cuenta = {
  activa:() => !!(auth && partida), conSesion:() => !!auth, usuario:() => auth ? auth.usuario : null, partidaActual:() => partida,
  async registrar(usuario, clave){ const u = limpio(usuario); validar(u, clave);
    const js = await http('/auth/v1/signup', { metodo:'POST', cuerpo:{ email:correo(u), password:clave, data:{ usuario:u } }, sesion:false });
    if (!js || !js.access_token) throw new Error('Falta apagar "Confirm email" en Supabase (Authentication → Providers → Email). Avisa al docente.');
    auth = sesionDe(js, u); partida = null; SS.set(K.auth, auth); SS.del(K.partida); return u; },
  async entrar(usuario, clave){ const u = limpio(usuario); if (!u || !clave) throw new Error('Escribe tu usuario y tu contraseña.');
    const js = await http('/auth/v1/token?grant_type=password', { metodo:'POST', cuerpo:{ email:correo(u), password:clave }, sesion:false });
    auth = sesionDe(js, u); partida = null; SS.set(K.auth, auth); SS.del(K.partida); return u; },
  salir(){ if (auth && !auth.local) http('/auth/v1/logout', { metodo:'POST' }).catch(() => {}); SS.del(K.auth); SS.del(K.partida); auth = partida = null; },
  async partidas(){ return (await http('/rest/v1/partidas?select=id,nombre,datos,creada,actualizada&order=actualizada.desc')) || []; },
  async nueva(nombre){ const n = String(nombre || '').trim().slice(0, 40) || nombreAuto();
    const [fila] = await http('/rest/v1/partidas', { metodo:'POST', pref:'return=representation', cuerpo:{ nombre:n, datos:{ etapa:0, actualizado:Date.now() } } });
    return this.abrir(fila); },
  abrir(p){ const local = LS.get(K.datos(p.id), null), nube_ = p.datos || {};
    if (!local || (nube_.actualizado || 0) > (local.actualizado || 0)){ LS.set(K.datos(p.id), nube_); LS.set(K.pend(p.id), false); } else LS.set(K.pend(p.id), true);
    partida = { id:p.id, nombre:p.nombre }; SS.set(K.partida, partida); if (LS.get(K.pend(p.id), false)) nube.subir(); return partida; },
  cerrarPartida(){ SS.del(K.partida); partida = null; },
  async borrarPartida(id){ await http(`/rest/v1/partidas?id=eq.${encodeURIComponent(id)}`, { metodo:'DELETE', pref:'return=minimal' });
    LS.del(K.datos(id)); LS.del(K.pend(id)); if (partida && partida.id === id) this.cerrarPartida(); },
  async borrarCuenta(){ const ids = (await this.partidas().catch(() => [])).map(p => p.id);
    await http('/rest/v1/rpc/borrar_mi_cuenta', { metodo:'POST', cuerpo:{} }); ids.forEach(id => { LS.del(K.datos(id)); LS.del(K.pend(id)); }); SS.del(K.auth); SS.del(K.partida); auth = partida = null; } };
function nombreAuto(){ const d = new Date(), M = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'], z = n => String(n).padStart(2, '0');
  return `${d.getDate()} ${M[d.getMonth()]} ${d.getFullYear()} ${z(d.getHours())}:${z(d.getMinutes())}`; }

addEventListener('online', () => { if (partida && LS.get(K.pend(partida.id), false)) nube.subir(); });
if (!LOCAL && partida && LS.get(K.pend(partida.id), false)) nube.subir();

window.Guardado = { perfil, progreso, guardar, actualizarPerfil, cuenta, nube, nombreAuto };
})();
