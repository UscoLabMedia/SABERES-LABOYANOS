# Reglas de trabajo y ahorro de tokens

Proyecto: "Saberes de Laboyos". Antes de nada lee `LEEME-PRIMERO.md` (estado, decisiones y tareas). No pidas al usuario que lo explique de nuevo.

## Reglas fijas (se aplican en cada conversación)

### Estilo caveman
Responde siempre en español, en estilo caveman: frases cortas, palabras simples, sin saludos, sin relleno y sin repetir lo ya dicho. Primero el resultado, después lo mínimo necesario. Código, comandos, rutas y nombres de archivo van exactos, sin acortar. Si hay un riesgo o algo que el usuario debe decidir, dilo claro aunque ocupe una línea más. No cambies este estilo hasta que el usuario pida respuestas normales.

### Superpowers
Si los skills de superpowers están disponibles, úsalos según el tamaño de la tarea:
- **Diseño nuevo, nivel nuevo o funcionalidad nueva:** invoca `superpowers:brainstorming` antes de construir y muestra la propuesta.
- **Error o comportamiento inesperado:** invoca `superpowers:systematic-debugging` antes de proponer una corrección.
- **Antes de decir "listo" o de subir cambios:** invoca `superpowers:verification-before-completion` y comprueba con una prueba o un comando, no con suposiciones.
- **Cambio pequeño** (texto, color, un parámetro, un dato en JSON): no hace falta ningún skill ni plan escrito. Hazlo directo.
Si superpowers no está disponible, aplica igual estas tres prácticas a mano.

### Elegir modelo y esfuerzo
Yo no puedo cambiar mi propio modelo. Lo que sí hago:
1. Al empezar una tarea, si no coincide con el modelo actual, digo en una línea qué modelo y esfuerzo conviene (según la tabla de abajo) y le pido al usuario que cambie con `/model`.
2. Delego en subagentes con el modelo más barato que sirva: búsquedas y lecturas con `explorador` (Haiku); ediciones mecánicas con Sonnet. El esfuerzo del subagente solo lo fijo si el usuario lo pide.
3. Subo de modelo solo si el más barato falla o la tarea es de diseño o arquitectura.

### Ponytail (código mínimo)
Ponytail es un plugin de https://github.com/DietrichGebert/ponytail. Si está instalado, úsalo. Si no, aplica su idea a mano: el mejor código es el que no se escribe. Antes de escribir código, recorre esta escalera y para en el primer paso que sirva:
1. ¿Esta función debe existir?
2. ¿Ya está en el proyecto? Reúsala.
3. ¿Lo resuelve la biblioteca estándar o una función nativa del navegador?
4. ¿Lo resuelve algo ya instalado (Three.js, `papel.js`, `muneco.js`)?
5. ¿Cabe en una línea?
6. Si no, escribe lo mínimo que funcione.

Escribe solo lo que pide la tarea. No recortes validación, manejo de errores, seguridad ni accesibilidad. Si hay ramas, bucles, dinero o seguridad, deja una prueba pequeña. En este proyecto, antes de crear una pieza nueva, busca si ya existe en `papel.js`, `muneco.js`, `red.js` o `guardado.js`.

## Cómo trabajar

1. **Respuestas cortas.** Primero el resultado, sin repetir lo ya dicho.
2. **Leer poco.** Busca con `grep` y lee solo el rango de líneas necesario. No releas un archivo que acabas de editar.
3. **Cambios pequeños.** Edita con reemplazos puntuales. No reescribas un archivo completo ni crees uno nuevo grande sin mostrar antes una propuesta.
4. **Una tarea por conversación.** Al terminar una tarea, abre una conversación nueva (o `/clear`). Si la conversación se alarga, `/compact`.
5. **Capturas solo si hacen falta.** Máximo una por cambio, recortada al área que cambió.
6. **Pruebas baratas.** Usa los ganchos `cosecha.html#prueba` (`window.__c`) y `oleadas.html#prueba` (`window.__o`) y comprueba con números antes de mirar imágenes.
7. **Diseño nuevo = propuesta antes de construir.** Los bocetos son PNG, no páginas HTML.

## Qué modelo y esfuerzo usar

| Tarea | Modelo | Esfuerzo |
|---|---|---|
| Cambiar textos, JSON, preguntas, colores, un parámetro | Haiku o Sonnet | bajo |
| Arreglar un error puntual, ajustar un minijuego existente | Sonnet | medio |
| Diseño nuevo, arquitectura (red, guardado), niveles nuevos, errores difíciles | Opus | alto |
| Buscar dónde está algo en el código | subagente `explorador` (Haiku) | bajo |

Empieza siempre con el modelo más barato que pueda hacer la tarea y sube solo si falla.

## Estructura para gastar menos

Los archivos `cosecha.html`, `oleadas.html`, `finca.html` e `index.html` son grandes porque mezclan HTML, estilos y código. Cuando se toque uno, sacar su JavaScript a un archivo propio (`cosecha.js`, etc.) para que cada cambio lea y escriba menos. No hacerlo todo de una vez.
