# Guardado y red

## Cuentas y partidas

Cada estudiante tiene un **usuario con contraseña**. Un usuario tiene varias **partidas**, y cada una guarda su propio progreso.

Al abrir el juego (`index.html`) siempre se pide usuario y contraseña. Después:

| Opción | Qué hace |
|---|---|
| Continuar | Abre la última partida con su progreso |
| Nueva partida | Pide un nombre. Si se deja vacío, se llama como la fecha y la hora (`27 nov 2026 08:50`) |
| Mis partidas | Abre otra partida, o la **borra** (pide confirmación) |
| Cerrar sesión | Sale. Está en **Mi progreso** y en la pantalla de partidas |
| Borrar mi cuenta | Borra el usuario y todas sus partidas. Pide escribir el usuario |

- La **sesión vive solo en la pestaña** (`sessionStorage`). Volver de un minijuego no pide nada. Abrir el juego otro día, o en otra pestaña, vuelve a pedir usuario y contraseña.
- La contraseña **nunca se guarda** en el navegador. Supabase la guarda cifrada.
- Cada quien solo ve y borra **sus** partidas (reglas de seguridad en `docs/supabase.sql`).
- El avance también queda copiado en el navegador. Sin internet se sigue jugando y se sube al volver la conexión.
- Los minijuegos (`finca`, `cosecha`, `oleadas`, `trivia`) no abren sin sesión: vuelven a la portada.
- Con `#prueba` al final del enlace, o sin Supabase en `config.js`, funciona en modo local sin cuentas (para pruebas).

Qué guarda cada parte del juego (objeto de progreso de una partida):

| Campo | Lo escribe | Significado |
|---|---|---|
| `etapa` | trivia.html | Atuendo del muñeco (0 al empezar, 1 tras El Café…) |
| `avatar` | finca.html | `muneco` o `muneca` |
| `pistas1`, `finca1` | finca.html | Pistas reunidas y finca completa |
| `cosecha` | cosecha.html | Mejores estrellas en la cosecha (0–3) |
| `oleadas` | oleadas.html | Mejores estrellas en la defensa del cafetal (0–3) |
| `trivia1`, `saberes1` | trivia.html | Mejor número de aciertos y de saberes |
| `nivel1` | trivia.html | `true` cuando se aciertan 3 o más preguntas |
| `actualizado` | guardado.js | Marca de tiempo; gana la copia más reciente |

## Activar Supabase (gratis)

1. Crea un proyecto en https://supabase.com (plan gratuito).
2. **SQL Editor** → New query → pega todo `docs/supabase.sql` → Run. Debe decir *Success*.
3. **Authentication → Sign In / Providers → Email**: **apaga "Confirm email"**. Los estudiantes se registran con un apodo, sin correo real, y el juego usa un correo interno inventado (`apodo@laboyos.app`).
4. **Project Settings → API Keys**: copia la **Project URL** y la clave **anon** (la que empieza por `eyJ`). Nunca la `service_role` ni la `secret`.
5. Pégalas en `config.js`:

```js
supabase: { url: 'https://xxxx.supabase.co', key: 'eyJ...' },
```

Si al entrar sale `permission denied for table partidas`, falta dar permiso a la tabla: ejecuta las dos líneas `grant` de `docs/supabase.sql`.

Si al crear un usuario sale "el dominio interno de correo no es válido", cambia el dominio en `config.js` con `dominio: 'tu-dominio.com'`.

Límites conocidos:
- **No hay "olvidé mi contraseña"**: el correo es inventado, así que no llega ningún enlace de recuperación. La pantalla de crear usuario ya avisa de esto.
  - Opción A, sin perder nada: el docente pone una contraseña nueva desde **SQL Editor** (sin probar contra un proyecto real; cambia `apodo` y la clave): `update auth.users set encrypted_password = extensions.crypt('ClaveNueva1', extensions.gen_salt('bf')) where email = 'apodo@laboyos.app';`
  - Opción B: borrar el usuario en **Authentication → Users**. El estudiante crea otro y pierde sus partidas.
- Necesita internet para entrar.
- Pide a los estudiantes usar un apodo, sin apellidos ni datos personales.
- Si dejaste las funciones antiguas del guardado por código (`leer_progreso`, `guardar_progreso`) y la tabla `progreso`, ya no se usan. Puedes borrarlas con `drop function leer_progreso(text); drop function guardar_progreso(text,text,text,jsonb); drop table progreso;`.
- Probado con un Supabase simulado (35 comprobaciones). Falta la prueba contra el proyecto real, desde un celular.

## Jugar en red

- La cosecha y la defensa del cafetal se juegan **cada persona en su celular o PC**. En la hoja de inicio, una persona elige **Crear sala** y comparte el código de 4 letras; las demás eligen **Unirme a una sala**. Máximo 4.
- Funciona con **PeerJS** (WebRTC) y su servidor público gratuito. Para un servidor propio, cambia `peer` en `config.js`.
- El anfitrión corre el juego y envía el estado 15 veces por segundo; los invitados envían sus controles.
- Al pasar del minijuego a la defensa y a la trivia, todos siguen al anfitrión con la misma sala.
- **No funciona dentro de la vista previa de Claude** (bloquea WebRTC). Funciona publicado en GitHub Pages, Netlify o itch.io.
- Si alguna red escolar bloquea WebRTC, hará falta un servidor TURN (de pago o propio).
