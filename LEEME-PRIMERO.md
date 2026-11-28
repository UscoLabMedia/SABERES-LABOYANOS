# Saberes de Laboyos — indicaciones para continuar con otra IA

Entrega a la otra IA el archivo `saberes-laboyos.zip` (todo el proyecto) y pídele que lea primero este archivo (`docs/CONTINUAR.md`). Está escrito para que pueda seguir sin preguntar lo que ya se decidió.

Última actualización: 27 de noviembre de 2026.

**Estado al día (qué está hecho, qué falta y reglas de trabajo): lee también `progress.md`.**

---

## 1. Qué es el proyecto

Videojuego web educativo y cultural sobre la identidad de **Pitalito (Valle de Laboyos, Huila, Colombia)**. El jugador recorre escenarios de los oficios laboyanos, aprende pistas, juega minijuegos y completa trivias.

- **Presupuesto total:** máximo 50 USD. Todo es gratuito hasta ahora: sin imágenes, modelos ni audio externos; todo se genera por código.
- **Plataforma:** navegador web, Three.js r128 (desde cdnjs), sin herramientas de compilación. Hosting previsto: GitHub Pages, Netlify o itch.io.
- **Estética:** libro *pop-up* de papel y cartón. Recortes con borde blanco troquelado y textura de fibra, sombras suaves, piezas que se despliegan con rebote elástico al acercarse el personaje. Referencia visual: el proyecto "Papertrails" (mundo de papel que se despliega alrededor del jugador).
- **Idioma:** todo el juego y la documentación en español de Colombia.
- **Público:** estudiantes. Se juega en el aula, cada estudiante en su propio celular o PC.

## 2. Diseño decidido (no reabrir sin preguntar)

**Niveles (ejes):** 1 El Café · 2 La Alfarería · 3 Los Caballos · 4 La Música y la Danza (festival, baile y reinado, etapa final). Orden cambiado el 27 de nov de 2026 por decisión del usuario.

**Ciclo de cada nivel:**
1. Exploración tranquila (*cozy*): escenario pop-up, 2–3 personajes con diálogos breves y 3 pistas en cápsulas.
2. Minijuego de oficio frenético, tipo *Overcooked*, sin roles fijos, de 1 a 4 jugadores en red.
3. Modo **Oleadas**: defensa con un palo contra amenazas del oficio.
4. Trivia con preguntas en JSON local. Con 3 aciertos o más se supera el nivel.

**Elección libre:** cuando el jugador ya reunió las 3 pistas de la finca, puede ir directo a cualquier minijuego (cosecha, defensa o trivia), desde la finca o desde la ficha de la finca en el libro. Las pistas quedan guardadas (`pistas1`, `finca1`).

**La "batalla de argumentos / rap" se eliminó del plan.** No la implementes.

**Recompensas:** cada nivel superado suma una prenda tradicional al personaje y abre el siguiente escenario en el libro. Las estrellas de la cosecha y de las oleadas dan comodines en la trivia.

**Personaje (muñeco de papel plegado en 3D, `muneco.js`):**
- Facetado, con líneas de pliegue, cabeza grande y cara pintada amable (ojos grandes con brillo, cejas arriba, sonrisa, mejillas rosadas).
- Versión **muñeco** y versión **muñeca**. La muñeca lleva cola de caballo, aretes, pestañas y falda corta de jean al inicio.
- Atuendo por etapa:

| Etapa | Atuendo |
|---|---|
| 0 Inicio | Gorra, camiseta, jean, tenis, morral |
| 1 Café | Mochila tejida a la espalda y alpargatas |
| 2 Alfarería | Él: poncho al hombro. Ella: tocado de flores y mochila al costado |
| 3 Caballos | Sombrero de paja y pañuelo rojo alrededor del cuello (ella lo lleva a la espalda por las flores) |
| 4 Música y Danza | Él: camisa blanca y faja roja. Ella: traje de sanjuanera (blusa blanca con cuello bandeja de encaje, falda ancha con flores) |

- Los rojos del muñeco deben ser intensos (`#c8101e`).
- Los NPC usan el mismo muñeco, más genéricos y sin prendas de premio: Don Arnulfo (caficultor), Doña Rosa (recolectora) y Lucía (catadora).

**Comunidad (aún no construida):**
- Tableros por hilos temáticos en una sala con estética pop-up (la "Torre de los saberes").
- Para escribir en un tablero hay que haber superado su nivel.
- Borradores sin conexión y sala del moderador, que abre o cierra los muros.
- Fotos históricas:
  - Se comprimen en el navegador a `.webp` de 150–250 KB.
  - Se suben a Cloudinary o Supabase Storage; Google Drive solo como respaldo del moderador. No se usan Instagram ni 500px.
  - Cada foto lleva ficha (descripción, década, lugar) y cesión de derechos obligatoria: "sin fines comerciales" o "con y sin fines comerciales".

## 3. Estado actual

Los niveles 1 (café) y 2 (alfarería) están jugables, de principio a fin:

Nivel 1: `index.html` (libro) → `finca.html` (exploración) → `cosecha.html` (minijuego) → `oleadas.html` (defensa) → `trivia.html` → regreso al libro con el nivel superado.
Nivel 2: libro → `finca.html?nivel=2` (el taller, 3 pistas) → `alfareria.html` (fabricación de artesanías) → `carrera.html` (diseña tu chiva y corre) → `trivia.html?nivel=2` → regreso al libro. El taller se despliega en el libro al superar El Café.

| Archivo | Qué hace |
|---|---|
| `index.html` | Pantalla de inicio: libro que se abre, mapa de Pitalito con pop-ups. Menú, ajustes, **Mi progreso** (usuario, partida, cambiar de partida y cerrar sesión) y progreso del recorrido. En el ZIP ya trae `<!doctype html>` y `<meta charset>` al inicio, listo para GitHub Pages. |
| `finca.html` | Exploración del Nivel 1 (y del Nivel 2 con `?nivel=2`, el taller). Elección muñeco o muñeca. 3 NPC dan 3 pistas, cuaderno de saberes, aguacero al final. |
| `cosecha.html` | Minijuego (teclado, mando, táctil y **ratón**: clic en el suelo para caminar, clic en una estación para tomar o soltar, mantener el clic para usar): cafetal → despulpadora (manivela, se atasca) → tanques (fermentar 18 s, lavar) → secadero (voltear, marquesina contra la lluvia) → chiva. Pedidos, calidad de taza (>80 = especial), 3 min o modo tranquilo. Reglas en el objeto `R`. |
| `oleadas.html` | Defensa del cafetal (con **ratón**: clic o mantener para golpear hacia el puntero): 12 cafetos, 5 oleadas de broca, roya (salta al vecino) y ojo de gallo (con lluvia). Ataque con palo. Reglas en `FOE`, `WAVES` y `ATK`. |
| `trivia.html` | 5 preguntas al azar de `data/trivia1.json` (`?nivel=N` usa `data/triviaN.json`), 20 s cada una. Comodines 50/50, +10 s y Cuaderno. Saberes por acierto, rapidez y racha. |
| `papel.js` | Utilidades compartidas: ajustes (`S`), sonido sintetizado (`Sound`), recortes troquelados (`cutout`), dibujos (`D`), texturas, cajas y techos. |
| `muneco.js` | `Muneco.jugador(etapa, fem)` (etapa = niveles superados en orden), `Muneco.npc(tipo)`, `Muneco.animar()` y `Muneco.retrato()`. |
| `guardado.js` | Cuentas y partidas con Supabase Auth. Para los minijuegos la API no cambia: `Guardado.progreso()`, `.guardar()`, `.perfil()`, `.actualizarPerfil({avatar})`. Cuentas en `Guardado.cuenta`. Ver `docs/guardado.md`. |
| `inicio.js` | Pantalla de entrada: usuario y contraseña, crear usuario, continuar o nueva partida, borrar partidas y borrar cuenta. |
| `red.js` | Salas en red con PeerJS: `Red.sala(contenedor, opciones)` arma la pantalla de sala (Solo, Crear sala, Unirme). Modelo: el anfitrión simula; los invitados envían controles y reciben el estado a 15 Hz. |
| `config.js` | Datos de Supabase y del servidor PeerJS. |
| `alfareria.html` | Minijuego del Nivel 2 (1 a 4 jugadores en red): mina → amasado → torno o mesa de chivas → secadero (toldo contra la lluvia) → horno con leña → pintura → puesto de la feria. Si no amasas el barro, la pieza se rajará en el horno; si el horno se pasa, se quema. Reglas en el objeto `R`. Gancho `window.__a` con `#prueba`. |
| `carrera.html` | Carrera de chivas del Nivel 2: pantalla de diseño (trompa, cuerpo, franja, letrero, carga; se guarda en `PROG.chiva`) y carrera de 3 vueltas por «La Ruta de la Chiva», con turbo; solo = 3 chivas de la máquina. Gancho `window.__r`. |
| `estaciones.js` | Motor común de los minijuegos de estaciones: entrada de un solo botón de Acción (tocar = tomar; mantener = usar) y Soltar en teclado, ratón, mando y celular, control de invitados por red, letreros sin encimarse y botón de Acción. Lo usan `cosecha.html`, `alfareria.html` y `carrera.html`. |
| `tests/` | Pruebas con Playwright (`node tests/<nombre>.js`; ayudas en `tests/lib.js`): `orden`, `trivia_nivel`, `explora`, `cosecha_regresion`, `alfareria`, `carrera`, `mapa_nivel2`, `contenido2`, `tactil_sonido`. Necesitan Chrome del sistema y three.js local (`THREE_JS=ruta`). |
| `data/nivel2.json`, `data/trivia2.json` | Diálogos, pistas, cierre y 15 preguntas del Nivel 2, cada una con su fuente. Datos verificados en `docs/nivel2-fuentes.md`. |
| `data/nivel1.json` | Diálogos y pistas de la finca (editable por docentes). |
| `data/trivia1.json` | Banco de preguntas (editable por docentes). |
| `docs/guardado.md` | Cómo funcionan las cuentas y partidas, cómo activar Supabase y la red. |
| `docs/supabase.sql` | SQL de la tabla `partidas`, sus permisos y reglas de seguridad. |
| `assets/` y `arte/texturas/` | Texturas horneadas de la mesa de madera y la portada de cuero del libro (≈800 KB), y el generador para rehacerlas. Ver `arte/texturas/README.md`. |
| `arte/personajes/orquidera/` | Personaje La Orquídera: bloque 3D (Blender → GLB), hoja de diseño y README con decisiones. |
| `docs/ideas.md` | Ideas anotadas. |
| `propuesta-personaje.html`, `personaje-propuesta*.png` | Bocetos del personaje. No son parte del juego. |

**Orden de carga de scripts en cada página:** `config.js` → `guardado.js` → three.js → peerjs (solo cosecha y oleadas) → `papel.js` → `muneco.js` → `red.js`.

**Ganchos de prueba:** `cosecha.html#prueba` expone `window.__c` y `oleadas.html#prueba` expone `window.__o`, para simular el juego desde la consola o Playwright.

## 4. Cómo probarlo

- Necesita servidor web, porque carga JSON. Por ejemplo, dentro de la carpeta: `python3 -m http.server 8000`, y luego abrir `http://localhost:8000/`.
- **Red:** no funciona dentro de la vista previa de Claude (bloquea WebRTC). Para probarla, abre la misma página en dos navegadores o equipos, crea una sala en uno y únete con el código en el otro. En local se puede usar un servidor PeerJS propio (`npm i peer`) y apuntar `config.js` a él.
- Se probó en Chromium sin pantalla:
  - Cadena completa de la cosecha.
  - Oleadas.
  - Trivia.
  - Cuentas y partidas con un Supabase simulado (36 comprobaciones): registro, entrar, partidas, borrado, sin internet y renovación del token.
  - Ratón en cosecha (clic en cafeto → canasto) y en oleadas (clic → golpe hacia el puntero).
  - Elección libre de minijuegos con la finca completa.
  - Salas de 2 equipos en cosecha y oleadas (con un servidor PeerJS local).
- Se probó con el **Supabase real** (a mano, 27 nov): crear usuario, nueva partida, guardado en la nube, continuar, borrar partida y borrar cuenta.
- **No se ha probado:**
  - Mandos.
  - Controles táctiles en un celular real.
  - Sonido.
  - Servidor público de PeerJS.
  - Redes escolares.

## 5. Tareas pendientes, en orden sugerido

1. **Probar la red entre celulares reales.** El juego ya está publicado en GitHub Pages (`https://uscolabmedia.github.io/SABERES-LABOYANOS/`) y Supabase ya está activo.
2. **Validar contenidos** con alguien de Pitalito:
   - Altura (~1.300 m) y cafetales hasta ~2.000 m.
   - Humedad del grano seco: 10–12 %.
   - Café especial: más de 80 puntos.
   - Datos de broca, roya y ojo de gallo (en `WAVES`, en `oleadas.html`).
   - Traje de la sanjuanera.
   - Nombres del mapa del libro.
3. **Llevar el personaje 3D al libro (`index.html`):** los muñecos del mapa siguen siendo recortes planos. Mostrar el atuendo ganado.
4. ~~Nivel 2: La Alfarería~~ **hecho en la rama** (falta validar contenidos con un docente y probar la red entre celulares reales; diseño en `docs/superpowers/specs/2026-11-27-nivel2-alfareria-design.md`, plan en `docs/superpowers/plans/`, datos en `docs/nivel2-fuentes.md`). ). Luego **Nivel 3: Los Caballos**, con el mismo ciclo: exploración, minijuego de oficio, oleadas con amenazas propias y trivia. Reusar `muneco.js`, `red.js` y `guardado.js`, y el patrón de `cosecha.html` y `oleadas.html` (snapshot del anfitrión y `clientFrame` en los invitados).
5. **Niveles 3 y 4**, después.
6. **Comunidad, sala del moderador y archivo fotográfico** (ver sección 2), probablemente sobre Supabase (Auth + Storage).
7. **Proyecto aparte (no mezclar):** juego para un programa de Comunicación Social y Periodismo, donde los niveles son asignaturas y el jugador elige a qué clase entrar.

## 5b. Decisiones tomadas el 27 de noviembre de 2026 (no reabrir sin preguntar)

**Cuentas y partidas**
- Cada estudiante tiene un **usuario y una contraseña**. Un usuario tiene varias **partidas**; cada una guarda su propio progreso.
- Siempre se pide usuario y contraseña al abrir el juego. Después, **Continuar** o **Nueva partida** (con nombre propio, o la fecha y hora si se deja vacío). Se pueden **borrar partidas** y **borrar la cuenta**.
- **No hay recuperación de contraseña.** Quien la olvida crea un usuario nuevo con otro nombre y empieza de cero. Está avisado en las pantallas de Entrar y Crear usuario. No agregar "restablecer contraseña".
- Se usa Supabase Auth con un correo inventado (`apodo@laboyos.app`), con "Confirm email" apagado. Pedir a los estudiantes un apodo, sin apellidos.
- Los perfiles locales, el PIN y los códigos (`LAB-XXXXXX` y de respaldo) se quitaron.

**Publicación**
- GitHub Pages publica solo desde `main`. Los commits desde sesiones de Claude a veces no disparan la publicación; se resolvió y hoy funciona. Si el sitio se ve viejo, revisar la pestaña Actions.
- Supabase: un proyecto nuevo no da permisos a la tabla; por eso `docs/supabase.sql` incluye los `grant`.

**Etapa final: Festival del Bambuco y Reinado** (ver `docs/ideas.md`)
- Concurso de baile tipo *Dance Contest* de Club Penguin: juego de ritmo con flechas que simula los pasos del sanjuanero. El reinado se juega en solitario o contra compañeros; gana quien acierte más teclas o tenga más puntaje. Al ganar se entrega la corona.
- El **concurso de música es otro modo de juego**, estilo *Zelda* con ocarina; no suma al reinado.
- El traje de sanjuanera (versión B de La Orquídera) es el premio.

**Dirección visual 3D** (solo diseño; el juego aún usa los muñecos de papel)
- El libro *pop-up* se mantiene como portada y mapa. Los escenarios pasarían a 3D con estilo *Painterly Stylized 3D* (referencia: Kena) y ternura tipo Sky.
- Se migrará a una versión moderna de Three.js solo en un prototipo aparte (`demo-visual-3d/`); no subir la versión en el juego actual sin preguntar.
- Personaje principal femenino: **La Orquídera**, versión A para jugar. Ver `arte/personajes/orquidera/README.md`.

## 6. Reglas de trabajo que pidió el usuario

- **Mostrar propuestas antes de construir** cuando sea un diseño nuevo (personajes, escenas). Para bocetos, entregar **imágenes PNG**, no páginas HTML.
- Cuando diga "toma nota" o "no hagas cambios", solo anotar.
- Si el usuario deja comentarios con "acá" sobre la pantalla, pedirle una referencia del mapa: el punto exacto no siempre llega.
- Respuestas cortas y directas.
- Priorizar herramientas gratuitas y respetar el presupuesto de 50 USD.
- Accesibilidad: respetar "reducir animaciones", texto grande y contraste. Que funcione en celular.

## 7. Mensaje sugerido para arrancar con la otra IA

> Vas a continuar el desarrollo de "Saberes de Laboyos", un videojuego web educativo sobre Pitalito, Huila. Lee primero `docs/CONTINUAR.md` y `docs/guardado.md`, y revisa el código de `cosecha.html`, `oleadas.html`, `red.js`, `guardado.js` y `muneco.js`. Respeta las decisiones de la sección 2. El Nivel 1 está completo (con red, guardado, ratón y elección libre de minijuegos). Empieza por la tarea 1 de la sección 5 y luego sigue en orden. Antes de cambiar el diseño, muéstrame una propuesta. Responde en español y de forma breve.
