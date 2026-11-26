# Saberes de Laboyos

Videojuego web educativo y cultural sobre la identidad de Pitalito (Valle de Laboyos, Huila, Colombia). El mundo es un libro *pop-up* de papel que se despliega alrededor del jugador.

## Jugar

Abre `index.html` desde un servidor web; con doble clic no carga, porque el juego lee archivos JSON. Por ejemplo:

```bash
python3 -m http.server 8000
```

Luego entra a http://localhost:8000/.

Con GitHub Pages activado (Settings → Pages → Branch `main`, carpeta `/ (root)`) el juego queda en línea, y el modo en red funciona entre celulares y computadores.

## Qué hay

Nivel 1, El Café, completo:

1. El libro.
2. La finca: exploración con 3 pistas.
3. La cosecha: minijuego de estaciones, 1 a 4 jugadores en red.
4. La defensa del cafetal: oleadas de plagas.
5. La trivia.

Además:
- Perfiles por estudiante y código de respaldo.
- Guardado en la nube opcional con Supabase.

## Documentación

- `LEEME-PRIMERO.md`: estado del proyecto, decisiones de diseño y tareas pendientes (para continuar el desarrollo).
- `docs/guardado.md`: guardado, Supabase y juego en red.
- `docs/ideas.md`: ideas anotadas.

Hecho con Three.js. Todo el arte y el sonido se generan por código.
