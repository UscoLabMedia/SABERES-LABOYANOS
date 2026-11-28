# Elegir personaje al crear la partida (Aviso 3) — diseño corto

**Por qué:** el estudiante elige con qué personaje jugar desde el inicio, sin etiquetas «hombre/mujer» ni «muñeco/muñeca», para no establecer roles de género.

**Decidido por el usuario (28 nov 2026):**
- Siguen los dos cuerpos de hoy (`Muneco.jugador(etapa, fem)`), con sus prendas por etapa.
- Se elige en la pantalla «Nueva partida» (`inicio.js`), **solo con dibujos**: dos retratos, sin texto de género (opción A).
- El selector «Juego con: Muñeco / Muñeca» sale de la finca.
- Se puede cambiar después, en **Mi progreso** (`index.html`), con los mismos dos retratos.
- Partidas viejas conservan su personaje.

**Enfoques considerados:** A solo dibujos (elegido: cero etiqueta); B retratos con nombre propio (los nombres marcan género); C «Personaje 1 / 2» (frío, sugiere orden).

**Cómo (decisiones del constructor):**
- Por dentro el valor sigue siendo `avatar: 'muneco' | 'muneca'` en la partida: no se ve en pantalla, evita tocar 6 archivos y migrar partidas.
- Retratos con `Muneco.retrato()`; `index.html` debe cargar `muneco.js` antes de `inicio.js`.
- Accesibilidad: botones con `aria-pressed`; `alt` por apariencia («Pelo corto con gorra», «Cola de caballo con aretes»); marca ✓ además del borde (no solo color).
- Sin selección previa: «Empezar» pide elegir uno (mensaje en `#inErr`). Así nadie queda con uno por defecto.
- `Guardado.cuenta.nueva(nombre, avatar)` guarda `avatar` en los datos iniciales.
- Ningún texto visible dice «muñeco», «muñeca», «hombre», «mujer», «niño» o «niña» en la elección.

**No se hace:** más cuerpos, piel o pelo a elegir, cambio del traje por etapa.

**Pruebas:** `tests/personaje.js` (nueva partida pide elegir; guarda el avatar; Mi progreso lo cambia; la finca ya no tiene selector y usa el guardado; sin texto de género) y `tests/usabilidad.js`.

**Boceto:** `2026-11-28-elegir-personaje-boceto.png`. Retrato girado un poco más para que se vea la cola de caballo.
