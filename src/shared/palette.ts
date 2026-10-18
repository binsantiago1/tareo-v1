/**
 * Colores de papel de los post-its: cada uno es una combinación de fondo y tipografía.
 * `alert` / `alertInk` son el color de lo vencido (rojo legible sobre ese papel) y su texto.
 */
export interface NoteColor {
  id: string
  label: string
  bg: string
  ink: string
  alert: string
  alertInk: string
}

export const NOTE_COLORS: NoteColor[] = [
  // Tradicional: el típico post-it amarillo con letras negras.
  {
    id: 'clasico',
    label: 'Clásico',
    bg: '#FFE680',
    ink: '#111111',
    alert: '#C4001A',
    alertInk: '#FFFFFF'
  },
  {
    id: 'dorado',
    label: 'Dorado',
    bg: '#FFD35F',
    ink: '#FF0000',
    alert: '#8F0010',
    alertInk: '#FFFFFF'
  },
  {
    id: 'lavanda',
    label: 'Lavanda',
    bg: '#D8C3E6',
    ink: '#1B2BB4',
    alert: '#A50014',
    alertInk: '#FFFFFF'
  },
  {
    id: 'naranja',
    label: 'Naranja',
    bg: '#F5853A',
    ink: '#FEF8EE',
    alert: '#6B0A0A',
    alertInk: '#FFFFFF'
  },
  {
    id: 'malva',
    label: 'Malva',
    bg: '#BC6E84',
    ink: '#FEF8EE',
    alert: '#3A000D',
    alertInk: '#FFFFFF'
  },
  {
    id: 'verde',
    label: 'Verde',
    bg: '#4F8B4E',
    ink: '#FEF8EE',
    alert: '#33000B',
    alertInk: '#FFFFFF'
  },
  {
    id: 'rojo',
    label: 'Rojo',
    bg: '#E0431F',
    ink: '#FEF8EE',
    alert: '#2E0008',
    alertInk: '#FFFFFF'
  },
  {
    id: 'celeste',
    label: 'Celeste',
    bg: '#A1D1FD',
    ink: '#1B2BB4',
    alert: '#A50014',
    alertInk: '#FFFFFF'
  },
  {
    id: 'azul',
    label: 'Azul',
    bg: '#2B61EB',
    ink: '#FEF8EE',
    alert: '#FFD0D0',
    alertInk: '#4A0010'
  },
  {
    id: 'marino',
    label: 'Marino',
    bg: '#0F1F5C',
    ink: '#FFFFFF',
    alert: '#FF8A8A',
    alertInk: '#3A0010'
  }
]

export const DEFAULT_NOTE_COLOR = 'clasico'

/** Ids de la paleta anterior (20 colores) → color más parecido de la nueva. */
const LEGACY_COLORS: Record<string, string> = {
  amarillo: 'clasico',
  limon: 'dorado',
  lima: 'verde',
  verde: 'verde',
  menta: 'verde',
  turquesa: 'celeste',
  celeste: 'celeste',
  azul: 'azul',
  indigo: 'azul',
  lavanda: 'lavanda',
  violeta: 'lavanda',
  orquidea: 'malva',
  rosa: 'malva',
  fucsia: 'malva',
  coral: 'rojo',
  rojo: 'rojo',
  naranja: 'naranja',
  melocoton: 'naranja',
  arena: 'clasico',
  gris: 'marino'
}

/**
 * Devuelve el color pedido. Los ids de la paleta anterior se traducen al más parecido
 * (así los datos antiguos se ven bien) y lo desconocido o vacío es el clásico.
 */
export function noteColorOf(id: string | undefined): NoteColor {
  const exact = NOTE_COLORS.find((c) => c.id === id)
  if (exact) return exact
  const migrated = id !== undefined ? LEGACY_COLORS[id] : undefined
  return NOTE_COLORS.find((c) => c.id === migrated) ?? NOTE_COLORS[0]
}

/** Primer color que ninguna otra área está usando; si se usan todos, vuelve a empezar. */
export function nextFreeColor(usedIds: (string | undefined)[]): string {
  const used = new Set(usedIds.map((id) => noteColorOf(id).id))
  const free = NOTE_COLORS.find((c) => !used.has(c.id))
  return (free ?? NOTE_COLORS[usedIds.length % NOTE_COLORS.length]).id
}
