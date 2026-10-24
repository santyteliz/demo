// Cápsula flotante: transparente sobre el hero, se compacta y aclara al bajar,
// se esconde al bajar y reaparece al subir. Barra de progreso de lectura.
// Lenis mueve el scroll nativo, así que el evento "scroll" de window sirve con o sin Lenis.
export function initHeader() {
  const header = document.querySelector<HTMLElement>('[data-header]');
  if (!header) return;
  const transparente = header.dataset.transparente === 'true';
  const progreso = header.querySelector<HTMLElement>('[data-progreso]');
  const hero = document.querySelector<HTMLElement>('[data-hero]');
  const megaBtn = header.querySelector<HTMLButtonElement>('[data-mega-btn]');
  const mega = header.querySelector<HTMLElement>('[data-mega]');
  const menuBtn = header.querySelector<HTMLButtonElement>('[data-menu-btn]');
  const menu = document.querySelector<HTMLElement>('[data-menu]');
  const barra = document.querySelector<HTMLElement>('[data-barra]');

  let ultimoY = window.scrollY;
  let megaAbierto = false;
  let menuAbierto = false;

  const alScroll = () => {
    const y = window.scrollY;
    const limiteHero = hero ? hero.offsetHeight - 120 : 0;
    header.classList.toggle('is-compacto', y > 80);
    if (transparente) {
      const sobreHero = y < limiteHero && !megaAbierto;
      header.classList.toggle('is-top', sobreHero);
      header.classList.toggle('is-claro', !sobreHero);
    }
    const bajando = y > ultimoY;
    if (!megaAbierto && !menuAbierto) header.classList.toggle('is-hidden', bajando && y > 320);
    ultimoY = y;
    if (progreso) {
      const max = document.documentElement.scrollHeight - innerHeight;
      progreso.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
    }
  };
  addEventListener('scroll', alScroll, { passive: true });
  requestAnimationFrame(alScroll); // después del primer layout, sin forzarlo

  // Barra fija de celular: se oculta mientras el formulario de agenda está en pantalla.
  const agenda = document.getElementById('agenda');
  if (barra && agenda && 'IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => barra.classList.toggle('is-hidden', e.isIntersecting), { threshold: 0.15 }).observe(agenda);
  }

  // ---- Megamenú de modelos ----
  let cierre: number | undefined;
  const abrirMega = (abrir: boolean) => {
    if (!mega || !megaBtn) return;
    megaAbierto = abrir;
    mega.hidden = !abrir;
    megaBtn.setAttribute('aria-expanded', String(abrir));
    if (transparente && abrir) { header.classList.remove('is-top'); header.classList.add('is-claro'); }
    if (!abrir) alScroll();
  };
  megaBtn?.addEventListener('click', () => abrirMega(!megaAbierto));
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    [megaBtn, mega].forEach((el) => {
      el?.addEventListener('mouseenter', () => { clearTimeout(cierre); abrirMega(true); });
      el?.addEventListener('mouseleave', () => { cierre = window.setTimeout(() => abrirMega(false), 220); });
    });
  }
  document.addEventListener('click', (e) => {
    if (megaAbierto && !header.contains(e.target as Node)) abrirMega(false);
  });

  // ---- Menú de celular a pantalla completa ----
  const abrirMenu = (abrir: boolean) => {
    if (!menu || !menuBtn) return;
    menuAbierto = abrir;
    menuBtn.setAttribute('aria-expanded', String(abrir));
    if (abrir) {
      menu.hidden = false;
      requestAnimationFrame(() => requestAnimationFrame(() => menu.classList.add('is-open')));
      window.__lenis?.stop();
      document.documentElement.style.overflow = 'hidden';
      menu.querySelector<HTMLElement>('[data-menu-cerrar]')?.focus();
    } else {
      menu.classList.remove('is-open');
      window.__lenis?.start();
      document.documentElement.style.overflow = '';
      window.setTimeout(() => { if (!menuAbierto) menu.hidden = true; }, 700);
      menuBtn.focus();
    }
  };
  menuBtn?.addEventListener('click', () => abrirMenu(true));
  menu?.querySelector('[data-menu-cerrar]')?.addEventListener('click', () => abrirMenu(false));
  menu?.querySelectorAll('[data-menu-link]').forEach((a) => a.addEventListener('click', () => abrirMenu(false)));
  menu?.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const foco = [...menu.querySelectorAll<HTMLElement>('a, button')];
    const primero = foco[0], ultimo = foco[foco.length - 1];
    if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo.focus(); }
    else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (menuAbierto) abrirMenu(false);
    if (megaAbierto) { abrirMega(false); megaBtn?.focus(); }
  });
}
