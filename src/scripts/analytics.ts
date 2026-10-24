// Google Analytics 4 (se activa con PUBLIC_GA_ID). Eventos del brief:
// agendar_click, calculo_hecho, formulario_enviado, whatsapp_click, recorrido_360_abierto.
export function track(evento: string, params: Record<string, unknown> = {}) {
  const datos = { pagina: location.pathname, modelo: document.body.dataset.modelo || undefined, ...params };
  if (typeof window.gtag === 'function') window.gtag('event', evento, datos);
  else if (import.meta.env.DEV) console.info('[analytics]', evento, datos);
}

const mapa: Record<string, string> = {
  agendar: 'agendar_click',
  whatsapp: 'whatsapp_click',
};

export function initAnalytics() {
  document.addEventListener('click', (e) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>('[data-track]');
    if (!el) return;
    const evento = mapa[el.dataset.track!] ?? el.dataset.track!;
    track(evento, { texto: el.textContent?.trim().slice(0, 60) });
  });
}
