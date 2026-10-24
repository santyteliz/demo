// Envío de leads a Zoho CRM (webhook o Zoho Flow) configurable por PUBLIC_LEADS_WEBHOOK.
// Sin endpoint configurado se simula el envío para poder mostrar el flujo completo.

export type Lead = Record<string, string>;

export async function enviarLead(lead: Lead): Promise<void> {
  const url = import.meta.env.PUBLIC_LEADS_WEBHOOK as string | undefined;
  const cuerpo = { ...lead, origen: 'web-praderas', enviado: new Date().toISOString() };
  if (!url) {
    console.info('[leads] PUBLIC_LEADS_WEBHOOK no está configurado. Lead simulado:', cuerpo);
    await new Promise((r) => setTimeout(r, 900));
    return;
  }
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cuerpo),
  });
  if (!res.ok) throw new Error(`Webhook respondió ${res.status}`);
}

const UTM = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const;

/** Guarda los UTM de la URL de entrada para toda la sesión. */
export function utms(): Record<string, string> {
  const guardados: Record<string, string> = JSON.parse(sessionStorage.getItem('pda-utm') ?? '{}');
  const params = new URLSearchParams(location.search);
  let cambio = false;
  UTM.forEach((k) => { const v = params.get(k); if (v) { guardados[k] = v; cambio = true; } });
  if (cambio) sessionStorage.setItem('pda-utm', JSON.stringify(guardados));
  return guardados;
}
