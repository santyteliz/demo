import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import type Lenis from 'lenis';
import { modelosControl } from './modelos';

gsap.registerPlugin(ScrollTrigger, SplitText);

const EASE = 'power3.out';
const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => [...r.querySelectorAll<T>(s)];

export function initAnimaciones(lenis?: Lenis) {
  const mm = gsap.matchMedia();

  mm.add(
    { desktop: '(min-width: 1024px)', reduce: '(prefers-reduced-motion: reduce)' },
    (ctx) => {
      const { desktop, reduce } = ctx.conditions as { desktop: boolean; reduce: boolean };

      // ---------- Movimiento reducido: sin pin, sin parallax, solo fades ----------
      if (reduce) {
        gsap.set('[data-reveal]', { clipPath: 'none' });
        gsap.fromTo('[data-fade]', { opacity: 0 }, { opacity: 1, duration: 0.6, stagger: 0.04 });
        $$('[data-proceso-trazo]').forEach((t) => gsap.set(t, { strokeDashoffset: 0 }));
        $$('[data-proceso-paso]').forEach((p) => p.classList.add('is-hecho'));
        return;
      }

      titulos();
      revelarImagenes();
      fades();
      contadores();
      manifiesto();
      proceso();

      if (desktop) {
        parallax();
        const limpiar = [modelosPin(lenis), amenidadesHorizontal()];
        return () => limpiar.forEach((f) => f?.());
      }
    },
  );
}

/** Corre `fn` una vez cuando el elemento se acerca a la pantalla (reparte el trabajo de SplitText). */
function cuandoCerca(el: Element, fn: () => void, margen = '0px 0px 35% 0px') {
  const io = new IntersectionObserver((entradas) => {
    if (entradas.some((e) => e.isIntersecting)) { io.disconnect(); fn(); }
  }, { rootMargin: margen });
  io.observe(el);
}

/** Títulos de sección: líneas que suben desde una máscara al entrar en pantalla.
 *  El corte en líneas se hace justo antes de que el título llegue a la pantalla, no todo al cargar. */
function titulos() {
  $$('[data-split]').forEach((el) => cuandoCerca(el, () => {
    SplitText.create(el, {
      type: 'lines', mask: 'lines', autoSplit: true,
      onSplit: (self) => gsap.from(self.lines, {
        yPercent: 110, duration: 1.1, ease: EASE, stagger: 0.08,
        scrollTrigger: { trigger: el, start: 'top 86%', once: true },
      }),
    });
  }));
}

/** Imágenes: clip-path de inset(100% 0 0 0) a inset(0) con leve zoom-out. */
function revelarImagenes() {
  $$('[data-reveal]').forEach((el) => {
    const img = el.querySelector('img');
    const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
    tl.fromTo(el, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, ease: 'power3.inOut' });
    if (img) tl.fromTo(img, { scale: 1.15 }, { scale: 1, duration: 1.4, ease: EASE }, 0);
  });
}

function fades() {
  $$('[data-fade]').forEach((el, i) => {
    gsap.fromTo(el, { opacity: 0, y: 32 }, {
      opacity: 1, y: 0, duration: 1, ease: EASE, delay: (i % 4) * 0.08,
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
    });
  });
}

/** Contadores numéricos al entrar en pantalla. */
function contadores() {
  $$('[data-count]').forEach((el) => {
    const fin = Number(el.dataset.count);
    const prefijo = el.dataset.prefijo ?? '';
    const obj = { v: 0 };
    el.textContent = prefijo + '0';
    gsap.to(obj, {
      v: fin, duration: fin > 10 ? 1.6 : 1, ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      onUpdate: () => { el.textContent = prefijo + Math.round(obj.v); },
    });
  });
}

/** Manifiesto: las palabras se iluminan de gris a tinta con el scroll (solo opacidad). */
function manifiesto() {
  const p = document.querySelector<HTMLElement>('[data-iluminar]');
  if (!p) return;
  cuandoCerca(p, () => SplitText.create(p, {
    type: 'words', autoSplit: true,
    onSplit: (self) => gsap.fromTo(self.words, { opacity: 0.16 }, {
      opacity: 1, ease: 'none', stagger: 0.05,
      scrollTrigger: { trigger: p, start: 'top 78%', end: 'bottom 45%', scrub: 0.6 },
    }),
  }), '0px 0px 60% 0px');
}

/** Línea de tiempo del proceso: el trazo SVG se dibuja con el scroll. */
function proceso() {
  const sec = document.querySelector<HTMLElement>('[data-proceso]');
  if (!sec) return;
  const pasos = $$('[data-proceso-paso]', sec);
  const trazos = $$<SVGElement>('[data-proceso-trazo]', sec);
  gsap.fromTo(trazos, { strokeDashoffset: 1 }, {
    strokeDashoffset: 0, ease: 'none',
    scrollTrigger: {
      trigger: sec, start: 'top 65%', end: 'bottom 70%', scrub: 0.6,
      onUpdate: (st) => pasos.forEach((p, i) => p.classList.toggle('is-hecho', st.progress >= i / (pasos.length - 1) - 0.02)),
    },
  });
}

/** Parallax sutil (10-15 %) en fotos y hojas decorativas. */
function parallax() {
  $$('[data-parallax]').forEach((el) => {
    const v = Number(el.dataset.parallax) || 0.1;
    gsap.fromTo(el, { yPercent: -v * 100 }, {
      yPercent: v * 100, ease: 'none',
      scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });
  $$('[data-parallax-img]').forEach((el) => {
    const img = el.tagName === 'IMG' ? el : el.querySelector('img');
    if (!img) return;
    gsap.fromTo(img, { yPercent: -6, scale: 1.14 }, {
      yPercent: 6, scale: 1.14, ease: 'none',
      scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });
}

/** Modelos: sección pinneada, el scroll pasa de un modelo al siguiente. */
function modelosPin(lenis?: Lenis) {
  const c = modelosControl();
  if (!c) return;
  const barras = $$('[data-mod-barra]', c.seccion);
  const st = ScrollTrigger.create({
    trigger: c.seccion,
    start: 'top top',
    end: () => `+=${innerHeight * (c.total - 1) * 0.9}`,
    pin: true,
    anticipatePin: 1,
    onUpdate: (self) => {
      const p = self.progress * c.total;
      c.activar(Math.min(c.total - 1, Math.floor(p * 0.9999)));
      barras.forEach((b, i) => gsap.set(b, { scaleX: Math.max(0, Math.min(1, p - i)) }));
    },
  });
  c.alElegir = (i) => {
    const destino = st.start + ((i + 0.5) / c.total) * (st.end - st.start);
    if (lenis) lenis.scrollTo(destino, { duration: 1.2 });
    else window.scrollTo({ top: destino, behavior: 'smooth' });
  };
  return () => { c.alElegir = undefined; };
}

/** Amenidades: scroll horizontal pinneado con parallax interno en las fotos. */
function amenidadesHorizontal() {
  const viewport = document.querySelector<HTMLElement>('[data-amen-viewport]');
  const track = document.querySelector<HTMLElement>('[data-amen-track]');
  if (!viewport || !track) return;
  viewport.classList.add('is-pin');
  viewport.style.overflow = 'hidden';
  const distancia = () => Math.max(0, track.scrollWidth - viewport.clientWidth);
  const tween = gsap.to(track, {
    x: () => -distancia(), ease: 'none',
    scrollTrigger: {
      trigger: viewport.closest('section'), start: 'top top', end: () => `+=${distancia()}`,
      pin: true, pinSpacing: true, scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1,
    },
  });
  $$('[data-amen-par]', track).forEach((f) => {
    gsap.fromTo(f, { xPercent: -6 }, {
      xPercent: 6, ease: 'none',
      scrollTrigger: { trigger: f.parentElement, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true },
    });
  });
  return () => { viewport.style.overflow = ''; viewport.classList.remove('is-pin'); };
}
