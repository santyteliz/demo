import { utms } from './leads';
import { adaptadorAgenda } from './agenda-adaptador';
import { track } from './analytics';
import type { Calculo } from './calculadora';

const DN = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const DL = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MN = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const moneda = (n: number) => '$' + Math.round(n).toLocaleString('en-US');

const reglas: Record<string, (el: HTMLInputElement) => string> = {
  nombre: (el) => (el.value.trim().length >= 3 ? '' : 'Escribe tu nombre y apellido.'),
  telefono: (el) => (/^[2-9]\d{6,7}$/.test(el.value.replace(/\D/g, '')) ? '' : 'Escribe un número de Panamá de 7 u 8 dígitos.'),
  correo: (el) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(el.value.trim()) ? '' : 'Revisa tu correo, parece incompleto.'),
  privacidad: (el) => (el.checked ? '' : 'Necesitamos tu permiso para contactarte.'),
};

export function initAgenda() {
  document.querySelectorAll<HTMLFormElement>('[data-lead-form]').forEach(initFormulario);
}

function initFormulario(form: HTMLFormElement) {
  const oculto = (k: string) => form.querySelector<HTMLInputElement>(`[data-hidden="${k}"]`)!;
  const cuerpo = form.querySelector<HTMLElement>('[data-form-cuerpo]')!;
  const exito = form.querySelector<HTMLElement>('[data-form-exito]')!;
  const error = form.querySelector<HTMLElement>('[data-form-error]')!;
  const enviar = form.querySelector<HTMLButtonElement>('button[type="submit"]')!;
  const enviarTxt = form.querySelector<HTMLElement>('[data-enviar-txt]')!;
  const selModelo = form.querySelector<HTMLSelectElement>('[data-form-modelo]')!;
  const notaCalc = form.querySelector<HTMLElement>('[data-form-calculo]')!;

  // ---- Calendario: próximos N días sin los excluidos (domingo) ----
  const contDias = form.querySelector<HTMLElement>('[data-agenda-dias]')!;
  const n = Number(contDias.dataset.dias || 14);
  const excluir: number[] = JSON.parse(contDias.dataset.excluir || '[0]');
  const hoy = new Date();
  const dias: Date[] = [];
  for (let k = 1; k <= n; k++) {
    const d = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + k);
    if (!excluir.includes(d.getDay())) dias.push(d);
  }
  let dia = dias[0];
  contDias.replaceChildren(...dias.map((d, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'dia';
    b.setAttribute('aria-pressed', String(i === 0));
    // Nombre accesible = texto visible (abreviado) + día completo oculto para lectores de pantalla
    b.innerHTML = `<small>${DN[d.getDay()]}</small><b>${d.getDate()}</b><small>${MN[d.getMonth()]}</small><span class="sr-only">, ${DL[d.getDay()]}</span>`;
    b.addEventListener('click', () => {
      dia = d;
      contDias.querySelectorAll('.dia').forEach((o) => o.setAttribute('aria-pressed', String(o === b)));
      actualizarBoton();
    });
    // Estilos con alcance del componente Agenda
    const scope = [...contDias.attributes].find((a) => a.name.startsWith('data-astro-cid'));
    if (scope) b.setAttribute(scope.name, '');
    return b;
  }));

  const horas = [...form.querySelectorAll<HTMLButtonElement>('[data-agenda-hora]')];
  let hora = horas.find((h) => h.getAttribute('aria-pressed') === 'true')?.dataset.agendaHora ?? horas[0]?.dataset.agendaHora ?? '';
  horas.forEach((h) => h.addEventListener('click', () => {
    hora = h.dataset.agendaHora!;
    horas.forEach((o) => o.setAttribute('aria-pressed', String(o === h)));
    actualizarBoton();
  }));

  const fechaISO = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const actualizarBoton = () => {
    enviarTxt.textContent = dia ? `Confirmar visita · ${DL[dia.getDay()]} ${dia.getDate()}, ${hora}` : 'Confirmar visita';
  };
  actualizarBoton();

  // ---- Datos que llegan desde la calculadora o el comparador ----
  document.addEventListener('pda:calculo', (e) => {
    const c = (e as CustomEvent<Calculo>).detail;
    oculto('calculo').value = JSON.stringify({ ...c, cuota: Math.round(c.cuota) });
    const opcion = [...selModelo.options].find((o) => o.value === c.modelo);
    if (opcion) selModelo.value = opcion.value;
    selModelo.closest('form')?.querySelector<HTMLSelectElement>('[name="motivo"]')?.querySelectorAll('option').forEach((o) => {
      if (o.value.startsWith('Asesoría')) o.selected = true;
    });
    notaCalc.hidden = false;
    notaCalc.textContent = `Tu cálculo: ${c.modelo}, abono ${moneda(c.abono)}, ${c.plazo} años, cuota estimada ${moneda(c.cuota)}/mes.`;
  });
  document.addEventListener('pda:modelo', (e) => {
    const slug = (e as CustomEvent<string>).detail;
    const nombre = slug.replace('-duplex', ' Dúplex').replace(/^\w/, (l) => l.toUpperCase());
    const opcion = [...selModelo.options].find((o) => o.value.toLowerCase() === nombre.toLowerCase());
    if (opcion) selModelo.value = opcion.value;
  });

  // ---- Validación en vivo ----
  const campos = [...form.querySelectorAll<HTMLInputElement>('[data-validar]')];
  const validar = (el: HTMLInputElement, mostrar = true) => {
    const msg = reglas[el.dataset.validar!]?.(el) ?? '';
    const caja = el.closest('.field');
    const salida = el.closest('.field, .agenda__check')?.parentElement?.querySelector<HTMLElement>('.field-msg');
    if (mostrar) {
      caja?.setAttribute('data-state', msg ? 'error' : 'ok');
      if (salida) salida.textContent = msg;
      el.setAttribute('aria-invalid', String(!!msg));
    }
    return !msg;
  };
  campos.forEach((el) => {
    el.addEventListener('blur', () => { if (el.value || el.type === 'checkbox') validar(el); });
    el.addEventListener('input', () => { if (el.closest('[data-state]')) validar(el); });
    el.addEventListener('change', () => { if (el.type === 'checkbox') validar(el); });
  });

  // ---- Envío ----
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const malos = campos.filter((el) => !validar(el));
    if (malos.length) { malos[0].focus(); return; }

    oculto('fecha').value = fechaISO(dia);
    oculto('hora').value = hora;
    oculto('pagina').value = location.pathname;
    Object.entries(utms()).forEach(([k, v]) => { const i = form.querySelector<HTMLInputElement>(`[data-hidden="${k}"]`); if (i) i.value = v; });

    const datos = Object.fromEntries([...new FormData(form).entries()].map(([k, v]) => [k, String(v)]));
    datos.telefono = `+507 ${datos.telefono}`;
    enviar.disabled = true;
    error.hidden = true;
    enviarTxt.textContent = 'Enviando…';
    try {
      await adaptadorAgenda().reservar(
        { fecha: datos.fecha_visita, hora: datos.hora_visita, nombre: datos.nombre, correo: datos.correo, telefono: datos.telefono, modelo: datos.modelo },
        datos,
      );
      track('formulario_enviado', { modelo: datos.modelo, motivo: datos.motivo });
      const txt = exito.querySelector<HTMLElement>('[data-exito-txt]');
      if (txt) txt.textContent = `Te esperamos el ${DL[dia.getDay()]} ${dia.getDate()} de ${MN[dia.getMonth()]} a las ${hora.replace(/\.$/, '')}. Un asesor te va a escribir para confirmar.`;
      cuerpo.setAttribute('aria-hidden', 'true');
      exito.hidden = false;
      exito.focus();
    } catch (err) {
      console.error(err);
      error.hidden = false;
      actualizarBoton();
    } finally {
      enviar.disabled = false;
    }
  });
}
