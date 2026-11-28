# Fabricación por pedidos con receta (Aviso 5) — diseño

Estado: borrador para aprobar · 28 nov 2026 · Bocetos: `2026-11-28-fabricacion-recetas-boceto-1-juego.png` (jugando) y `-2-receta.png` (receta abierta).

## Por qué
Hoy la fabricación (`alfareria.html`) es una cadena larga e igual para todo (mina → amasado → torno/mesa → secadero con toldo → horno con leña → pintura → puesto). El usuario (probando el Nivel 2) dijo: es muy larga, no hay espacio para pasar y **no se sabe qué figura fabricar**. Quiere que **llegue un cliente, pida una figura y aparezca una receta** para saber cómo hacerla.

## Objetivos
- Un cliente llega al mostrador y pide una figura **al azar** entre **chiva, frutero, jarrón y matera**.
- Cada figura tiene su **receta**; la **chiva es la más complicada**, las demás más sencillas o con variaciones.
- La chiva se pinta **con los colores que pide el cliente**.
- Proceso más corto: **sin leña**, **sin lluvia, sin toldo ni palanca** (todo bajo techo).
- Escenario: **taller por dentro** en **tres columnas** con ruta en zigzag (ver Taller); la mina abajo a la izquierda.
- Paciencia de los clientes según jugadores: **solo 120 s (2 clientes a la vez) · 2 jugadores 90 s (3) · 3–4 jugadores 70 s (3)**.
- Regla fija: en celular horizontal, pantalla completa y **nada encimado** (`tests/usabilidad.js`).

## No objetivos
- No cambia la carrera de chivas, la trivia ni el diseño de chiva de `PROG.chiva`.
- No se agregan otras figuras fuera de las cuatro.
- No hay lluvia ni eventos de clima.

## Anti-objetivos (sería un fracaso aunque funcione)
- Presentar las recetas de frutero, jarrón y matera como **dato histórico** de Pitalito: no hay fuente de su proceso.
- Tarjetas, letreros o recetas que **tapen estaciones** o se encimen en celular.
- Que el estudiante no sepa qué hacer después: siempre se ve el **paso siguiente**.

## Datos (fuentes)
- Las **figuras** salen de fuentes: chiva (proceso verificado, `docs/nivel2-fuentes.md`); fruterías y jarrones/materas en Pitalito: [Radio Nacional](https://radionacional.co/cultura/tradiciones/artesanias-de-colombia-en-festival-pitalito-huila) («la chiva, los ranchos, las arcas, las fruterías») y Ministerio de Cultura, *Los Cuadernos del Barro* (almacén de Pitalito con vajillas, materas, floreros, jarrones; página sin confirmar). Agregar estas fuentes a `docs/nivel2-fuentes.md` con la nota «solo el nombre de la figura; el proceso no tiene fuente».
- **Recetas = reglas del juego.** Solo la de la chiva sigue el proceso verificado (modelado a mano, secado, quema, pintura; la carga se pega a la carrocería). La pantalla dice «Receta del juego» en las otras tres.

## Recetas (decididas con el usuario)
| Figura | Pasos |
|---|---|
| Matera | Barro → Amasar → Torno → Secar → Hornear → Entregar (sin pintar) |
| Jarrón | Barro → Amasar → Torno → Secar → Hornear → Pintar → Entregar |
| Frutero | Barro → Amasar → Modelar a mano → Secar → Hornear → Pintar → Entregar |
| Chiva | Barro → Amasar → Modelar carrocería → Modelar carga → Pegar carga → Secar → Hornear → Pintar (colores del cliente) → Entregar |

Las recetas viven en `data/recetas2.json` (editable por docentes, como `data/trivia2.json`): por figura, nombre, pasos (lista de ids de paso), puntos, si lleva colores y la nota de fuente.

## Taller (escena)
Interior visto de frente-arriba, sin pared delantera; piso de baldosa, pared del fondo con ventanas y vigas. **Tres columnas con pasillos entre ellas; la ruta va en zigzag** (pedido del usuario: «que hayan columnas», la ruta en fila era muy básica):

```
          IZQUIERDA                  MEDIO            DERECHA
ARRIBA    Torno · Mesa de modelar · Torno   Horno · Horno    Pintura
MEDIO     Amasado · Amasado          (pasillo)        Pintura
ABAJO     Mina (barro)               Secadero         Mostrador ← clientes
```
Ruta: mina → amasado → torno/mesa (sube por la izquierda) → secadero (baja por el medio) → horno (sube) → pintura (cruza a la derecha) → mostrador (baja). El **Horno** arranca solo al cargar; si no se saca a tiempo la pieza se va quemando (se mantiene). Secadero con 3 puestos, sin toldo. Los clientes esperan a la izquierda del mostrador, dentro del taller. Pasillos entre columnas de al menos 2 unidades del mundo. Mesa de modelar junto a los tornos y 2 mesas de pintura: **decisión mía** (el usuario dijo «como creas que es mejor»).

## Cómo se juega
- Llega un cliente (muñeco NPC con `Muneco.npc`), se pone frente al mostrador y su pedido aparece como **tarjeta compacta** arriba a la derecha: figura, «paso n de N», nombre del paso actual y **barra de paciencia**. Tarjetas en fila, sin encimarse.
- **Tocar una tarjeta** abre la **receta completa** (ventana con pasos ✓, el actual resaltado, «Cerrar»). En modo solo el tiempo **se detiene** mientras está abierta; con más jugadores no.
- La pieza en las manos muestra sobre el jugador: «Chiva: carrocería ✓ · sigue Modelar carga».
- Una pieza **sabe para qué figura es** desde que se elige en el torno o la mesa (el jugador elige figura al empezar a modelar: si hay un solo pedido que use esa estación, se toma ese; si hay varios, el botón alterna entre ellos). La carga de la chiva se modela aparte y se **pega** en la mesa juntándola con la carrocería.
- Las estaciones **solo aceptan el paso que toca** según la receta de la pieza (p. ej. la matera no entra a Pintura; la chiva sin carga no entra al Secadero). Un aviso corto dice por qué.
- **Pintura de la chiva:** el cliente pide 2 colores al azar de {rojo, amarillo, azul, verde}; en Pintura se elige color con el botón (tocar = cambia color, mantener = pinta) hasta poner los 2 pedidos. Jarrón y frutero: pintar sin elegir color.
- **Entregar:** llevar la pieza terminada al mostrador; se entrega al cliente que pidió esa figura (si hay dos iguales, al de menos paciencia). Puntos por figura (chiva la que más) + bono por rapidez. Si se acaba la paciencia, el cliente se va (resta puntos, como hoy).
- Duración 180 s o modo tranquilo (como hoy). Estrellas y `PROG.fabrica` igual que hoy.

## Se quita
Leña (estación, ítem y textos), lluvia, toldo y palanca, el camino de la mina afuera, la regla de rajadura por no amasar (amasar ahora es un paso obligatorio de la receta).

## Se mantiene (reusar)
`estaciones.js` (Acción tocar/mantener, Soltar, letreros, botón), red con `red.js` (anfitrión simula, invitados envían controles; el estado de clientes y recetas va en el snapshot), `guardado.js`, `muneco.js`, gancho `window.__a` con `#prueba`, `Papel.avisoGirar()` (incluye pantalla completa).

## Qué deja al constructor
Medidas exactas del taller y la cámara, mallas de las figuras (matera, jarrón, frutero; la chiva ya existe), tiempos de cada paso (partir de `R` actual: amasar 1.6 s, modelar 1.8 s, pintar 1.6 s; secado ~10 s, quema ~14 s, ventana 10 s), puntos exactos, sonidos, textos de ayuda e intro.

## Decisiones tomadas tras la revisión (mías; corregibles)
1. **La pieza se ata a la figura, no al cliente.** Se entrega a cualquier cliente que pida esa figura (si hay dos, al de menos paciencia). Si el cliente se va, la pieza sirve para el siguiente que pida esa figura. Así no quedan piezas huérfanas y el estado en red es más simple.
2. **Capacidad:** cada estación trabaja una pieza a la vez; el Secadero tiene 3 puestos. El jugador carga **un objeto** a la vez. Del Secadero solo se saca cuando está seca. Del Horno se saca cuando está lista; si se deja, se va quemando (**como hoy**: sigue sirviendo pero da menos puntos).
3. **Chiva:** carrocería y carga se modelan por separado en la Mesa (cualquier jugador, cualquier orden). La primera parte queda **esperando en la Mesa**; cuando se lleva la otra parte, Acción las **pega**. La Mesa guarda como máximo una parte esperando.
4. **Pieza sin cliente:** se puede dejar en el Mostrador (repisa de 2 puestos) hasta que llegue un cliente que la pida; sin castigo. El ritmo de llegada parte del actual (`pedidoCada` 22 s) y lo ajusta el constructor con la paciencia.
5. **Estrellas:** se recalibran a los nuevos puntos (el constructor prueba una partida tipo en solo); `PROG.fabrica` sigue guardando 0–3 estrellas.
6. **Bocetos:** están en este mismo directorio.

## Pruebas
- `tests/alfareria.js` reescrita: cada receta de principio a fin con `__a`; estación rechaza paso equivocado; chiva exige carga y colores; paciencia 120/90/70 s según jugadores; receta abierta detiene el tiempo solo en modo solo; sin leña, lluvia ni toldo.
- `tests/contenido2.js`: textos de recetas no-chiva dicen «Receta del juego».
- `tests/usabilidad.js` (pantalla inicial) + medición de tarjetas y ventana de receta en celular horizontal: nada encimado.
