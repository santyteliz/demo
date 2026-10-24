// Comparador: al pasar el mouse por una celda se ilumina la columna del modelo
// (la fila la resalta CSS). En celular se comparan 2 modelos a la vez.
export function initComparador() {
  const raiz = document.querySelector<HTMLElement>('[data-comp]');
  if (!raiz) return;
  const tabla = raiz.querySelector<HTMLTableElement>('[data-comp-tabla]')!;
  const celdas = [...tabla.querySelectorAll<HTMLElement>('[data-col]')];

  const iluminar = (col: string | null) => celdas.forEach((c) => c.classList.toggle('is-col', c.dataset.col === col));
  tabla.addEventListener('mouseover', (e) => {
    const c = (e.target as HTMLElement).closest<HTMLElement>('[data-col]');
    iluminar(c?.dataset.col ?? null);
  });
  tabla.addEventListener('mouseleave', () => iluminar(null));
  tabla.addEventListener('focusin', (e) => {
    const c = (e.target as HTMLElement).closest<HTMLElement>('[data-col]');
    if (c) iluminar(c.dataset.col!);
  });

  const selects = [...raiz.querySelectorAll<HTMLSelectElement>('[data-comp-sel]')];
  const aplicar = () => {
    const visibles = selects.map((s) => s.value);
    celdas.forEach((c) => c.classList.toggle('is-oculta', !visibles.includes(c.dataset.col!)));
  };
  selects.forEach((s, i) => s.addEventListener('change', () => {
    const otro = selects[1 - i];
    if (otro.value === s.value) {
      // Si eligen el mismo modelo en los dos, el otro pasa al siguiente disponible.
      const opciones = [...otro.options].map((o) => o.value).filter((v) => v !== s.value);
      otro.value = opciones[0];
    }
    aplicar();
  }));
  aplicar();

  // "Agendar visita para este modelo" preselecciona el modelo en el formulario.
  raiz.querySelectorAll<HTMLElement>('[data-agenda-modelo]').forEach((a) => {
    a.addEventListener('click', () => document.dispatchEvent(new CustomEvent('pda:modelo', { detail: a.dataset.agendaModelo })));
  });
}
