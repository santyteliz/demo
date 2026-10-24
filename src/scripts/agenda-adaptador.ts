// Adaptador de agenda. Hoy la visita viaja por el mismo flujo del formulario (lead a Zoho CRM).
// Para conectar Zoho Bookings o Calendly: PUBLIC_BOOKING_PROVIDER y PUBLIC_BOOKING_URL.
import { enviarLead, type Lead } from './leads';

export interface Reserva { fecha: string; hora: string; nombre: string; correo: string; telefono: string; modelo: string; }

interface Proveedor { reservar(reserva: Reserva, lead: Lead): Promise<void>; }

/** Abre el servicio externo con los datos precargados (ambos aceptan parámetros en la URL). */
function externo(params: (r: Reserva) => Record<string, string>): Proveedor {
  return {
    async reservar(r, lead) {
      await enviarLead(lead); // el lead siempre llega al CRM
      const base = import.meta.env.PUBLIC_BOOKING_URL as string | undefined;
      if (!base) return;
      const url = new URL(base);
      Object.entries(params(r)).forEach(([k, v]) => url.searchParams.set(k, v));
      window.open(url.toString(), '_blank', 'noopener');
    },
  };
}

const proveedores: Record<string, Proveedor> = {
  form: { reservar: (_r, lead) => enviarLead(lead) },
  'zoho-bookings': externo((r) => ({ name: r.nombre, email: r.correo, phone: `+507${r.telefono}` })),
  calendly: externo((r) => ({ name: r.nombre, email: r.correo, a1: `+507${r.telefono}`, a2: r.modelo })),
};

export function adaptadorAgenda(): Proveedor {
  const id = (import.meta.env.PUBLIC_BOOKING_PROVIDER as string | undefined) || 'form';
  return proveedores[id] ?? proveedores.form;
}
