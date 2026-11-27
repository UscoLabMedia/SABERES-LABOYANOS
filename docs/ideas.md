# Ideas para después

## Modo Oleadas (batalla contra amenazas del café)

Va después del minijuego de la cosecha, en el Nivel 1.

- El personaje defiende el cafetal con un palo contra oleadas de amenazas reales del café.
- Amenazas posibles, una por oleada:
  - **Broca del café**: insecto pequeño y rápido que se mete en la cereza. Llega en enjambres.
  - **Roya**: manchas naranjas que saltan de hoja en hoja. Se "contagia" si no se ataca a tiempo.
  - **Ojo de gallo**: hongo lento que aparece en zonas húmedas, sobre todo cuando llueve.
- Cada amenaza que llega a un cafeto le baja la producción. Al final se cuenta cuántos cafetos quedaron sanos.
- Se puede jugar de 1 a 4 en la misma pantalla, como la cosecha.
- Usa los mismos muñecos (`muneco.js`) y la misma arena del cafetal.
- Pendiente de decidir: si las pistas de la finca dan ventajas (por ejemplo, la pista de la cosecha selectiva enseña a detectar la broca).

## Uso del ratón (anotado y hecho el 2026-11-26)

En la defensa del cafetal (oleadas) y en las estaciones de la cosecha, el ratón debe servir para atacar y activar acciones: clic para golpear hacia el puntero y clic en las estaciones para tomar, soltar o usar. Debe convivir con teclado, mando y táctil, y funcionar en red.

## Etapa final: Festival del Bambuco y Reinado (anotado el 2026-11-26)

Solo anotado. Sin diseño ni código todavía.

- Es la **etapa final** del juego. Reúne todo lo aprendido en los niveles anteriores.
- Dos concursos dentro del festival:
  - **Concurso de música**, estilo *Zelda* tocando la ocarina: el jugador repite o interpreta melodías. Instrumentos a considerar: tiple, bandola y guitarra, que son los del trío andino colombiano.
  - **Concurso de baile**, estilo *Dance Contest* de Club Penguin: juego de ritmo con flechas (confirmado por el usuario) que simula los pasos del sanjuanero. Referencia: https://clubpenguin.fandom.com/es/wiki/Concurso_de_Baile.
- El **traje de sanjuanera (opción B de La Orquídera)** es el premio de esta etapa: blusa blanca con cuello bandeja, falda ancha con flores y tocado de flores.
- **Cómo se gana (decidido):**
  - Se puede jugar en **modo solitario** o **concursando con compañeros**.
  - Gana quien acierte la mayoría de teclas o tenga el mayor puntaje.
  - Al ganar el concurso de baile se entrega la **corona**.
- El **concurso de música es otro modo de juego**, aparte del reinado. No suma al puntaje de la corona.
- Pendiente: cómo se muestra el ranking en red.

## La Orquídera: decisiones de diseño (anotado el 2026-11-26)

- Personaje femenino principal, joven de ~18 años, cuerpo esbelto y no muy alta (7 cabezas), rostro natural sin estilo Disney.
- **Opción A (para jugar):** sombrero suaceño de iraca, blusa clara, delantal, canasto cafetero y falda larga.
- **Opción B (premio):** traje de sanjuanera del Festival del Bambuco.
- **Trenza:** cae por la espalda hasta la **mitad de la espalda**. De frente no debe verse larga.
- Se busca que los personajes sean más **tiernos y lindos**, sin llegar a estilo Disney ni apariencia infantil. Pendiente de definir cuánto (ver bosquejos).
- Estilo visual buscado: Painterly Stylized 3D (referencia: Kena: Bridge of Spirits). Aún en etapa de bosquejos, sin modelado.

## Notas de las pruebas con estudiantes (27 de noviembre de 2026)

Solo anotado. Sin diseño ni código todavía. Fuente: observaciones de quienes probaron el juego publicado, incluido Andrés Janet.

**Estética: techos transparentes**
- Al entrar a una edificación techada (casa, beneficiadero), el techo debe volverse transparente para ver el interior. Hoy los techos son `hipRoof` fijos en `finca.html` (casa y beneficiadero) y la marquesina de `cosecha.html`.

**Oleadas: ataque**
- **Power-up:** al matar X enemigos seguidos, el golpe se vuelve un **movimiento circular (giro)** que hace **más daño**.
- **Clic con el mouse:** debe **dirigir el personaje hacia esa dirección** (hoy solo golpea hacia el puntero; el personaje gira solo si el golpe está listo).
- **Alcance visible:** el golpe debe tener un **rango de impacto en distancia y apertura**. Hoy existe en `ATK` (`alcance` 1,45 y `angulo` 1,25 rad a cada lado, o sea un arco de ~143°), pero el jugador no lo ve.
- **Cambiar la imagen del movimiento:** hoy solo se mueve el brazo (`swingArm`). Falta un efecto visible del barrido.
- **Ampliar a 360°:** el margen del golpe debe poder llegar a 360° (encaja con el giro del power-up).
- Pendiente de aclarar: si "dirigir el personaje" con el clic es solo **mirar** hacia el puntero o también **caminar** hacia allí.

**Hecho el 27 de noviembre (en `oleadas.html`), decidido con el usuario:**
- **Clic con el mouse:** el personaje **mira y camina** hacia el punto. Mantener el clic lo sigue; las teclas, la palanca o el mando cancelan el camino.
- **Barrido visible:** cada golpe dibuja en el suelo un sector con el alcance y la apertura reales (`ATK`: 1,45 y ~143°).
- **Poder (`POD`):** se carga al derrotar **5 plagas** (por jugador). Lo **activa el jugador** con la tecla **R**, **Shift**, el botón **Poder** (también en celular) o el mando. Dura **15 s**: golpe **giratorio de 360°**, daño 2 y alcance 1,8. El personaje se **ilumina** con un aura y un aro dorados, y parpadean en los últimos 3 s. Mientras dura no se carga otro. Funciona en red: la carga y el tiempo viajan en la instantánea del anfitrión.
- **Techos transparentes (hecho en `finca.html`):** el techo del beneficiadero y el de la casa se vuelven casi transparentes (opacidad 0,18) cuando el personaje está debajo, o detrás y el techo lo taparía desde la cámara. Se desvanecen con suavidad y vuelven a ser opacos al salir. Función `techos()`; gancho de prueba `window.__f` con `#prueba`. La marquesina de la cosecha ya era translúcida.
- Parámetros para ajustar a gusto: `POD.bajas` (5), `POD.dura` (15), `POD.dano` (2), `POD.alcance` (1,8).

## Pendientes anotados el 27 de nov de 2026 (avisos de probadores y del usuario)

No están hechos; cada uno necesita confirmar el alcance antes de programarse.

1. **Nombre bajo el jugador = el usuario.** El nombre que se escribe al entrar (usuario) debe ser el que aparece bajo el personaje en todos los juegos. Revisar dónde sale otro nombre (en la finca los diálogos usan `S.name` o «visitante»; los minijuegos usan `Guardado.perfil().nombre`).
2. ~~**Finca en PC: montañas que tiemblan.**~~ **Hecho (rama, 27 nov):** cada montaña va a distinta profundidad; prueba `tests/montes.js`. Antes: **Finca en PC: montañas que tiemblan.** Las montañas del fondo se superponen, se ven sus márgenes blancos y parpadean (probable z-fighting entre tarjetas a la misma profundidad). Separarlas en profundidad o quitar el borde donde se solapan.
3. **Elegir personaje al crear la partida**, no en la finca. Pensar opciones distintas a «muñeco o muñeca» (por ejemplo varios personajes o apariencias sin etiqueta de género). Se guarda en la partida.
4. **Celular: moverse con joystick** también donde hoy se toca el suelo (la finca y la exploración del taller), igual que en los minijuegos.
5. **Fabricación (alfareria.html) rediseñada por pedidos con receta.** Llega un cliente y pide una figura; **cada figura tiene procesos distintos**; en pantalla aparece la **receta** (pasos en orden) que se sigue y luego se **entrega al cliente**. Reemplazaría la cadena única actual (barro → amasado → torno/mesa → secadero → horno → pintura). Hace falta diseño nuevo y propuesta en PNG antes de construir. Los datos de cada figura deben salir de fuentes verificadas (`docs/nivel2-fuentes.md`).
6. **Aviso de voltear** para mejorar la jugabilidad en celular: un aviso claro (visual, sonido y/o vibración) cuando el grano del secadero necesita voltearse en la cosecha.

7. **Minijuego de los caballos (Nivel 3): referencia del usuario** — https://youtu.be/Rvs7O4oqgGo?t=168 (minuto 2:48). Anotado el 27 nov 2026; falta confirmar con el usuario qué mecánica de ese video quiere tomar (no se pudo ver el video desde el entorno de trabajo).
