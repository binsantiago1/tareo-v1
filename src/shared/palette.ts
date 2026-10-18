/**
 * Paleta de 20 colores de papel para los post-its.
 * `hue` y `chroma` se usan en CSS (oklch) para generar el tono claro y el oscuro de cada color.
 */
export interface NoteColor {
  id: string
  label: string
  hue: number
  chroma: number
}

export const NOTE_COLORS: NoteColor[] = [
  { id: 'amarillo', label: 'Amarillo', hue: 98, chroma: 0.12 },
  { id: 'limon', label: 'Limón', hue: 118, chroma: 0.12 },
  { id: 'lima', label: 'Lima', hue: 135, chroma: 0.11 },
  { id: 'verde', label: 'Verde', hue: 152, chroma: 0.09 },
  { id: 'menta', label: 'Menta', hue: 172, chroma: 0.07 },
  { id: 'turquesa', label: 'Turquesa', hue: 192, chroma: 0.06 },
  { id: 'celeste', label: 'Celeste', hue: 225, chroma: 0.05 },
  { id: 'azul', label: 'Azul', hue: 252, chroma: 0.05 },
  { id: 'indigo', label: 'Índigo', hue: 272, chroma: 0.05 },
  { id: 'lavanda', label: 'Lavanda', hue: 292, chroma: 0.05 },
  { id: 'violeta', label: 'Violeta', hue: 310, chroma: 0.06 },
  { id: 'orquidea', label: 'Orquídea', hue: 330, chroma: 0.06 },
  { id: 'rosa', label: 'Rosa', hue: 350, chroma: 0.06 },
  { id: 'fucsia', label: 'Fucsia', hue: 3, chroma: 0.08 },
  { id: 'coral', label: 'Coral', hue: 22, chroma: 0.08 },
  { id: 'rojo', label: 'Rojo', hue: 30, chroma: 0.09 },
  { id: 'naranja', label: 'Naranja', hue: 55, chroma: 0.1 },
  { id: 'melocoton', label: 'Melocotón', hue: 70, chroma: 0.08 },
  { id: 'arena', label: 'Arena', hue: 85, chroma: 0.04 },
  { id: 'gris', label: 'Gris', hue: 250, chroma: 0.008 }
]

export const DEFAULT_NOTE_COLOR = 'amarillo'

/** Devuelve el color pedido, o el amarillo si no existe (por ejemplo, áreas antiguas sin color). */
export function noteColorOf(id: string | undefined): NoteColor {
  return NOTE_COLORS.find((c) => c.id === id) ?? NOTE_COLORS[0]
}

/** Primer color que ninguna otra área está usando; si se usan todos, vuelve a empezar. */
export function nextFreeColor(usedIds: (string | undefined)[]): string {
  const used = new Set(usedIds.map((id) => noteColorOf(id).id))
  const free = NOTE_COLORS.find((c) => !used.has(c.id))
  return (free ?? NOTE_COLORS[usedIds.length % NOTE_COLORS.length]).id
}
