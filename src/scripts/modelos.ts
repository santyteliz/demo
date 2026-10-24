// Sección "Modelos" de la home: pestañas accesibles + panel activo.
// En desktop la sección se pinnea y el scroll cambia de modelo (ver animaciones.ts).
export interface ControlModelos {
  seccion: HTMLElement;
  total: number;
  activar: (i: number) => void;
  alElegir?: (i: number) => void; // lo define animaciones.ts cuando hay pin
}

let control: ControlModelos | null = null;
export const modelosControl = () => control;

export function initModelos() {
  const seccion = document.querySelector<HTMLElement>('[data-modelos]');
  if (!seccion) return;
  const tabs = [...seccion.querySelectorAll<HTMLButtonElement>('[data-mod-tab]')];
  const paneles = [...seccion.querySelectorAll<HTMLElement>('[data-mod-panel]')];
  let actual = 0;

  const activar = (i: number) => {
    if (i === actual) return;
    actual = i;
    tabs.forEach((t, k) => { t.setAttribute('aria-selected', String(k === i)); t.tabIndex = k === i ? 0 : -1; });
    paneles.forEach((p, k) => p.classList.toggle('is-activo', k === i));
  };

  control = { seccion, total: paneles.length, activar };

  tabs.forEach((t, i) => {
    t.addEventListener('click', () => (control?.alElegir ? control.alElegir(i) : activar(i)));
    t.addEventListener('keydown', (e) => {
      const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!dir) return;
      e.preventDefault();
      const n = (i + dir + tabs.length) % tabs.length;
      tabs[n].focus();
      tabs[n].click();
    });
  });
}
