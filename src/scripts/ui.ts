
import { initModelos } from './modelos';
import { track } from './analytics';

export function initUI() {
  initModelos();
  heroMiniaturas();
  pestanas();
  acordeon();
  mapa();
  videos();
  lightbox();
  plano();
  recorrido360();
}

/** Miniaturas del hero: al pasar el mouse cambian el fondo con un recorte. */
function heroMiniaturas() {
  const lista = document.querySelector<HTMLElement>('[data-hero-thumbs]');
  if (!lista) return;
  const capas = [...document.querySelectorAll<HTMLElement>('[data-hero-capa]')];
  const thumbs = [...lista.querySelectorAll<HTMLElement>('[data-hero-thumb]')];
  // Las fotos de fondo están recortadas (clip-path) y el lazy loading nunca las descargaría:
  // en desktop se piden cuando la página ya cargó, antes del primer hover.
  if (matchMedia('(min-width: 1024px)').matches) {
    const precargar = () => capas.forEach((c) => c.querySelectorAll('img').forEach((img) => { img.loading = 'eager'; }));
    if (document.readyState === 'complete') precargar();
    else addEventListener('load', precargar, { once: true });
    lista.addEventListener('pointerenter', precargar, { once: true });
  }
  const activar = (i: number) => {
    capas.forEach((c, k) => c.classList.toggle('is-activa', k === i));
    thumbs.forEach((t, k) => t.classList.toggle('is-activa', k === i));
  };
  thumbs.forEach((t, i) => {
    t.addEventListener('mouseenter', () => activar(i));
    t.addEventListener('focus', () => activar(i));
  });
  lista.addEventListener('mouseleave', () => activar(-1));
  lista.addEventListener('focusout', (e) => { if (!lista.contains(e.relatedTarget as Node)) activar(-1); });
}

/** Pestañas accesibles genéricas (ubicación). */
function pestanas() {
  document.querySelectorAll<HTMLElement>('[data-tabs]').forEach((cont) => {
    const tabs = [...cont.querySelectorAll<HTMLButtonElement>('[data-tab]')];
    const paneles = [...cont.querySelectorAll<HTMLElement>('[data-panel]')];
    const activar = (i: number, foco = false) => {
      tabs.forEach((t, k) => { t.setAttribute('aria-selected', String(k === i)); t.tabIndex = k === i ? 0 : -1; });
      paneles.forEach((p, k) => {
        p.hidden = k !== i;
        if (k === i) p.animate?.([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 450, easing: 'cubic-bezier(.22,1,.36,1)' });
      });
      if (foco) tabs[i].focus();
    };
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => activar(i));
      t.addEventListener('keydown', (e) => {
        const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (dir) { e.preventDefault(); activar((i + dir + tabs.length) % tabs.length, true); }
      });
    });
  });
}

/** Acordeón de preguntas frecuentes: uno abierto a la vez, altura animada en CSS. */
function acordeon() {
  document.querySelectorAll<HTMLElement>('[data-acordeon]').forEach((cont) => {
    const botones = [...cont.querySelectorAll<HTMLButtonElement>('[data-acordeon-btn]')];
    botones.forEach((b) => {
      b.addEventListener('click', () => {
        const abrir = b.getAttribute('aria-expanded') !== 'true';
        botones.forEach((o) => {
          const abierto = o === b ? abrir : false;
          o.setAttribute('aria-expanded', String(abierto));
          const panel = document.getElementById(o.getAttribute('aria-controls')!);
          if (panel) panel.dataset.abierto = String(abierto);
        });
      });
    });
  });
}

/** Mapa de Google: se carga al tocar (no pesa en la carga inicial). */
function mapa() {
  document.querySelectorAll<HTMLElement>('[data-mapa]').forEach((fig) => {
    fig.querySelector('[data-mapa-cargar]')?.addEventListener('click', (e) => {
      const iframe = document.createElement('iframe');
      iframe.src = fig.dataset.src!;
      iframe.title = 'Mapa de ubicación de Praderas de Arraiján';
      iframe.loading = 'lazy';
      iframe.referrerPolicy = 'no-referrer-when-downgrade';
      iframe.allowFullscreen = true;
      (e.currentTarget as HTMLElement).replaceWith(iframe);
    });
  });
}

/** Testimonios: modal con YouTube cargado solo al abrir (lite embed). */
function videos() {
  const modal = document.querySelector<HTMLDialogElement>('[data-video-modal]');
  if (!modal) return;
  const marco = modal.querySelector<HTMLElement>('[data-video-marco]')!;
  const cerrar = () => { modal.close(); };
  modal.addEventListener('close', () => { marco.innerHTML = ''; window.__lenis?.start(); });
  modal.querySelector('[data-video-cerrar]')?.addEventListener('click', cerrar);
  modal.addEventListener('click', (e) => { if (e.target === modal) cerrar(); });
  document.querySelectorAll<HTMLElement>('[data-video]').forEach((b) => {
    b.addEventListener('click', () => {
      const iframe = document.createElement('iframe');
      iframe.src = `https://www.youtube-nocookie.com/embed/${b.dataset.video}?autoplay=1&rel=0&modestbranding=1`;
      iframe.title = b.dataset.videoTitulo ?? 'Video';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      iframe.allowFullscreen = true;
      marco.replaceChildren(iframe);
      window.__lenis?.stop();
      modal.showModal();
      track('video_abierto', { video: b.dataset.video });
    });
  });
}

/** Galería editorial con lightbox (flechas del teclado y botones). */
function lightbox() {
  const modal = document.querySelector<HTMLDialogElement>('[data-lightbox-modal]');
  const items = [...document.querySelectorAll<HTMLElement>('[data-lightbox]')];
  if (!modal || !items.length) return;
  const img = modal.querySelector<HTMLImageElement>('[data-lightbox-img]')!;
  const pie = modal.querySelector<HTMLElement>('[data-lightbox-pie]')!;
  let i = 0;
  const mostrar = (n: number) => {
    i = (n + items.length) % items.length;
    img.src = items[i].dataset.grande!;
    img.alt = items[i].dataset.alt ?? '';
    pie.textContent = `${items[i].dataset.alt ?? ''} · ${i + 1} / ${items.length}`;
    img.animate?.([{ opacity: 0, transform: 'scale(.98)' }, { opacity: 1, transform: 'none' }], { duration: 450, easing: 'cubic-bezier(.22,1,.36,1)' });
  };
  items.forEach((b, n) => b.addEventListener('click', () => { mostrar(n); window.__lenis?.stop(); modal.showModal(); }));
  modal.addEventListener('close', () => { window.__lenis?.start(); items[i].focus(); });
  modal.querySelector('[data-lightbox-cerrar]')?.addEventListener('click', () => modal.close());
  modal.querySelector('[data-lightbox-prev]')?.addEventListener('click', () => mostrar(i - 1));
  modal.querySelector('[data-lightbox-next]')?.addEventListener('click', () => mostrar(i + 1));
  modal.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') mostrar(i - 1);
    if (e.key === 'ArrowRight') mostrar(i + 1);
  });
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.close(); });
}

/** Plano interactivo: pestañas (dúplex), zoom con botones y arrastre. */
function plano() {
  const sec = document.querySelector<HTMLElement>('[data-plano]');
  if (!sec) return;
  const vista = sec.querySelector<HTMLElement>('[data-plano-vista]')!;
  const laminas = [...sec.querySelectorAll<HTMLElement>('[data-plano-lamina]')];
  const tabs = [...sec.querySelectorAll<HTMLButtonElement>('[data-plano-tab]')];
  let escala = 1, x = 0, y = 0, activa = 0;
  const img = () => laminas[activa].querySelector<HTMLImageElement>('img');
  const aplicar = () => {
    const max = (escala - 1) * 0.5;
    const ancho = vista.clientWidth, alto = vista.clientHeight;
    x = Math.max(-ancho * max, Math.min(ancho * max, x));
    y = Math.max(-alto * max, Math.min(alto * max, y));
    const el = img();
    if (el) el.style.transform = `translate(${x}px, ${y}px) scale(${escala})`;
  };
  const zoom = (d: number) => { escala = Math.max(1, Math.min(2.6, +(escala + d).toFixed(2))); if (escala === 1) { x = 0; y = 0; } aplicar(); };
  sec.querySelector('[data-plano-mas]')?.addEventListener('click', () => zoom(0.4));
  sec.querySelector('[data-plano-menos]')?.addEventListener('click', () => zoom(-0.4));
  tabs.forEach((t, i) => t.addEventListener('click', () => {
    activa = i; escala = 1; x = 0; y = 0;
    tabs.forEach((o, k) => o.setAttribute('aria-selected', String(k === i)));
    laminas.forEach((l, k) => { l.hidden = k !== i; });
    aplicar();
  }));

  let arrastre: { px: number; py: number; x: number; y: number } | null = null;
  vista.addEventListener('pointerdown', (e) => {
    if ((e.target as HTMLElement).closest('button') || escala === 1) return;
    arrastre = { px: e.clientX, py: e.clientY, x, y };
    vista.setPointerCapture(e.pointerId);
    vista.classList.add('is-arrastrando');
  });
  vista.addEventListener('pointermove', (e) => {
    if (!arrastre) return;
    x = arrastre.x + e.clientX - arrastre.px;
    y = arrastre.y + e.clientY - arrastre.py;
    aplicar();
  });
  const soltar = () => { arrastre = null; vista.classList.remove('is-arrastrando'); };
  vista.addEventListener('pointerup', soltar);
  vista.addEventListener('pointercancel', soltar);
}

/** Recorrido 360: portada que carga el iframe al hacer clic. */
function recorrido360() {
  document.querySelectorAll<HTMLElement>('[data-r360]').forEach((cont) => {
    cont.querySelector('[data-r360-cargar]')?.addEventListener('click', (e) => {
      const iframe = document.createElement('iframe');
      iframe.src = cont.dataset.r360!;
      iframe.title = 'Recorrido virtual 360';
      iframe.allow = 'fullscreen; xr-spatial-tracking; gyroscope; accelerometer';
      iframe.allowFullscreen = true;
      (e.currentTarget as HTMLElement).replaceWith(iframe);
      track('recorrido_360_abierto');
    });
  });
}
