# Nivel 2 · La Alfarería — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cambiar el orden de niveles a Café → Alfarería → Caballos → Música y Danza y construir el Nivel 2: exploración del taller, fabricación de artesanías, carrera de chivas y trivia, con datos verificados.

**Architecture:** Las páginas por nivel leen sus datos de JSON (`?nivel=N`). Lo que hoy está dentro de `cosecha.html` y no es del café (entrada de PC/mando/celular, botón Acción/Soltar, letreros sin encimarse, red, bucle) pasa a `estaciones.js`; cada minijuego aporta sus estaciones y reglas. La carrera es una página nueva que reusa `red.js`, `muneco.js`, `papel.js` y `guardado.js`.

**Tech Stack:** HTML/JS sin build, Three.js r128, PeerJS vía `red.js`, Supabase vía `guardado.js`, pruebas con Playwright (Chromium) y ganchos `#prueba`.

**Spec:** `docs/superpowers/specs/2026-11-27-nivel2-alfareria-design.md` · datos: `docs/nivel2-fuentes.md`

## Global Constraints

- Todo texto del juego y de la documentación en español de Colombia.
- Orden de niveles: 1 Café · 2 Alfarería · 3 Caballos · 4 Música y Danza. Campos de partida: `nivel1`…`nivel4` (`nivel2` = alfarería), `etapa` 0–4 = niveles superados en orden.
- Datos históricos solo los de `docs/nivel2-fuentes.md` (sección "Confirmado"). Sin año de la primera chiva, sin cifras de familias, sin temperaturas de horno, sin plaza de toros.
- Cecilia Vargas Muñoz es la única persona real; solo en la pista "La chiva de barro", con lo que dice la Ley 1891 de 2018. Personajes del juego inventados.
- API de `guardado.js` no cambia: `Guardado.progreso()`, `.guardar()`, `.perfil()`.
- Orden de carga de scripts: `config.js` → `guardado.js` → three.js → peerjs (si hay red) → `papel.js` → `muneco.js` → `red.js` → `estaciones.js`.
- Controles en cosecha y fabricación: un botón Acción (tocar = tomar/dejar; mantener = moler/lavar/amasar…) y un botón Soltar; PC: `E`/`Espacio`/`Enter`, `G`/`X`/clic derecho; mando `A`/`B`; sin atascos.
- Celular: sin letreros ni botones encimados (letra del sistema hasta 125 %).
- Nada se sube a `main` sin permiso del usuario; se trabaja en la rama `ccr-2b9646ac-ks35za`.
- Pruebas en `tests/` (Playwright), cada tarea deja su prueba pasando antes del commit.

## Review Focus

- Partida con avance del nivel 1 y `etapa=1` abre y sigue funcionando tras el cambio de orden (Task 1).
- Jugador sin las 3 pistas intenta entrar al minijuego o a la carrera por URL directa: debe ser redirigido o avisado (Task 3, 5).
- Datos de nivel faltantes o JSON dañado: la página muestra mensaje y no se queda en blanco (Task 2, 3).
- Carrera en celular con la palanca y con 4 jugadores en red: nadie se sale de la pista ni se queda inmóvil (Task 6).
- Fabricación con un solo jugador: ningún paso exige a otra persona (Task 5).

---

### Task 1: Orden de niveles y atuendos

**Files:**
- Modify: `index.html` (`PLACES` líneas ~400-410 `need:` y etiquetas; `LEVELS` línea ~750; textos de nivel), `muneco.js` (`buildMuneco`, líneas ~125-145), `LEEME-PRIMERO.md`, `docs/CONTINUAR.md`
- Test: `tests/orden.js`

**Interfaces:**
- Produces: `LEVELS = [['El Café','nivel1'],['La Alfarería','nivel2'],['Los Caballos','nivel3'],['Música y Danza','nivel4']]`; `Muneco.jugador(etapa, fem)` con etapa 2 = alfarería (poncho él / tocado de flores y mochila ella), 3 = caballos (sombrero de paja y pañuelo rojo), 4 = música y danza (camisa blanca y faja roja / sanjuanera).

- [ ] **Step 1: Test `tests/orden.js`** (Playwright, `index.html#prueba`): con `PROG` simulado, comprobar que `taller` exige `need:'El Café'`, `caballos` exige `'La Alfarería'`, `tarima` exige `'Los Caballos'`; que `LEVELS` tiene ese orden; y que `Muneco.jugador(2,false)` y `(2,true)` construyen sin error.
- [ ] **Step 2: Ejecutar** `node tests/orden.js`. Esperado: FALLA (orden viejo).
- [ ] **Step 3: Reordenar** `PLACES.taller.need='El Café'`, `caballos.need='La Alfarería'`, `tarima.need='Los Caballos'`; actualizar `level:` ("Nivel 2 · La Alfarería", "Nivel 3 · Los Caballos", "Nivel 4 · Música y Danza"), `LEVELS` y el texto de `community`. Reasignar prendas en `buildMuneco`: la lógica `stage>=2` (sombrero+pañuelo) pasa a `stage>=3`; la de `stage>=4` (poncho, tocado de flores, mochila) pasa a `stage>=2`; camisa blanca/faja/sanjuanera quedan en `stage>=4`. Ajustar la muñeca: sombrero a la espalda solo si `stage>=3 && stage<4` junto con tocado de flores.
- [ ] **Step 4: Ejecutar** `node tests/orden.js`. Esperado: PASA. Captura de las 5 etapas (muñeco y muñeca) para revisar a ojo.
- [ ] **Step 5: Actualizar** `LEEME-PRIMERO.md` y `docs/CONTINUAR.md` (sección 2 de niveles y tabla de atuendos). **Commit** `feat: nuevo orden de niveles y atuendos`.

### Task 2: Trivia por nivel

**Files:**
- Modify: `trivia.html` (líneas ~249, 269 y textos "del café")
- Create: `data/trivia2.json`, `data/nivel2.json` (solo `trivia` y `cierre`; exploración en Task 3)
- Test: `tests/trivia_nivel.js`

**Interfaces:**
- Produces: `trivia.html?nivel=N` (por defecto 1) carga `data/trivia{N}.json` y `data/nivel{N}.json`; al superar pone `PROG['nivel'+N]=true`, `PROG['trivia'+N]=aciertos`, `PROG.etapa=Math.max(PROG.etapa||0,N)`.
- Consumes: formato actual de `data/trivia1.json` (mismas claves).

- [ ] **Step 1: Test** `tests/trivia_nivel.js`: abrir `trivia.html?nivel=2#prueba`, el título contiene "alfarería"; responder correcto 5 veces (ganchos existentes) y comprobar `PROG.nivel2===true`, `PROG.trivia2===5`, `PROG.etapa===2` y que `PROG.nivel1` no cambió; con `data/trivia2.json` bloqueado, la página muestra mensaje de error (no queda en blanco).
- [ ] **Step 2: Ejecutar**: FALLA.
- [ ] **Step 3: Implementar** lectura de `nivel` desde `location.search`, rutas dinámicas, textos desde `nivel{N}.json.trivia.titulo`, y mensaje de error si falla la carga.
- [ ] **Step 4: Crear `data/trivia2.json`** con 15 preguntas, cada una respaldada por una fila "Confirmado" de `nivel2-fuentes.md` (arcilla: minas del Salesiano y Guachicos; creadora; Ley 1891 y La Ruta de la Chiva; denominación de origen 2017, Resolución 23889, COARPI; proceso: modelar, secar, quemar, pintar; asociaciones/Ashuarte 2009). Cada pregunta lleva `fuente` (enlace).
- [ ] **Step 5: Ejecutar** pruebas de trivia 1 y 2. Esperado: PASAN. **Commit**.

### Task 3: Exploración del taller

**Files:**
- Modify: `finca.html` (lectura de nivel y construcción de escena; líneas ~544 y la función de armado de escena)
- Create: `data/nivel2.json` (diálogos y 3 pistas), escena del taller dentro de `finca.html` (`ESCENAS[2]`)
- Test: `tests/explora2.js`

**Interfaces:**
- Produces: `finca.html?nivel=2` arma el patio del taller (arcilla, torno, horno de leña, estantes de chivas) con 3 NPC (alfarero mayor, pintora de chivas, aprendiz), 3 pistas; guarda `PROG.pistas2` (lista) y `PROG.taller2=true` al completarlas; `window.__f` sigue exponiendo `player()`, `roofs`, `camera`, `SPOTS`.
- Consumes: formato de `data/nivel1.json`; `Muneco.npc(tipo)`.

- [ ] **Step 1: Test** `tests/explora2.js`: cargar `finca.html?nivel=2#prueba`, hablar con los 3 NPC (acercar al jugador con `__f.player()` y pulsar `E`), comprobar `PROG.pistas2.length===3`, `PROG.taller2===true`; verificar que el texto de la pista 2 contiene "Cecilia Vargas Muñoz" y "Ley 1891"; y que el nivel 1 (`finca.html#prueba`) sigue completándose.
- [ ] **Step 2: Ejecutar**: FALLA.
- [ ] **Step 3: Implementar** `ESCENAS` indexado por nivel en `finca.html` (la finca actual pasa a `ESCENAS[1]` sin cambios de comportamiento) y `LEVEL` desde `data/nivel{N}.json`; techos transparentes y colisiones siguen el mismo mecanismo. Pistas del taller = borrador de `nivel2-fuentes.md`.
- [ ] **Step 4: Ejecutar** `tests/explora2.js` y la prueba existente del nivel 1. Esperado: PASAN. Captura del taller en PC y celular (sin encimados). **Commit**.

### Task 4: Extraer el motor de estaciones de la cosecha

**Files:**
- Create: `estaciones.js`
- Modify: `cosecha.html` (queda con estaciones del café, reglas `R` y escena)
- Test: `tests/cosecha_regresion.js`

**Interfaces:**
- Produces: `Estaciones.iniciar({ST, R, accion(p,s), take(p), use(p,s,dt), escena})` con: entrada (teclado, ratón, mando, táctil, botón Acción y Soltar con avance), `nearest/pick`, letreros sin encimarse (`labels()`), snapshot/`clientFrame` para red, bucle y pausa. Cada minijuego define `accion`, `take`, `use` y las reglas.
- Consumes: el comportamiento actual de `cosecha.html` (no cambia).

- [ ] **Step 1: Test de regresión** `tests/cosecha_regresion.js`: flujo completo con `__c` (cafeto → despulpadora → tanque → cama → chiva), botón Acción en celular, Soltar, letreros sin encimarse en 390×844 con letra 125 %. Debe PASAR ya sobre el código actual (línea base).
- [ ] **Step 2: Mover** a `estaciones.js` el código de entrada, letreros, red y bucle; `cosecha.html` llama `Estaciones.iniciar(...)`. Sin cambiar comportamiento.
- [ ] **Step 3: Ejecutar** `tests/cosecha_regresion.js`. Esperado: PASA igual que en el Step 1. **Commit**.

### Task 5: Fabricación de artesanías (`alfareria.html`)

**Files:**
- Create: `alfareria.html`, `data/pedidos2.json` (opcional) o reglas en un objeto `R` dentro del archivo
- Test: `tests/alfareria.js`

**Interfaces:**
- Consumes: `Estaciones.iniciar` (Task 4); `Guardado.progreso()`.
- Produces: `alfareria.html` con estaciones `barro` (tomar), `amasado` (mantener), `torno` (mantener), `secadero` (secar varios días, cubrir si llueve), `horno` (leña; se quema si se pasa, queda cruda si falta), `pintura` (mantener), `entrega` (pedidos de chivas y vasijas); guarda `PROG.fabrica` (estrellas 0–3). Modo solo: ningún paso exige a otro jugador. Sin plaza de toros.

- [ ] **Step 1: Test** `tests/alfareria.js`: con `window.__a` (gancho `#prueba`), cadena completa de una pieza hasta entrega; amasado incompleto da pieza dañada; horno pasado de tiempo quema la pieza; sin errores de página en PC y celular; flujo jugando solo.
- [ ] **Step 2: Ejecutar**: FALLA.
- [ ] **Step 3: Implementar** la página con sus estaciones y reglas `R` (tiempos, pedidos, puntos; valores propuestos por el implementador, documentados en `R`). Redirige a `finca.html?nivel=2` si `PROG.taller2` es falso.
- [ ] **Step 4: Ejecutar** la prueba, más la de regresión de la cosecha. Captura en PC y celular. **Commit**.

### Task 6: Carrera de chivas (`carrera.html`)

**Files:**
- Create: `carrera.html`
- Test: `tests/carrera.js`

**Interfaces:**
- Produces: pantalla de diseño (colores del cuerpo y trompa, franjas, letrero entre "Pitalito, Timaná, Laboyos, Huila", carga) usando `D.chiva(cab, texto)` de `papel.js` extendido con los colores elegidos; luego carrera vista desde arriba, 2 o 3 vueltas por una pista inspirada en "La Ruta de la Chiva"; solo = 3 chivas de la máquina; 1 a 4 jugadores por `Red.sala`; guarda `PROG.carrera` (estrellas 0–3); `window.__r` para pruebas.
- Consumes: `Red.sala`, `Muneco`, `Guardado`; diseño guardado en `PROG.chiva` (objeto con las elecciones).

- [ ] **Step 1: Test** `tests/carrera.js`: elegir diseño, terminar 2 vueltas con `__r` acelerando el reloj, comprobar posición final y `PROG.carrera`; chiva fuera de pista vuelve a la pista; 4 chivas (1 humana + 3 máquina) terminan sin quedarse inmóviles; palanca táctil funciona.
- [ ] **Step 2: Ejecutar**: FALLA.
- [ ] **Step 3: Implementar** diseño, pista (lista de puntos), física simple (velocidad, giro, fricción, bordes), IA que sigue los puntos, vueltas y llegada, red (anfitrión simula, como `cosecha`). Redirige a `finca.html?nivel=2` si falta `PROG.taller2`.
- [ ] **Step 4: Ejecutar** la prueba. Captura diseño y carrera en PC y celular. **Commit**.

### Task 7: Mapa, progreso y comodines

**Files:**
- Modify: `index.html` (`juegosHTML`, hoja del taller, `syncProgress`, "Mi progreso"), `trivia.html` (comodines por estrellas del nivel)
- Test: `tests/mapa_nivel2.js`

**Interfaces:**
- Consumes: `PROG.taller2`, `PROG.fabrica`, `PROG.carrera`, `PROG.trivia2`.
- Produces: la ficha del taller lista Exploración, Fabricación (★), Carrera (★) y Trivia (mejor); tras 3 pistas se puede elegir juego libre como en la finca; las estrellas de fabricación y carrera suman comodines en la trivia del nivel 2.

- [ ] **Step 1: Test** `tests/mapa_nivel2.js`: con progreso del nivel 1 superado el taller aparece abierto y los Caballos plegados; con pistas completas la ficha muestra los 3 juegos; estrellas de `fabrica` y `carrera` aparecen en "Mi progreso" y suman comodines.
- [ ] **Step 2: Ejecutar**: FALLA. **Step 3: Implementar** lo anterior. **Step 4: Ejecutar** todas las pruebas de `tests/`. Esperado: PASAN.
- [ ] **Step 5: Commit** y actualizar `LEEME-PRIMERO.md` (tabla de archivos y estado).

### Task 8: Revisión de contenido y cierre

**Files:**
- Modify: `docs/nivel2-fuentes.md` (marcar lo usado en el juego), `LEEME-PRIMERO.md`
- Test: `tests/contenido2.js`

- [ ] **Step 1: Test** `tests/contenido2.js`: buscar en `data/nivel2.json`, `data/trivia2.json` y `alfareria.html` las palabras vetadas ("plaza de toros", "toros", años de la primera chiva, cifras de familias, temperaturas) y fallar si aparecen; cada pregunta de `trivia2.json` tiene `fuente`.
- [ ] **Step 2: Ejecutar** y corregir. **Step 3:** repetir pruebas de los 4 niveles de la cadena en PC y celular. **Step 4: Commit**; pedir al usuario permiso para el merge a `main` y que un docente valide los datos.
