# Texturas del libro y la mesa

La mesa de madera y la portada de cuero con oro estampado de `index.html` usan texturas **horneadas**: las genera el código de `generar.html` y se guardan como JPG en `assets/`. El juego solo las descarga (unos 800 KB en total); no las genera en cada carga, porque en un celular tardaría varios segundos.

## Archivos en `assets/`

| Archivo | Para qué |
|---|---|
| `mesa-color.jpg`, `mesa-normal.jpg`, `mesa-rug.jpg` | Mesa de tablones: color, relieve de la veta y rugosidad (barniz) |
| `portada-color.jpg`, `portada-normal.jpg`, `portada-rug.jpg`, `portada-emis.jpg` | Portada: cuero, relieve del estampado, rugosidad y brillo propio del oro |
| `cuero-color.jpg` | Mosaico de cuero para las tapas |

Con calidad **baja** (Ajustes) el juego solo descarga los tres de color. Si algún archivo no carga, cae a un color sólido y a la portada dibujada por código (`drawCover`).

## Volver a hornearlas

```bash
npm i playwright            # una vez
node arte/texturas/hornear.js azul    # azul | miel | nogal
```

- `azul` (la que se usa): gris azulado frío, contrasta con el libro rojo y deja legible el título crema.
- `miel`: roble claro, más cálido. El título crema de la pantalla se leería mal sobre ella.
- `nogal`: marrón oscuro, el primer intento; contrasta poco con el libro.

Para cambiar el texto de la portada o los colores, edita `generar.html` (funciones `madera()` y `portada()`) y vuelve a hornear. Las tipografías están en `fuentes/` (Alegreya y Alegreya SC, licencia SIL Open Font).

## Notas técnicas

- Three.js r128 trata los colores hexadecimales como **lineales**: para un color sRGB sólido se usa `.convertSRGBToLinear()`.
- El oro se ve oscuro si solo es metálico, porque no hay nada que reflejar. Por eso la portada lleva un mapa **emisivo** (`portada-emis.jpg`) y un contorno oscuro alrededor de las letras.
- Pendiente (siguientes fases): libro abierto con páginas curvas hacia el lomo, grosor y costura; luz de lámpara y polvo en el aire.
