import { gsap } from 'gsap';

// Botones magnéticos + relleno que crece desde el punto del mouse,
// y cursor personalizado ("Ver" / "Arrastrar") solo sobre galerías. Solo desktop.
export function initPuntero(reduce: boolean) {
  const finoHover = matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!finoHover) return;

  document.querySelectorAll<HTMLElement>('.btn').forEach((btn) => {
    btn.addEventListener('pointerenter', (e) => {
      const r = btn.getBoundingClientRect();
      btn.style.setProperty('--x', `${e.clientX - r.left}px`);
      btn.style.setProperty('--y', `${e.clientY - r.top}px`);
      btn.style.setProperty('--fill-scale', String(Math.ceil((Math.hypot(r.width, r.height) * 2) / 10)));
    });
  });

  if (reduce) return;

  document.querySelectorAll<HTMLElement>('[data-magnetic]').forEach((el) => {
    const x = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3.out' });
    const y = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3.out' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      x((e.clientX - (r.left + r.width / 2)) * 0.22);
      y((e.clientY - (r.top + r.height / 2)) * 0.3);
    });
    el.addEventListener('pointerleave', () => { x(0); y(0); });
  });

  const zonas = document.querySelectorAll<HTMLElement>('[data-cursor]');
  if (!zonas.length) return;
  const cursor = document.createElement('div');
  cursor.className = 'cursor';
  cursor.setAttribute('aria-hidden', 'true');
  document.body.append(cursor);
  const cx = gsap.quickTo(cursor, 'x', { duration: 0.45, ease: 'power3.out' });
  const cy = gsap.quickTo(cursor, 'y', { duration: 0.45, ease: 'power3.out' });
  addEventListener('pointermove', (e) => { cx(e.clientX); cy(e.clientY); }, { passive: true });
  zonas.forEach((z) => {
    z.addEventListener('pointerenter', () => {
      cursor.textContent = z.dataset.cursor ?? 'Ver';
      cursor.classList.add('is-visible');
      document.documentElement.classList.add('cursor-on');
    });
    z.addEventListener('pointerleave', () => {
      cursor.classList.remove('is-visible');
      document.documentElement.classList.remove('cursor-on');
    });
  });
}
