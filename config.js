/* config.js — ajustes del despliegue de "Saberes de Laboyos".
   Edita este archivo al publicar el juego (GitHub Pages, Netlify…). */
window.LABOYOS_CONFIG = Object.assign({
  // Guardado en la nube (opcional). Crea un proyecto gratis en supabase.com,
  // corre el SQL de docs/guardado.md y pega aquí la URL y la clave pública "anon".
  // Si quedan vacíos, el progreso se guarda solo en cada navegador.
  // La clave "anon" es pública por diseño (nunca pongas aquí la service_role).
  supabase: { url: 'https://zwzrgrguiwijrgzdpxgx.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3enJncmd1aXdpanJnemRweGd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTU3NzkyODcsImV4cCI6MjExMTM1NTI4N30.6saVaho5UygmbctImPEXrrKbjinNKl2jjBPrULedOSc' },

  // Servidor de salas para jugar en red. Vacío = servidor público gratuito de PeerJS.
  // Para un servidor propio: { host: 'mi-servidor.com', port: 443, path: '/', secure: true }
  peer: {},
}, window.LABOYOS_CONFIG || {});
