# La Orquídera: personaje principal femenino

Recolectora de café, joven de unos 18 años. Estado: **bloque 3D** (formas base, sin detalle) y hoja de diseño aprobada. Aún no está en el juego.

## Decisiones de diseño (aprobadas)

- **Versión A, para jugar:** sombrero suaceño de iraca con orquídea, blusa clara de mangas largas, delantal, falda larga añil, canasto cafetero con cerezas, alpargatas con cinta roja.
- **Versión B, premio:** traje de sanjuanera del Festival del Bambuco (aún sin diseñar a fondo). Se entrega al ganar el concurso de baile, la etapa final.
- **Cuerpo:** esbelto, no muy alto, 5 cabezas. **Torso más corto que las piernas.**
- **Cara:** ojos normales (no puntos de luz), sonrisa pequeña, mejillas suaves, sin apariencia infantil ni estilo Disney.
- **Trenza:** a media espalda, con lazo rojo. De frente no se ve larga.
- **Estilo:** *Painterly Stylized 3D* (referencia: Kena) con ternura tipo Sky. Cabello por mechones geométricos, telas con trama y desgaste sutil, luz cálida.
- **Paleta:** teja `#c4553a`, paja `#e0a84a`, añil `#6f8fa0`, crema `#f3e6c6`, café `#4a2f20`, hoja `#7d8f5a`.
- Validar el vestuario con alguien de Pitalito antes de publicarlo.

## Archivos

| Ruta | Qué es |
|---|---|
| `modelo/orquidera_bloque.py` | Script de Blender (`bpy`) que construye el bloque y exporta el GLB |
| `modelo/orquidera_bloque.glb` | Resultado: 55 objetos, ~29.000 triángulos, 430 KB |
| `referencias/boceto-v7.png` | Hoja de diseño: frente, espalda y perfil, rostro y paleta |
| `referencias/ilustracion-A-v2.png` | Ilustración 3/4 de la versión A |
| `referencias/bloque-3d-v1.png` | El bloque visto desde cuatro lados, ya cargado en Three.js |
| `referencias/fuentes/*.html` | Generadores de las dos imágenes (abrir en un navegador) |

## Regenerar el modelo

Blender se usa como módulo de Python, sin interfaz. Necesita Python 3.13:

```bash
python3 -m venv bl && ./bl/bin/pip install bpy
./bl/bin/python arte/personajes/orquidera/modelo/orquidera_bloque.py --out orquidera_bloque.glb
```

El script imprime las medidas (`MEDIDAS`): alto 1,52 m, cabeza 0,31 m (4,9 cabezas), hombro a cintura 0,28 m, cintura al suelo 0,87 m.

## Límites del bloque

- Sin esqueleto ni animaciones. Rostro plano (sin nariz ni boca). Manos y mangas simples. Cabello en casco, sin mechones.
- ~29.000 triángulos: alto para celular. El modelo final debe quedar por debajo de ~15.000.
- Probado solo en Three.js r128. El plan es migrar a una versión moderna de Three.js en el prototipo `demo-visual-3d/`.

## Siguientes pasos

1. Rostro con nariz y boca suaves; mechones de cabello; texturas pintadas.
2. Esqueleto y animaciones (reposo, caminar, recolectar).
3. Probar en un prototipo aparte, sin tocar los escenarios del juego.
4. Versión B (sanjuanera) y vestuario por etapa.
