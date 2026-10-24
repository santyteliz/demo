# Praderas de Arraiján · sitio web

Sitio de Praderas de Arraiján (Grupo Legacy Inmobiliaria, Panamá Oeste).
Astro 7 + CSS propio con custom properties, GSAP (ScrollTrigger + SplitText) y Lenis. Sin Tailwind ni librerías de componentes.

## Cómo correrlo

Requiere Node 20 o superior.

```bash
npm install
npm run dev       # desarrollo en http://localhost:4321
npm run build     # genera dist/ (sitio estático)
npm run preview   # sirve dist/ para revisar el build
```

## Deploy en Vercel

1. Importá el repositorio en Vercel (el proyecto Astro está en la raíz del repo, no hace falta cambiar Root Directory).
2. Vercel detecta Astro solo (build `npm run build`, salida `dist`). No hace falta adaptador: el sitio es 100 % estático.
3. Cargá las variables de entorno de la tabla de abajo en Project Settings → Environment Variables.

## Variables de entorno

Copiá `.env.example` como `.env`.

| Variable | Para qué sirve |
|---|---|
| `SITE_URL` | Dominio final. Se usa en canonical, Open Graph y `sitemap.xml`. Actualizá también `public/robots.txt` si cambia. |
| `PUBLIC_LEADS_WEBHOOK` | Endpoint que recibe los formularios (webhook de Zoho CRM o Zoho Flow). Recibe un `POST` con JSON. **Vacío = el envío se simula** y se muestra el mensaje de éxito. |
| `PUBLIC_GA_ID` | ID de Google Analytics 4 (`G-XXXXXXX`). Vacío = sin analítica. |
| `PUBLIC_BOOKING_PROVIDER` | `form` (por defecto), `zoho-bookings` o `calendly`. |
| `PUBLIC_BOOKING_URL` | URL de la página de reservas cuando el proveedor no es `form`. |

### Qué llega al webhook

`nombre`, `telefono` (con `+507`), `correo`, `modelo`, `motivo`, `privacidad`, `fecha_visita`, `hora_visita`, y los campos ocultos de origen: `pagina`, `modelo_pagina`, `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content` y `calculo` (JSON con el resultado de la calculadora, si la persona tocó "Quiero que me asesoren con esta cuota"). Además `origen: "web-praderas"` y `enviado` (fecha ISO).

Los UTM se guardan al entrar y viajan durante toda la sesión, aunque la persona cambie de página.

### Agenda (Zoho Bookings o Calendly)

`src/scripts/agenda-adaptador.ts` tiene un adaptador por proveedor. Con `form` la visita viaja como lead. Con `zoho-bookings` o `calendly` el lead igual llega al CRM y además se abre la página de reservas con nombre, correo y teléfono precargados.

### Eventos de GA4

`agendar_click`, `calculo_hecho`, `formulario_enviado`, `whatsapp_click`, `recorrido_360_abierto` y `video_abierto`. Cualquier elemento con `data-track="nombre"` dispara un evento al hacer clic (`src/scripts/analytics.ts`).

## Dónde editar el contenido

Todo el contenido vive en `src/data/` (pensado para pasarlo después a un CMS):

| Archivo | Contenido |
|---|---|
| `modelos.json` | Los 3 modelos: tipo, recámaras, baños, m², estacionamientos, precio, fotos, galería, planos y link del recorrido 360. Cada dato tiene `confirmar: true/false`. |
| `finanzas.json` | Parámetros de la calculadora: tasa, plazos, abono mínimo, máximo y por defecto, si la tasa es editable y el texto legal. |
| `amenidades.json` | Amenidades recreativas (con foto o icono) e infraestructura, que se muestra aparte. |
| `faq.json` | Preguntas frecuentes. |
| `puntos.json` | Puntos de interés por categoría (pestañas de Ubicación). |
| `sitio.json` | Contacto, redes, número de WhatsApp, mapa, horario de la agenda, motivos del formulario, testimonios y pasos del proceso. |

- **Fotos:** `src/assets/fotos/`. Los JSON las nombran por ruta relativa (`modelo-duplex/sala-duplex.jpg`). Astro genera AVIF/WebP en varios tamaños.
- **Logos:** `src/assets/marca/`. **Fuentes:** `public/fonts/` (Playfair Display y Manrope, self-hosted).
- **Marcador `[Confirmar]`:** cualquier dato con `confirmar: true` muestra una etiqueta naranja visible. Cuando el cliente valide el dato, cargalo y poné `confirmar: false`.
- **Testimonios:** en `sitio.json → testimonios`, completá `youtubeId` (lo que va después de `v=` en el link). Sin ID, la tarjeta queda como pendiente.
- **WhatsApp:** `sitio.json → contacto.whatsapp`, con código de país (`50760000000`). Vacío = WhatsApp deja elegir el contacto.

## Estructura

```
src/
  components/       Header, Footer, Calculadora, Agenda, Foto (astro:assets), Icon (set propio), Confirmar
  components/home/  Hero, Manifiesto, Modelos, Comparador, Amenidades, Ubicacion, Testimonios, Proceso, Faq
  layouts/Base.astro  SEO, Open Graph, JSON-LD, GA4, preloader, header y footer
  pages/            index, modelos/[slug], privacidad
  scripts/          main (Lenis + GSAP), animaciones, header, ui, calculadora, comparador, agenda, leads, analytics, puntero
  styles/global.css Tokens, tipografía, botones, campos, utilidades
```

## Animaciones y accesibilidad

- Curva `cubic-bezier(.22,1,.36,1)` / `power3.out`, duraciones de 0.6 a 1.2 s.
- `prefers-reduced-motion`: sin Lenis, sin pin, sin parallax ni Ken Burns; solo fades.
- Celular: sin pin; Modelos y Amenidades pasan a carruseles con swipe.
- Preloader solo en la primera visita de la sesión (`sessionStorage`), menos de 1.5 s, todo en CSS.
- Si el JavaScript falla, a los 4 s se quitan los estados iniciales ocultos y el contenido queda visible igual.
- Transiciones entre páginas con la View Transitions API nativa (`@view-transition`): la foto del modelo se expande hacia el hero de su página.

## Pendientes [CONFIRMAR] con Grupo Legacy

1. Recámaras, baños, m², estacionamientos y precio de **Roble**, **Cedro** y **Almendro Dúplex** (el precio de la calculadora usa $88,997 para los tres).
2. Si el plano A es de Roble y el B de Cedro.
3. Fotos de cada modelo: hoy Roble y Cedro comparten las fotos unifamiliares.
4. Fotos reales de amenidades terminadas (minigolf, pumptrack, mascotas).
5. Calculadora: tasa (6.5 % es un valor de relleno), plazos, abono mínimo y si la tasa queda editable u oculta.
6. Orientación de la calculadora: porcentaje de ingreso que piden los bancos y gastos de cierre.
7. Nombres y distancias de los puntos de interés.
8. Pin exacto del mapa (hoy busca "Praderas de Arraiján, Arraiján").
9. Links de YouTube de "Mi Historia en Praderas".
10. Pasos del proceso de compra, monto de separación y detalle de trámites.
11. Horario de visitas y si se excluyen otros días además del domingo.
12. Lista de requisitos para precalificar.
13. Número de WhatsApp de ventas.
14. Texto legal del aviso de privacidad.
15. Logo en vector (SVG) y video de dron para el hero (mismo tratamiento Ken Burns).
