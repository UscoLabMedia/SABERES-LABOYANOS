/* config.js — ajustes del despliegue de "Saberes de Laboyos".
   Edita este archivo al publicar el juego (GitHub Pages, Netlify…). */
window.LABOYOS_CONFIG = Object.assign({
  // Guardado en la nube (opcional). Crea un proyecto gratis en supabase.com,
  // corre el SQL de docs/guardado.md y pega aquí la URL y la clave pública "anon".
  // Si quedan vacíos, el progreso se guarda solo en cada navegador.
  supabase: { url: '', key: '' },

  // Servidor de salas para jugar en red. Vacío = servidor público gratuito de PeerJS.
  // Para un servidor propio: { host: 'mi-servidor.com', port: 443, path: '/', secure: true }
  peer: {},
}, window.LABOYOS_CONFIG || {});
