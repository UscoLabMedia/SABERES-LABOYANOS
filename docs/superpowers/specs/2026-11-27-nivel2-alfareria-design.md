# Nivel 2 · La Alfarería — diseño

Estado: **borrador para aprobar**. Nada de esto está construido.

## Intención
Que estudiantes de Pitalito conozcan, jugando, el oficio de la cerámica laboyana y su historia (la chiva de barro, su creadora, la denominación de origen), con datos verificados (`docs/nivel2-fuentes.md`). Público: estudiantes y docentes; los datos deben ser ciertos.

## Cambio de orden (parte de este trabajo)
1 Café · **2 Alfarería** · **3 Caballos** · **4 Música y Danza** (festival, baile y reinado, etapa final).
Toca: `PLACES` y `LEVELS` en `index.html` (qué se abre después de qué), atuendo por etapa en `muneco.js`, `LEEME-PRIMERO.md`, `docs/CONTINUAR.md`, texto del mapa.
Atuendo (mi propuesta): etapa 2 = poncho (él) / tocado de flores y mochila (ella); etapa 3 = sombrero de paja y pañuelo rojo (caballos). La etapa 4 sigue igual. Ajustar la muñeca de etapa 3 (hoy "sombrero a la espalda" depende de la etapa 4).
No hay avance de niveles 2 a 4 guardado en partidas, así que no se pierde progreso. Los campos de partida pasan a ser `nivel2` = alfarería.

## Estructura del nivel
1. **Exploración** (`taller.html`, patio del taller): 3 personajes inventados, 3 pistas con datos verificados. Pistas: El barro · La chiva de barro (nombra a Cecilia Vargas Muñoz) · Solo de Pitalito (denominación de origen). Textos en `data/nivel2.json`. Aguacero/cierre como en la finca.
2. **Fabricación** (`alfareria.html`, como la cosecha, 1 a 4 jugadores en red): cadena barro → amasar (mantener) → modelar (mantener) → secar (cubrir si llueve) → hornear con leña → pintar (mantener) → entregar pedidos de chivas y vasijas. Mismos controles: botón Acción y Soltar. Sin plaza de toros. Reglas en un objeto `R`.
3. **Carrera de chivas** (`carrera.html`, reemplaza a las oleadas): primero se diseña y pinta la chiva (cuerpo, trompa, franjas, letrero, carga); luego se corre. Vista desde arriba, 1 a 4 jugadores en red, solo = 3 chivas de la máquina. Pista sobre "La Ruta de la Chiva" (San Agustín – Pitalito – Isnos – Saladoblanco), 2 o 3 vueltas. Las estrellas dan comodines en la trivia.
4. **Trivia**: `trivia.html` lee el banco del nivel; nuevo `data/trivia2.json` (~15 preguntas, solo con datos del documento de fuentes).
Superar el nivel: 3 aciertos o más en la trivia, como el nivel 1 (premio: prenda y abre el siguiente lugar).

## Objetivos
- Mismo ciclo y misma sensación que el nivel 1; reusar `papel.js`, `muneco.js`, `red.js`, `guardado.js`.
- Datos ciertos y con fuente; lo discutido se redacta sin cifras dudosas.
- Funciona en PC (teclado, ratón, mando) y celular (un botón de acción).

## No objetivos / anti-objetivos
- Sin plaza de toros ni referencias a ella.
- Sin temperaturas de horno ni tipos de pintura como "dato" (no hay fuente).
- No inventar datos históricos. Personajes ficticios; solo Cecilia Vargas aparece como persona real, solo en una pista y con lo que dice la Ley 1891.
- No tocar el sistema de cuentas/guardado más que añadir campos del nivel.

## Enfoques considerados
- **A. Copiar páginas del nivel 1:** rápido, pero duplica código y los arreglos se repiten.
- **B. Reusar y generalizar (recomendado):** `finca.html` y `trivia.html` leen su nivel desde JSON; el motor de la cosecha se separa en un archivo y la fabricación lo reutiliza. Riesgo: hay que volver a probar el nivel 1.
Se recomienda B, con el nivel 1 cubierto por las pruebas existentes (`#prueba`).

## Mis decisiones (para corregir)
- Nombres de archivos y de `data/nivel2.json`, `trivia2.json`.
- Atuendos por etapa (arriba).
- Un solo boceto PNG por pieza (taller, fabricación, chiva/pista) antes de programar.
- Construir en este orden: (0) cambio de orden, (1) exploración + datos, (2) trivia, (3) fabricación, (4) carrera. Cada paso se prueba y se sube a la rama; merge a main solo con tu permiso.

## Para el constructor
Cantidad de pedidos, tiempos y puntos de la fabricación; mapa y velocidad de la carrera; diálogos exactos (con los datos del documento de fuentes); preguntas de la trivia.

## Pendiente de validar
Los datos con discrepancias (`nivel2-fuentes.md`) y los enlaces oficiales deben revisarse con un docente antes de publicar.
