import { track } from './analytics';

/** Tween mínimo con requestAnimationFrame (evita cargar GSAP antes de tiempo). */
function contar(desde: number, hasta: number, alPintar: (v: number) => void, dur = 900) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { alPintar(hasta); return () => {}; }
  const t0 = performance.now();
  let id = 0;
  const paso = (t: number) => {
    const p = Math.min(1, (t - t0) / dur);
    const e = 1 - Math.pow(1 - p, 3); // power3.out
    alPintar(desde + (hasta - desde) * e);
    if (p < 1) id = requestAnimationFrame(paso);
  };
  id = requestAnimationFrame(paso);
  return () => cancelAnimationFrame(id);
}

interface Config {
  modelos: { slug: string; nombre: string; precio: number }[];
  tasa: number; plazo: number; abono: number; min: number; max: number;
}

export interface Calculo {
  modelo: string; precio: number; abono: number; abonoPct: number; financiar: number; plazo: number; tasa: number; cuota: number;
}

const moneda = (n: number) => '$' + Math.round(n).toLocaleString('en-US');
const numero = (s: string) => parseFloat(s.replace(/[^\d.]/g, ''));

/** Amortización francesa: cuota = P · i / (1 − (1 + i)^−n) */
export function cuotaMensual(P: number, tasaAnual: number, anios: number) {
  const i = tasaAnual / 100 / 12;
  const n = anios * 12;
  if (n <= 0) return 0;
  return i > 0 ? (P * i) / (1 - Math.pow(1 + i, -n)) : P / n;
}

export function initCalculadoras() {
  document.querySelectorAll<HTMLElement>('[data-calc]').forEach(initCalculadora);
}

function initCalculadora(raiz: HTMLElement) {
  const cfg: Config = JSON.parse(raiz.dataset.config!);
  const q = <T extends HTMLElement>(s: string) => raiz.querySelector<T>(s)!;
  const chipsModelo = [...raiz.querySelectorAll<HTMLButtonElement>('[data-calc-mod]')];
  const chipsPlazo = [...raiz.querySelectorAll<HTMLButtonElement>('[data-calc-plazo]')];
  const rango = q<HTMLInputElement>('[data-calc-rango]');
  const monto = q<HTMLInputElement>('[data-calc-monto]');
  const pct = q<HTMLInputElement>('[data-calc-pct]');
  const tasaIn = raiz.querySelector<HTMLInputElement>('[data-calc-tasa]');
  const out = {
    cuota: q('[data-calc-cuota]'), precio: q('[data-calc-precio]'), abono: q('[data-calc-abono]'),
    financiar: q('[data-calc-financiar]'), nombre: q('[data-calc-nombre]'), anios: q('[data-calc-anios]'),
  };

  const inicial = chipsModelo.find((c) => c.getAttribute('aria-pressed') === 'true')?.dataset.calcMod ?? cfg.modelos[0].slug;
  const st = { modelo: inicial, abonoPct: cfg.abono, plazo: cfg.plazo, tasa: cfg.tasa };
  const mostrado = { cuota: 0 };
  let primera = true;
  let aviso: number | undefined;
  let cancelar = () => {};

  const modeloActual = () => cfg.modelos.find((m) => m.slug === st.modelo) ?? cfg.modelos[0];

  const calcular = (): Calculo => {
    const m = modeloActual();
    const abono = (m.precio * st.abonoPct) / 100;
    const financiar = m.precio - abono;
    return { modelo: m.nombre, precio: m.precio, abono, abonoPct: st.abonoPct, financiar, plazo: st.plazo, tasa: st.tasa, cuota: cuotaMensual(financiar, st.tasa, st.plazo) };
  };

  const pintar = (desde?: 'monto' | 'pct') => {
    const c = calcular();
    out.precio.textContent = moneda(c.precio);
    out.abono.textContent = moneda(c.abono);
    out.financiar.textContent = moneda(c.financiar);
    out.nombre.textContent = c.modelo;
    out.anios.textContent = String(c.plazo);
    rango.value = String(Math.round(st.abonoPct));
    if (desde !== 'monto') monto.value = Math.round(c.abono).toLocaleString('en-US');
    if (desde !== 'pct') pct.value = String(+st.abonoPct.toFixed(1));
    chipsModelo.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.calcMod === st.modelo)));
    chipsPlazo.forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.calcPlazo) === st.plazo)));

    // El número cuenta hasta el nuevo valor.
    if (primera) {
      mostrado.cuota = c.cuota;
      primera = false;
    } else {
      cancelar();
      cancelar = contar(mostrado.cuota, c.cuota, (v) => { mostrado.cuota = v; out.cuota.textContent = moneda(v); });
      clearTimeout(aviso);
      aviso = window.setTimeout(() => track('calculo_hecho', { modelo: c.modelo, plazo: c.plazo, abono_pct: c.abonoPct, cuota: Math.round(c.cuota) }), 1500);
    }
    out.cuota.textContent = moneda(primera ? c.cuota : mostrado.cuota);
  };

  const limitarPct = (v: number) => Math.max(cfg.min, Math.min(cfg.max, isNaN(v) ? cfg.abono : v));

  chipsModelo.forEach((b) => b.addEventListener('click', () => { st.modelo = b.dataset.calcMod!; pintar(); }));
  chipsPlazo.forEach((b) => b.addEventListener('click', () => { st.plazo = Number(b.dataset.calcPlazo); pintar(); }));
  rango.addEventListener('input', () => { st.abonoPct = Number(rango.value); pintar(); });
  pct.addEventListener('input', () => { const v = numero(pct.value); if (!isNaN(v)) { st.abonoPct = limitarPct(v); pintar('pct'); } });
  pct.addEventListener('blur', () => pintar());
  monto.addEventListener('input', () => {
    const v = numero(monto.value);
    if (!isNaN(v)) { st.abonoPct = limitarPct((v / modeloActual().precio) * 100); pintar('monto'); }
  });
  monto.addEventListener('blur', () => pintar());
  tasaIn?.addEventListener('input', () => { const v = numero(tasaIn.value); if (!isNaN(v) && v > 0 && v < 30) { st.tasa = v; pintar(); } });
  raiz.querySelector('form')?.addEventListener('submit', (e) => e.preventDefault());

  // "Quiero que me asesoren": pasa el cálculo al formulario de agenda.
  raiz.querySelector('[data-calc-asesoria]')?.addEventListener('click', () => {
    document.dispatchEvent(new CustomEvent<Calculo>('pda:calculo', { detail: calcular() }));
  });

  // Botones "Calcular cuota" de otras secciones preseleccionan el modelo.
  document.querySelectorAll<HTMLElement>('[data-calc-modelo]').forEach((a) => {
    a.addEventListener('click', () => { st.modelo = a.dataset.calcModelo!; pintar(); });
  });

  pintar();
}
