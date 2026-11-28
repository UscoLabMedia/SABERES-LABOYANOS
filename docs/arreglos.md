# Bitácora de arreglos

Un arreglo, una línea: **síntoma → causa → arreglo → prueba**. Anota aquí cada error corregido para no repetirlo. Lo más nuevo, arriba.

| Fecha | Síntoma | Arreglo | Prueba |
|---|---|---|---|
| 28 nov 2026 | Inicio y trivia no tenían pantalla completa en horizontal; el botón chocaba con el título y las ayudas | Botón en la esquina inferior derecha en esas pantallas; `usabilidad.js` ahora exige el botón en horizontal | `tests/usabilidad.js` |
| 28 nov 2026 | Celular: la finca y el taller no tenían joystick; en horizontal los cuadros tapaban la pantalla; no había pantalla completa | Joystick táctil, cuadros compactos (`@media` horizontal), botón ⛶ y primer toque en horizontal | `tests/finca_celular.js` |
| 28 nov 2026 | La gorra amarilla de ella parecía pelo rubio; la elección decía «muñeco/muñeca» | Ella empieza sin gorra; se elige con dos retratos sin etiqueta al crear la partida | `tests/personaje.js` |
| 28 nov 2026 | Celular en vertical: los juegos se ven mal y nadie avisa | Aviso «Gira el celular» (no bloquea; se puede cerrar) | `tests/girar.js` |
| 28 nov 2026 | No se sabía con qué usuario se jugaba | El usuario aparece bajo el jugador y en los diálogos de finca y taller | `tests/nombre.js` |
| 27 nov 2026 | Las montañas del fondo de la finca temblaban | Montañas a distinta profundidad | `tests/montes.js` |
| 27 nov 2026 | Celular horizontal: letreros encimados en cosecha, fabricación, carrera y oleadas | Modo compacto (letreros mínimos, panel y aviso más chicos) | `tests/oleadas_horizontal.js`, `tests/usabilidad.js` |
| 27 nov 2026 | Celular: al mantener pulsado se seleccionaba texto; el sonido no volvía al regresar a la app | `user-select:none` y reanudar el audio al volver | `tests/tactil_sonido.js` |
| 27 nov 2026 | Revisión final del Nivel 2: campanazos al salir, chivas que llegaban y no frenaban, avisos que veían todos, diseños ajenos no se veían en red, datos sin respaldo | Ver commit `c70a550` | `tests/carrera.js`, `tests/alfareria.js` |

## Cómo usar esta bitácora
1. Al corregir un error: escribe primero una prueba que falle, arréglalo, y que pase.
2. Agrega la fila arriba.
3. Antes de dar por terminado un cambio de interfaz: `node tests/usabilidad.js` (o `node tests/usabilidad.js carrera` para una sola pantalla).

## Prueba de usabilidad general (`tests/usabilidad.js`)
Abre 9 pantallas (inicio, finca, taller, cosecha, oleadas, fabricación, carrera, trivia 1 y 2) en **celular vertical (390×844)**, **celular horizontal (844×390)** y **PC (1280×760)**. Por cada una marca:
- scroll horizontal de la página;
- controles fijos fuera de pantalla o más pequeños que 24 px;
- controles tapados por otro elemento;
- textos o botones encimados (más del 25 % del menor);
- errores de JavaScript.

No cuenta como problema (a propósito): el aviso «Gira el celular», la cuenta 3-2-1, pantallas de entrada que cubren todo, letreros 3D pegados a objetos que salen de pantalla con su objeto, y elementos con opacidad menor a 0,3.
**Límite:** solo mira la pantalla inicial de cada página, no el juego en marcha (banners, diálogos, fin de partida). Para eso añadir pasos con los ganchos `window.__x`.
Idea tomada de OpenGame; no se usa su generador ni Phaser.
