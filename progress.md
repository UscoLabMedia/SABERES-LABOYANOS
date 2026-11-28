# Progreso del proyecto (28 nov 2026)

Léelo junto con `LEEME-PRIMERO.md`. Rama de trabajo: `ccr-2b9646ac-ks35za`. **`main` = rama hasta `870feaa`** (todo lo de abajo ya está en `main`, salvo que se indique). Pages: https://uscolabmedia.github.io/SABERES-LABOYANOS/

## Reglas de trabajo (el usuario las fijó)
- Respuestas en español, estilo caveman (cortas). Presupuesto 0 pesos.
- **Merge a `main` solo con permiso explícito del usuario** (`git push origin HEAD:main`, avance rápido).
- Diseño nuevo → propuesta/boceto en PNG antes de construir. Arreglos pequeños: directo, con prueba que falle antes y pase después.
- **Siempre, en horizontal:** pantalla completa disponible y nada encimado. Ver `CLAUDE.md`. `tests/usabilidad.js` lo exige.
- Datos históricos del juego: solo los verificados en `docs/nivel2-fuentes.md` (lo leen estudiantes y docentes).

## Hecho
- **Libro y mesa:** libro realista (fases 1–4: mesa de madera carbón, portada de cuero, páginas curvas con costura, luz de lámpara, polvo, viñeta). Sombras ajustadas por rendimiento.
- **Cuentas y partidas** con Supabase real (sin recuperación de contraseña, avisado).
- **Nivel 1 (café)** completo: finca, cosecha, oleadas, trivia.
- **Orden de niveles:** 1 Café · 2 Alfarería · 3 Caballos · 4 Música y Danza (festival, baile y reinado al final). Atuendos por etapa en `muneco.js`.
- **Nivel 2 (alfarería)** completo: `finca.html?nivel=2` (taller, 3 pistas con datos verificados, nombra a Cecilia Vargas Muñoz), `alfareria.html` (fabricación en cadena, 1–4 jugadores), `carrera.html` (diseña tu chiva y corre «La Ruta de la Chiva»), `trivia.html?nivel=2` (15 preguntas con fuente). El taller se abre en el libro al superar El Café.
- **Controles:** botón único de Acción (tocar = tomar; mantener = usar) y Soltar; sin atascos; mismo esquema en PC, mando y celular. Motor común `estaciones.js`.
- **Celular:** modo compacto en horizontal, sin selección de texto al mantener, sonido que se reanuda al volver a la app, aviso «Gira el celular» en vertical.
- **Arreglos de avisos:** montañas de la finca ya no tiemblan; el usuario aparece bajo el jugador y en los diálogos.
- Sonido real al abrir el libro (Pixabay, `assets/libro-abrir.mp3`, con respaldo sintético). Texturas horneadas en `assets/` (`arte/texturas/`).

## Pruebas (carpeta `tests/`, Playwright + Chrome del sistema)
`node tests/<nombre>.js` — ayudas en `tests/lib.js` (servidor local, three.js local, bloquea fuentes remotas). Nombres: `orden`, `trivia_nivel`, `explora`, `cosecha_regresion`, `alfareria`, `alfareria_red`, `recetas`, `carrera`, `mapa_nivel2`, `contenido2`, `tactil_sonido`, `oleadas_horizontal`, `montes`, `nombre`, `girar`, `usabilidad`, `personaje`, `finca_celular`. Variable `THREE_JS` = ruta a three.min.js r128. Todas pasaban al último commit.

## Pendiente (en este orden sugerido)
1. ~~Bitácora `docs/arreglos.md` y `tests/usabilidad.js`~~ **hecho** (0 problemas en pantalla inicial de las 9 páginas × 3 vistas). Falta ampliarla a pantallas en marcha (banners, diálogos, fin de partida).
2. ~~Aviso 3~~ **hecho:** el personaje se elige al crear la partida con dos retratos sin etiqueta de género y se cambia en Mi progreso; ella empieza sin gorra. Prueba `tests/personaje.js`.
3. ~~Aviso 4~~ **hecho (rama):** joystick en la finca y el taller, cuadros compactos en horizontal, pantalla completa en el celular (botón ⛶ y primer toque en horizontal; `Papel.pantallaCompleta()`). Prueba `tests/finca_celular.js`. Falta probar en celular real (en iPhone no hay pantalla completa). Notas del Nivel 2 (28 nov, solo anotadas, ver `docs/ideas.md` 4b): pantalla completa no se activa en horizontal; los cuadros de El Taller tapan mucho en horizontal; sin joystick (= este aviso).
4. ~~Aviso 5~~ **hecho (rama, no en main):** fabricación por pedidos con receta (clientes NPC, 4 figuras, taller en 3 columnas, repisa, red). Pruebas `tests/recetas.js`, `tests/alfareria.js` (tarda ~6 min), `tests/alfareria_red.js`. Las estrellas [30,60,95] son una estimación: validar en una partida real. Falta probar red en celulares reales.
5. **Nivel 3 Caballos:** referencia del usuario https://youtu.be/Rvs7O4oqgGo?t=168; falta definir qué mecánica tomar.
6. **Nivel 4 Música y Danza** (Zelda ocarina + baile de flechas/Club Penguin, reinado con corona) y **La Orquídera** (personaje 3D, `arte/personajes/orquidera/`; Opus, esfuerzo alto, empezar por la cara).
7. Menores del revisor del Nivel 2 (en `docs/ideas.md` y abajo): cuenta 3-2-1 invisible para invitados, vuelta contada en `WP[19]` vs línea en `WP[0]`, pistas de trivia que no contienen la respuesta, trivia 2 con textos del café si `nivel2.json` falla, falta bloqueo de nivel en `trivia.html?nivel=2`/`finca.html?nivel=2`, aviso de modo en red de fabricación, condición muerta `&& false` en `carrera.html`, `cambiado()` guarda en cada carga.
8. Pulir colores pálidos del taller y de la fabricación.
9. **Validar contenidos con un docente de Pitalito** y abrir los enlaces oficiales (el entorno no pudo abrirlos).
10. **No probado:** red entre celulares reales (WebRTC/PeerJS), mandos reales, rendimiento en celular real.

## Decisiones abiertas para el usuario
- Traje de la etapa 4 cambió por el reordenamiento (muñeca sin sombrero en la cabeza, con flores y mochila; muñeco con poncho): ¿está bien?
- Un compañero sin las 3 pistas que entra por enlace de sala a fabricación/carrera vuelve a la exploración: ¿se permite entrar a jugar en grupo?

## Notas técnicas
- Three.js r128 (colores hex lineales → `.convertSRGBToLinear()`; sin `CapsuleGeometry`). Ganchos de prueba con `#prueba`: `__i` (index), `__f` (finca), `__c` (cosecha), `__a` (fabricación), `__r` (carrera), `__o` (oleadas), `__t` (trivia).
- Estaciones nuevas: copiar el patrón de `alfareria.html` (bucle y red propios) y usar `Estaciones.entrada`, `colocarLetreros`, `botonAccion`.
- `data/nivelN.json` y `data/triviaN.json` alimentan `finca.html?nivel=N` y `trivia.html?nivel=N`.
- Plan y diseño del Nivel 2: `docs/superpowers/plans/` y `docs/superpowers/specs/`. Ideas y avisos de probadores: `docs/ideas.md`.
