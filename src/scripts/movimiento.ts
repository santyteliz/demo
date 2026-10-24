// Todo lo que depende de GSAP y Lenis. Se carga aparte, cuando el navegador queda libre,
// para que el primer pintado en celulares no espere a estas librerías.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { initAnimaciones } from './animaciones';
import { initPuntero } from './puntero';

export function initMovimiento() {
  gsap.registerPlugin(ScrollTrigger);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Scroll suave con Lenis, sincronizado con ScrollTrigger (sin Lenis si hay movimiento reducido).
  let lenis: Lenis | undefined;
  if (!reduce) {
    lenis = new Lenis({ duration: 1.1, anchors: { offset: -96 }, autoRaf: false });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis!.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    window.__lenis = lenis;
  }

  initPuntero(reduce);
  initAnimaciones(lenis);
  // Las fuentes cambian alturas: recalcular posiciones cuando cargan.
  document.fonts?.ready.then(() => ScrollTrigger.refresh());

  // En celular las secciones usan content-visibility: al renderizarse cambian de alto real.
  let t: number | undefined;
  document.addEventListener('contentvisibilityautostatechange', () => {
    clearTimeout(t);
    t = window.setTimeout(() => ScrollTrigger.refresh(), 250);
  }, true);
}
