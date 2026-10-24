import type { ImageMetadata } from 'astro';

// Todas las fotos de src/assets/fotos, indexadas por su ruta relativa
// (la misma que usan los JSON de src/data: "modelo-duplex/sala-duplex.jpg").
const archivos = import.meta.glob<{ default: ImageMetadata }>('/src/assets/fotos/**/*.{jpg,jpeg,png,webp}', { eager: true });

const fotos: Record<string, ImageMetadata> = {};
for (const [ruta, mod] of Object.entries(archivos)) {
  fotos[ruta.replace('/src/assets/fotos/', '')] = mod.default;
}

export function foto(ruta: string): ImageMetadata {
  const img = fotos[ruta];
  if (!img) throw new Error(`Foto no encontrada en src/assets/fotos: ${ruta}`);
  return img;
}
