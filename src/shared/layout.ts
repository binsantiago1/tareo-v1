/** Ancho de una celda (y ancho por defecto de un post-it), en píxeles. */
export const NOTE_WIDTH = 300
/** Separación entre celdas, en píxeles. */
export const CELL_GAP = 16

export interface Placement {
  col: number
  row: number
  /** Cuántas columnas ocupa (un post-it más ancho que una celda ocupa varias). */
  span: number
}

export interface LayoutItem {
  id: string
  /** Posición guardada (0 = primera columna / primera fila). Sin ella, se coloca sola. */
  col?: number
  row?: number
  /** Ancho del post-it en píxeles (por defecto, el de una celda). */
  width?: number
}

/** Columnas que ocupa un post-it del ancho dado. */
export function spanFor(width: number | undefined, columns: number): number {
  const span = Math.ceil((width ?? NOTE_WIDTH) / (NOTE_WIDTH + CELL_GAP))
  return Math.min(Math.max(span, 1), Math.max(columns, 1))
}

/** Cuántas columnas caben en un ancho disponible (en píxeles). */
export function columnsFor(availableWidth: number): number {
  return Math.max(Math.floor((availableWidth + CELL_GAP) / (NOTE_WIDTH + CELL_GAP)), 1)
}

/**
 * Coloca los post-its en una cuadrícula de celdas, como en una hoja de cálculo:
 * - Cada nota con posición guardada va a su celda, si cabe y está libre.
 * - Si no (la ventana se hizo estrecha, o dos notas coinciden), pasa a la primera celda libre.
 * - Las notas sin posición (nuevas o antiguas) rellenan las primeras celdas libres.
 * Las celdas vacías se respetan: se pueden dejar huecos.
 * `items` va en el orden "natural" (el de creación o el que tuvieran antes).
 */
export function computeLayout(items: LayoutItem[], columns: number): Map<string, Placement> {
  const cols = Math.max(columns, 1)
  const result = new Map<string, Placement>()
  const taken = new Set<string>()
  const key = (row: number, col: number): string => `${row}:${col}`

  const fits = (row: number, col: number, span: number): boolean => {
    if (col < 0 || col + span > cols) return false
    for (let c = col; c < col + span; c++) if (taken.has(key(row, c))) return false
    return true
  }
  const occupy = (id: string, row: number, col: number, span: number): void => {
    for (let c = col; c < col + span; c++) taken.add(key(row, c))
    result.set(id, { col, row, span })
  }
  const firstFree = (span: number): { row: number; col: number } => {
    for (let row = 0; ; row++) {
      for (let col = 0; col + span <= cols; col++) if (fits(row, col, span)) return { row, col }
    }
  }

  const placed = items
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => item.col !== undefined && item.row !== undefined)
    .sort((a, b) => a.item.row! - b.item.row! || a.item.col! - b.item.col! || a.index - b.index)
  const unplaced = items.filter((item) => item.col === undefined || item.row === undefined)

  for (const { item } of placed) {
    const span = spanFor(item.width, cols)
    if (fits(item.row!, item.col!, span)) occupy(item.id, item.row!, item.col!, span)
    else {
      const free = firstFree(span)
      occupy(item.id, free.row, free.col, span)
    }
  }
  for (const item of unplaced) {
    const span = spanFor(item.width, cols)
    const free = firstFree(span)
    occupy(item.id, free.row, free.col, span)
  }
  return result
}
