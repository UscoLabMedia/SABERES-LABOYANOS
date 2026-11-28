# Elegir personaje al crear la partida — plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** elegir personaje en «Nueva partida» con dos retratos sin etiqueta, cambiarlo en «Mi progreso», quitar el selector de la finca.
**Architecture:** el valor interno sigue `avatar:'muneco'|'muneca'` en los datos de la partida (`Guardado.perfil().avatar`). Un componente pequeño `Muneco.selector(contenedor, valor, alCambiar)` en `muneco.js` pinta los dos retratos; lo usan `inicio.js` y `index.html`.
**Tech Stack:** HTML + JS sin compilar, Three.js r128, Playwright (`tests/lib.js`).
**Spec:** `docs/superpowers/specs/2026-11-28-elegir-personaje-design.md` (+ cambio aprobado: ella empieza **sin gorra**).

## Global Constraints
- Ningún texto visible de la elección dice «muñeco», «muñeca», «hombre», «mujer», «niño», «niña».
- `alt` de los retratos: `Pelo corto con gorra` y `Cola de caballo con aretes`.
- Botones con `aria-pressed`; marca ✓ además del borde.
- Pregunta: `¿Con quién quieres jugar?`. Ayuda: `Lo puedes cambiar después en «Mi progreso».`. Error sin elegir: `Elige con quién quieres jugar.`
- Partidas viejas: no se tocan sus datos.

## Review Focus
- Partida vieja sin `avatar` → se ve el de pelo corto (como hoy), sin error.
- Modo sin internet / Supabase local (`auth.local`) → `nueva(nombre, avatar)` también guarda el avatar.
- Cambiar en Mi progreso y abrir la finca → la finca muestra el nuevo (lee `Guardado.perfil().avatar`, no un `S.avatar` viejo).
- Trivia usa hoy `S.avatar`: debe leer `Guardado.perfil().avatar`.
- Teclado: Tab llega a los dos retratos y Enter/Espacio elige.

---

### Task 1: Ella sin gorra al inicio + selector de retratos
**Files:** Modify `muneco.js:131` (`cap: stage<2?'#f2c94c':null` → `cap: null`), add `selector` y exportarlo en `muneco.js:194`. Test: `tests/personaje.js`.
**Produces:** `Muneco.selector(el: HTMLElement, valor: 'muneco'|'muneca'|null, alCambiar: (v)=>void) -> {valor(): string|null}`. Pinta `<div class="pj" role="group">` con dos `<button type="button" data-pj="muneco|muneca" aria-pressed>` que contienen `<img alt>` (retrato de `jugador(0,fem)`, girado `rotation.y=-.6` para ver la cola) y `<span class="ok">✓</span>`. Estilos `.pj` del boceto (`docs/superpowers/specs/2026-11-28-elegir-personaje-boceto.png`) inyectados una vez por el propio `selector`.
- [ ] Prueba que falla (`tests/personaje.js`, parte 1, en `index.html` con `muneco.js` cargado): `Muneco.selector` existe; crea 2 botones con esos `alt`; clic en el 2.º → `aria-pressed="true"` solo en él y `alCambiar('muneca')`; `jugador(0,true)` no tiene gorra (ninguna malla hija de la cabeza con `SphereGeometry` de radio .19).
- [ ] Correr: `node tests/personaje.js` → FALLA.
- [ ] Implementar.
- [ ] Correr → pasa. Commit `feat: selector de personaje con retratos; ella empieza sin gorra`.

### Task 2: Elegir en «Nueva partida»
**Files:** `index.html:330` (cargar `muneco.js` después de `papel.js` y antes de `inicio.js`), `inicio.js` `pantallaNueva`, `guardado.js:97` `nueva(nombre, avatar)` → `datos:{ etapa:0, avatar, actualizado }`.
**Consumes:** `Muneco.selector`.
- [ ] Prueba que falla (parte 2): con Supabase simulado (mismo esquema que las pruebas de cuentas; si no hay, interceptar `**/rest/v1/partidas` con `c.route` y devolver la fila enviada) → en «Nueva partida» sale la pregunta y 2 retratos; «Empezar» sin elegir muestra el error y no envía POST; eligiendo el 2.º, el POST lleva `datos.avatar==='muneca'`; el texto de `#inicio` no contiene las palabras prohibidas.
- [ ] Correr → FALLA. Implementar. Correr → pasa. Commit `feat: elegir personaje al crear la partida`.

### Task 3: Cambiar en «Mi progreso»; finca y trivia leen la partida
**Files:** `index.html:303-306` (fila «Personaje» con un `<div id="pfPj">`; en `syncProfile` `index.html:763` montar `Muneco.selector($('#pfPj'), Guardado.perfil().avatar, v=>Guardado.actualizarPerfil({avatar:v}))`), `finca.html:86-88,151,438` (quitar estilos, HTML y listeners del selector; mantener `setAvatar` de la línea 625 para fijar `S.avatar`), `trivia.html:185` (`Guardado.perfil().avatar==='muneca'`).
- [ ] Prueba que falla (parte 3): `index.html#prueba` → abrir Mi progreso, elegir el 2.º → `Guardado.perfil().avatar==='muneca'`; `finca.html#prueba` no tiene `[data-av]` ni `.avatar-pick`, y su jugador es el de cola (comprobar con `__f` o el `avatar` guardado); `trivia.html#prueba` usa el guardado; partida sin `avatar` → `perfil().avatar==='muneco'` y sin errores.
- [ ] Correr → FALLA. Implementar. Correr → pasa. Commit `feat: cambiar personaje en Mi progreso; la finca ya no lo pide`.

### Task 4: Colores de los retratos y cierre
**Files:** `muneco.js:188` (`retrato`).
- [ ] Medir: en el retrato de `jugador(0,false)` el píxel más rojo de la gorra; si R−G < 120 (se ve salmón), probar `r.toneMapping=THREE.NoToneMapping` solo en el renderer del retrato y volver a medir. Dejarlo solo si mejora y sigue pasando todo. Prueba numérica en `tests/personaje.js`.
- [ ] Correr todas: `for t in tests/*.js; do [ "$t" = tests/lib.js ] || node $t | tail -1; done` → todas `TODO OK`, incluida `usabilidad`.
- [ ] Actualizar `LEEME-PRIMERO.md` (tabla de atuendos: etapa 0 ella sin gorra; personaje se elige al crear la partida), `progress.md` (Aviso 3 hecho), `docs/ideas.md` (aviso 3 tachado), `docs/arreglos.md`. Commit y push a la rama.
