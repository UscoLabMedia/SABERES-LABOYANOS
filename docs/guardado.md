# Guardado y red

## Cómo se guarda hoy

- Cada equipo (celular o PC) puede tener varios **perfiles**, uno por estudiante. Se manejan en el libro, en **Mi progreso**.
- El progreso de cada perfil se guarda en el navegador (`localStorage`, claves `laboyos.perfiles`, `laboyos.perfil` y `laboyos.progreso.<id>`).
- El **código de respaldo** (en Mi progreso) lleva perfil y progreso a otro equipo: se copia en uno y se pega en el otro.
- Si `config.js` tiene datos de Supabase, cada guardado también sube a la nube. Sin internet queda pendiente y se sube al volver la conexión.

Qué guarda cada parte del juego (objeto de progreso):

| Campo | Lo escribe | Significado |
|---|---|---|
| `etapa` | trivia.html | Atuendo del muñeco (0 al empezar, 1 tras El Café…) |
| `cosecha` | cosecha.html | Mejores estrellas en la cosecha (0–3) |
| `oleadas` | oleadas.html | Mejores estrellas en la defensa del cafetal (0–3) |
| `trivia1`, `saberes1` | trivia.html | Mejor número de aciertos y de saberes |
| `nivel1` | trivia.html | `true` cuando se aciertan 3 o más preguntas |
| `actualizado` | guardado.js | Marca de tiempo; gana la copia más reciente |

## Pantalla de entrada: sesiones y PIN

Al abrir `index.html` aparece **¿Quién juega?** (`inicio.js`), una vez por visita. Volver desde un minijuego no la repite.

| Botón | Qué hace |
|---|---|
| Continuar como … | Sigue con el perfil de este equipo. Si tiene PIN, lo pide |
| Nueva partida | Pide nombre y PIN opcional de 4 números. Empieza en cero |
| Cambiar de persona | Lista de perfiles de este equipo |
| Entrar con mi código | Trae un perfil de otro celular con su código de respaldo |

- **Cerrar sesión** está en el menú del libro. Vuelve a mostrar la pantalla.
- El PIN se puede poner, cambiar o quitar en **Mi progreso**.
- El PIN es un freno contra entradas por error en un equipo compartido, no seguridad fuerte: son 4 números y se guarda en el navegador. El código de respaldo lleva el PIN.
- Solo `index.html` muestra la pantalla. Quien abra `finca.html` directo entra con el último perfil del equipo.

## Activar la nube (gratis, Supabase)

1. Crea una cuenta y un proyecto en https://supabase.com (plan gratuito).
2. En el proyecto, abre **SQL Editor** y corre esto:

```sql
create table if not exists public.progreso (
  id text primary key,
  nombre text,
  avatar text,
  datos jsonb not null default '{}'::jsonb,
  actualizado timestamptz not null default now()
);
-- Sin políticas: nadie puede leer ni listar la tabla directamente.
alter table public.progreso enable row level security;

-- Solo se puede leer un perfil si se conoce su código (LAB-XXXXXX).
create or replace function public.leer_progreso(p_id text)
returns table(nombre text, avatar text, datos jsonb)
language sql security definer set search_path = public as $$
  select nombre, avatar, datos from progreso where id = p_id;
$$;

-- Guarda solo si la copia que llega es igual o más reciente.
create or replace function public.guardar_progreso(p_id text, p_nombre text, p_avatar text, p_datos jsonb)
returns void
language sql security definer set search_path = public as $$
  insert into progreso (id, nombre, avatar, datos, actualizado)
  values (p_id, p_nombre, p_avatar, p_datos, now())
  on conflict (id) do update
    set nombre = excluded.nombre, avatar = excluded.avatar, datos = excluded.datos, actualizado = now()
    where coalesce((excluded.datos->>'actualizado')::bigint, 0) >= coalesce((progreso.datos->>'actualizado')::bigint, 0);
$$;

grant execute on function public.leer_progreso(text) to anon;
grant execute on function public.guardar_progreso(text, text, text, jsonb) to anon;
```

3. En **Project Settings → API** copia la **Project URL** y la clave pública **anon**.
4. Pégalas en `config.js`:

```js
supabase: { url: 'https://xxxx.supabase.co', key: 'eyJ...' },
```

La clave `anon` es pública por diseño; lo que protege los datos son las funciones de arriba. Límite conocido: quien tenga el código `LAB-XXXXXX` de un perfil puede leerlo y escribirlo. Para un curso real conviene pasar a cuentas con Supabase Auth.

> Esta parte no está probada contra un proyecto real de Supabase: se escribió sin acceso a uno.

## Jugar en red

- La cosecha y la defensa del cafetal se juegan **cada persona en su celular o PC**. En la hoja de inicio, una persona elige **Crear sala** y comparte el código de 4 letras; las demás eligen **Unirme a una sala**. Máximo 4.
- Funciona con **PeerJS** (WebRTC) y su servidor público gratuito. Para un servidor propio, cambia `peer` en `config.js`.
- El anfitrión corre el juego y envía el estado 15 veces por segundo; los invitados envían sus controles.
- Al pasar del minijuego a la defensa y a la trivia, todos siguen al anfitrión con la misma sala.
- **No funciona dentro de la vista previa de Claude** (bloquea WebRTC). Funciona publicado en GitHub Pages, Netlify o itch.io.
- Si alguna red escolar bloquea WebRTC, hará falta un servidor TURN (de pago o propio).
