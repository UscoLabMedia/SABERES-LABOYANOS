# Reglas de trabajo y ahorro de tokens

Proyecto: "Saberes de Laboyos". Antes de nada lee `LEEME-PRIMERO.md` (estado, decisiones y tareas). No pidas al usuario que lo explique de nuevo.

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
