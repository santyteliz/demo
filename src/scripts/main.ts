import type Lenis from 'lenis';
import { initHeader } from './header';
import { initUI } from './ui';
import { initCalculadoras } from './calculadora';
import { initComparador } from './comparador';
import { initAgenda } from './agenda';
import { initAnalytics } from './analytics';

declare global {
  interface Window { __pda?: boolean; __lenis?: Lenis; gtag?: (...args: unknown[]) => void; dataLayer?: unknown[]; }
}

window.__pda = true;

const despues = (fn: () => void, timeout = 1500) =>
  'requestIdleCallback' in window ? requestIdleCallback(fn, { timeout }) : setTimeout(fn, 200);

// Lo que se ve o se toca primero: header, menú y clics medidos.
initAnalytics();
initHeader();

// Secciones de más abajo (calculadora, comparador, agenda, galerías): en el primer momento libre.
despues(() => {
  initUI();
  initCalculadoras();
  initComparador();
  initAgenda();
  // Animaciones de scroll y Lenis: no hacen falta para el primer pintado (el hero entra en CSS),
  // así que se descargan y arman después, cuando el navegador vuelve a quedar libre.
  despues(() => import('./movimiento').then((m) => m.initMovimiento()));
}, 800);
