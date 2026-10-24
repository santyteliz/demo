import sitio from '../data/sitio.json';

/** Link de WhatsApp con mensaje prearmado. Sin número configurado, WhatsApp deja elegir el contacto. */
export function whatsappUrl(mensaje: string): string {
  const numero = sitio.contacto.whatsapp.replace(/\D/g, '');
  const texto = encodeURIComponent(mensaje);
  return numero ? `https://wa.me/${numero}?text=${texto}` : `https://api.whatsapp.com/send?text=${texto}`;
}

export function mensajeWhatsapp(modelo?: string): string {
  return modelo
    ? `Hola, me interesa el modelo ${modelo} de Praderas de Arraiján. ¿Me pueden dar más información?`
    : 'Hola, me interesa Praderas de Arraiján. ¿Me pueden dar más información?';
}

export const moneda = (n: number) => '$' + Math.round(n).toLocaleString('en-US');
