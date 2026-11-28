# Fabricación por pedidos con receta — plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** rehacer la fabricación del Nivel 2: clientes que piden chiva, frutero, jarrón o matera al azar, recetas visibles, taller por dentro en tres columnas con ruta en zigzag, sin leña, lluvia ni toldo.
**Architecture:** el JavaScript de `alfareria.html` pasa a `alfareria.js` (regla de `CLAUDE.md`). La lógica de recetas, pura y sin Three.js, vive en `recetas.js` (global `Recetas`) con datos en `data/recetas2.json`; se prueba en Node. `alfareria.js` usa `Recetas` para decidir qué acepta cada estación, qué pide cada cliente y qué muestran las tarjetas. Red igual que hoy (anfitrión simula; `snapshot`/`applySnapshot`).
**Tech Stack:** HTML + JS sin compilar, Three.js r128, `estaciones.js`, `red.js`, `muneco.js`, Playwright (`tests/lib.js`), Node para `tests/recetas.js`.
**Spec:** `docs/superpowers/specs/2026-11-28-fabricacion-recetas-design.md` (bocetos `…-boceto-1-juego.png`, `…-boceto-2-receta.png`).

## Global Constraints
- Figuras: `chiva`, `frutero`, `jarron`, `matera` (nombres visibles: Chiva, Frutero, Jarrón, Matera). Cliente pide una **al azar**.
- Recetas (ids de paso):
  - matera: `barro, amasar, torno, secar, hornear, entregar`
  - jarron: `barro, amasar, torno, secar, hornear, pintar, entregar`
  - frutero: `barro, amasar, modelar, secar, hornear, pintar, entregar`
  - chiva: `barro, amasar, carroceria, carga, pegar, secar, hornear, pintar, entregar`
- Estación de cada paso: barro→`barro`, amasar→`amasado`, torno→`torno`, modelar/carroceria/carga/pegar→`mesa`, secar→`secadero`, hornear→`horno`, pintar→`pintura`, entregar→`mostrador`.
- Colores de la chiva: 2 distintos al azar de `rojo, amarillo, azul, verde`; hay que pintar exactamente esos.
- Paciencia / clientes a la vez: 1 jugador **120 s / 2**; 2 jugadores **90 s / 3**; 3–4 jugadores **70 s / 3**.
- Sin leña, sin lluvia, sin toldo ni palanca. Horno arranca solo al cargar; si no se saca en `ventana` s, la pieza se va quemando (menos puntos, sigue sirviendo).
- Secadero 3 puestos; cada otra estación 1 pieza; jugador carga 1 objeto; Mostrador con repisa de 2 puestos; Mesa guarda 1 parte de chiva esperando.
- Pieza atada a la **figura**, no al cliente; se entrega al cliente de esa figura con menos paciencia.
- Taller en 3 columnas (ver spec): izquierda arriba Torno · Mesa · Torno, medio 2 Amasado, abajo Mina; medio arriba 2 Hornos, abajo Secadero; derecha arriba y medio Pintura, abajo Mostrador. Pasillos entre columnas ≥ 2 unidades.
- Textos: frutero, jarrón y matera muestran «Receta del juego»; solo la chiva usa el proceso verificado. Nada encimado en celular horizontal; pantalla completa (`Papel.avisoGirar()` ya la incluye).
- Receta completa en ventana: en modo solo (1 jugador) el juego se pausa mientras está abierta; con más jugadores no.

## Review Focus
- Cliente que se va con una pieza de su figura a medio hacer → la pieza sirve para el siguiente cliente de esa figura (prueba en Task 4).
- Pieza terminada sin cliente que la pida → se deja en la repisa del Mostrador y se entrega sola cuando llegue el cliente (prueba en Task 4).
- Invitado en red ve tarjetas, clientes y piezas iguales que el anfitrión (prueba de ida y vuelta `snapshot`→`applySnapshot` en Task 6).
- Mesa con una carrocería esperando y el jugador trae masa para otro frutero → la Mesa no se bloquea: si hay pedido de frutero, modela frutero; la parte sigue esperando (prueba en Task 3).
- Receta abierta y se acaba el tiempo / llega cliente → la ventana no rompe el juego; al cerrarla sigue (prueba en Task 5).

---

### Task 1: Sacar el JavaScript de `alfareria.html` a `alfareria.js`
**Files:** Create `alfareria.js` (contenido del `<script>` en línea, `alfareria.html:206-612`); Modify `alfareria.html` (cambiar el bloque por `<script src="alfareria.js"></script>`).
- [ ] Mover el código tal cual (sin cambios de lógica).
- [ ] Correr `node tests/alfareria.js`, `node tests/girar.js`, `node tests/tactil_sonido.js` → `TODO OK` (mismas pruebas de antes).
- [ ] Commit `refactor: el codigo de la fabricacion pasa a alfareria.js`.

### Task 2: Recetas puras (`recetas.js` + `data/recetas2.json`)
**Files:** Create `recetas.js`, `data/recetas2.json`, `tests/recetas.js`. Modify `docs/nivel2-fuentes.md` (sección «Figuras de la fabricación»: fuentes del spec, «solo el nombre de la figura; el proceso no tiene fuente», salvo chiva).
**Produces (global `window.Recetas`, también `module.exports` si existe):**
- `Recetas.datos` — objeto de `data/recetas2.json`: `{ pasos:{id:'Nombre visible'}, colores:['rojo','amarillo','azul','verde'], figuras:{ id:{ nombre, pasos:[id], puntos:int, colores:bool, fuente:'verificada'|'juego' } } }`. Puntos: matera 8, jarron 10, frutero 12, chiva 25.
- `Recetas.usar(datos)` — fija los datos (Node y navegador).
- `Recetas.estacion(paso:string) -> string` (tabla de Global Constraints).
- `Recetas.paso(pieza) -> string|null` — paso que le toca a `pieza = {fig:string|null, i:int}` (`i` = índice del próximo paso; con `fig:null` usa el prefijo común `barro, amasar`).
- `Recetas.acepta(kind:string, pieza) -> bool` — `estacion(paso(pieza))===kind`.
- `Recetas.avanza(pieza) -> pieza` (copia con `i+1`).
- `Recetas.figurasPara(kind:string, pedidos:[{fig}]) -> [fig]` — figuras pedidas cuyo paso 2 usa esa estación (torno→matera/jarron; mesa→frutero/chiva), sin repetir, en orden de pedido.
- `Recetas.paciencia(n:int) -> 120|90|70`, `Recetas.maxClientes(n) -> 2|3|3`.
- `Recetas.coloresAzar(rnd=Math.random) -> [c1,c2]` distintos.
- [ ] Prueba que falla (`tests/recetas.js`, Node puro: `vm` carga `recetas.js` y lee el JSON): las 4 recetas tal cual Global Constraints; `estacion('pegar')==='mesa'`; `paso({fig:null,i:0})==='barro'`, `paso({fig:null,i:1})==='amasar'`; `acepta('pintura',{fig:'matera',i:5})===false` y `acepta('mostrador',{fig:'matera',i:5})===true`; `figurasPara('torno',[{fig:'chiva'},{fig:'jarron'},{fig:'matera'},{fig:'jarron'}])` = `['jarron','matera']`; `paciencia(1..4)` = 120,90,70,70; `maxClientes(1..4)`=2,3,3,3; 200 llamadas a `coloresAzar` dan siempre 2 distintos de la lista; `fuente` es `'verificada'` solo en chiva.
- [ ] `node tests/recetas.js` → FALLA. Implementar. → `TODO OK` (usar `T.ok`/`T.fin` de `tests/lib.js` sin abrir navegador).
- [ ] Commit `feat: recetas de la fabricacion (datos y logica pura)`.

### Task 3: Taller por dentro, estaciones nuevas y piezas con receta
**Files:** Modify `alfareria.js` (escena, `station`, `accion`, `take`, `use`, `step`, `vistas`, `labels`, `NAMES`, `R`), `alfareria.html` (cargar `recetas.js` antes de `alfareria.js`; leer `data/recetas2.json` con `fetch` antes de empezar; textos de ayuda e intro sin leña/lluvia/toldo). Test: rehacer `tests/alfareria.js`.
**Consumes:** todo `Recetas` de Task 2.
**Produces:** estaciones con `kind` ∈ `barro, amasado(×2), torno(×2), mesa, secadero (3 puestos), horno(×2), pintura(×2), mostrador`; objeto cargado `p.carry = {type:'pieza', fig, i, q, colores?:[], pintados?:[], parte?:'carroceria'|'carga'}` (barro = `{type:'pieza',fig:null,i:1}` tras tomarlo); en `R`: quitar `lluvias, lluviaPorSeg, pasadaPorSeg?` (dejar el desgaste por quemado), `rajadura`, leña; `secado:10`.
- Escena: piso de baldosa (`tileTex`), pared del fondo con ventanas y vigas, paredes laterales bajas; posiciones en 3 columnas según Global Constraints; cámara que encuadre todo en 844×390.
- Torno y Mesa: con masa en mano, `Recetas.figurasPara(kind, game.orders)` da las opciones; tocar Acción alterna entre ellas (letrero «Hacer: Jarrón»), mantener modela. Si no hay pedido que use esa estación, aviso «Ningún cliente pide eso aquí».
- Chiva en Mesa: modelar da una parte (`carroceria` si no hay parte esperando o espera `carga`; si no, `carga`). Si la Mesa tiene la otra parte esperando, Acción **pega** → pieza `{fig:'chiva', i:índice de 'secar'}`. Si no, la parte queda esperando en la Mesa (máx. 1).
- Estación que no acepta (`!Recetas.acepta`): no toma la pieza y avisa «Esta pieza ahora va a: <estación>».
- Pintura: si la figura tiene `colores`, tocar Acción cambia el color elegido, mantener pinta ese color (agrega a `pintados` si está en `colores`; si no, aviso «El cliente pidió …»). Avanza cuando `pintados` cubre `colores`. Sin `colores`: mantener pinta y avanza.
- [ ] Prueba que falla (`tests/alfareria.js` nueva, mismas ayudas `ir/pulsar/mantener/carry` con `carry` → `fig:i`): no existen estaciones `lena`, `palanca`, `entrega` y no hay malla de lluvia (`__a.lluvia===undefined`); columnas: `x(mina)<x(secadero)<x(mostrador)` y `z(mina)>z(torno)` (mina abajo, torno arriba), `z(horno)<z(secadero)`; con un pedido de **matera** forzado (`__a.pedir('matera')`), la receta completa barro→amasado→torno→secadero→horno→mostrador entrega y suma ≥ 8; la matera **no** entra a Pintura; con pedido de **chiva** (`__a.pedir('chiva',['rojo','azul'])`): carrocería y carga en la Mesa, pegar, secar, hornear, pintar rojo y azul (pintar amarillo avisa y no cuenta), entregar suma ≥ 25; **frutero** en la Mesa con una carrocería esperando no bloquea (Review Focus).
- [ ] `node tests/alfareria.js` → FALLA. Implementar. → `TODO OK`. También `node tests/girar.js tests/tactil_sonido.js` (uno por uno).
- [ ] Commit `feat: taller por dentro en tres columnas y piezas que siguen su receta`.
**Produces para Task 4–6:** en el gancho `window.__a` (solo `#prueba`) agregar `pedir(fig, colores?)` (cliente con esa figura, sin azar), `reset`, `snapshot`, `applySnapshot`, `Recetas`, además de lo que ya expone (`game, players, ST, take, use, step, R, camera, setCarry, tirar, accion, nearest`).

### Task 4: Clientes en el mostrador
**Files:** Modify `alfareria.js` (reemplaza `addOrder/renderOrders/deliver/addPieza` por clientes), `alfareria.html` (quitar `#orders` antiguo si sobra). Test: `tests/alfareria.js`.
**Produces:** `game.orders = [{id, fig, colores:[]|null, left, total, npc}]` (mismo nombre `orders` para no romper la red); NPC con `Muneco.npc(tipo)` (tipos existentes, al azar) que camina a la fila junto al Mostrador y se va.
- Llegan al azar (`Recetas.datos.figuras`), máx. `Recetas.maxClientes(n)`, paciencia `Recetas.paciencia(n)` con `n = players.length`; uno nuevo cada `R.clienteCada` (partir de 22 s) mientras haya lugar; al empezar llegan 2 (solo) o `maxClientes`.
- Entregar en Mostrador: pieza terminada (`Recetas.paso(pieza)==='entregar'`) va al cliente de esa figura con menos `left`; puntos = `figuras[fig].puntos` + bono rapidez `round(5*left/total)`, menos lo que quitó el quemado. Sin cliente de esa figura → a la repisa (2 puestos); al llegar uno de esa figura se entrega solo. Repisa llena → aviso.
- Cliente que se va: `R.pts.perdido` (−5), aviso, sale.
- Estrellas: recalibrar `R.estrellas` jugando una partida tipo en solo con `__a` (anotar en el ledger el valor y por qué).
- [ ] Prueba que falla: paciencia del primer cliente = 120 con 1 jugador (`__a.game.orders[0].total===120`); forzar `players` a 2 y 3 (`__a.reset` con lista falsa) → 90 y 70, máx 3; una pieza de jarrón entregada va al jarrón con menos paciencia; cliente que se va con su pieza a medio hacer → la pieza se entrega al siguiente de esa figura; pieza sin cliente queda en la repisa y se entrega sola al llegar `__a.pedir` de esa figura.
- [ ] Correr → FALLA. Implementar. → `TODO OK`. Commit `feat: clientes con paciencia segun jugadores y repisa del mostrador`.

### Task 5: Tarjetas, receta completa y letrero del jugador
**Files:** Modify `alfareria.html` (HTML/CSS: `#clientes` fila de tarjetas arriba a la derecha; `#receta` ventana con lista, «Cerrar», y nota), `alfareria.js` (pintar tarjetas, abrir/cerrar receta, pausa en solo, letrero «sigue <Paso>» sobre el jugador). Test: `tests/alfareria.js`.
- Tarjeta: `<button class="cli">` con figura, «n/N», nombre del paso siguiente de la pieza más avanzada de esa figura (o «Barro»), barra de paciencia (verde → ámbar < 50 % → rojo < 25 %). Ancho fijo; en horizontal compactas (≤ 124 px), nunca encimadas con `.clock`, `#fsBtn` ni `.tools`.
- `#receta`: pasos con ✓ / actual resaltado / pendientes; chiva añade «Pintar: <colores>»; pie «Receta del juego» si `fuente==='juego'`. Abre al tocar tarjeta; cierra con «Cerrar», Escape o tocar fuera. Si `players.length===1` → `game.paused=true` mientras está abierta.
- [ ] Prueba que falla: en 844×390 táctil, 3 tarjetas visibles sin encimarse entre sí ni con HUD (reusar `solapes`); abrir receta de matera muestra 6 pasos y «Receta del juego»; la de chiva no lo dice y muestra los 2 colores; en solo `game.t` no avanza con la receta abierta; con 2 jugadores sí; letrero del jugador dice «sigue Amasar» tras tomar barro; `node tests/usabilidad.js alfareria` → `TODO OK`.
- [ ] Correr → FALLA. Implementar. → `TODO OK`. Commit `feat: tarjetas de clientes y receta completa`.

### Task 6: Red y cierre
**Files:** Modify `alfareria.js` (`snapshot/applySnapshot`: clientes `[fig,colores,left,total]`, repisa, parte esperando en Mesa, `carry` de piezas; quitar `r` lluvia y `m` toldo), `tests/contenido2.js` (prohibir «leña», «toldo», «lluvia» en `alfareria.html`/`alfareria.js`; exigir «Receta del juego» en `data/recetas2.json` o en el código), `LEEME-PRIMERO.md` (fila de `alfareria.html`), `progress.md` (Aviso 5 hecho), `docs/ideas.md` (puntos 5 y 5b), `docs/arreglos.md`.
- [ ] Prueba que falla: en `#prueba`, `__a.applySnapshot(__a.snapshot())` deja `orders`, repisa y piezas iguales (comparar JSON); `contenido2` falla mientras queden textos de leña/toldo/lluvia.
- [ ] Correr → FALLA. Implementar. → `TODO OK`.
- [ ] Suite completa: `for t in tests/*.js; do [ "$t" = tests/lib.js ] || node $t | tail -1; done` → todas `TODO OK`. Commit y push a la rama (no a `main`).
