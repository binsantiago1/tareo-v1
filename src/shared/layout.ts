/** Ancho mínimo de una columna (y ancho por defecto de un post-it), en píxeles. */
export const NOTE_WIDTH = 300
/** Separación entre columnas y entre notas, en píxeles. */
export const CELL_GAP = 16

export interface LayoutItem {
  id: string
  /** Columna guardada (0 = la primera). Sin ella, la nota se coloca sola. */
  col?: number
  /** Orden dentro de su columna (0 = arriba del todo). */
  row?: number
  /** Ancho del post-it en píxeles (por defecto, el de una columna). */
  width?: number
}

export interface BoardColumn {
  index: number
  /** Ancho de la columna: el de su nota más ancha (nunca menos que NOTE_WIDTH). */
  width: number
  /** Notas de arriba abajo. */
  ids: string[]
}

/**
 * Organiza los post-its en columnas, como un tablero:
 * - Cada columna tiene el ancho de su nota más ancha, así que el espacio que ocupa una nota
 *   ancha es de SU columna, no de la siguiente.
 * - Dentro de una columna las notas van apiladas de arriba abajo, una pegada a la otra
 *   (la altura de una nota no afecta a las columnas de al lado).
 * - Cuántas columnas se ven depende del ancho disponible. Las notas que estaban en una columna
 *   que ya no cabe (o que aún no tienen sitio) pasan a la columna con menos notas; su posición
 *   guardada no cambia, así que al ensanchar la ventana vuelven a su sitio.
 * `items` va en el orden "natural" (el de creación).
 */
export function computeBoard(items: LayoutItem[], availableWidth: number): BoardColumn[] {
  const stored = items
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => item.col !== undefined && item.row !== undefined)
    .sort((a, b) => a.item.row! - b.item.row! || a.item.col! - b.item.col! || a.index - b.index)
    .map(({ item }) => item)
  const unplaced = items.filter((item) => item.col === undefined || item.row === undefined)

  // Ancho de cada columna según las notas que tiene guardadas.
  const widthOf = new Map<number, number>()
  for (const item of stored) {
    const col = item.col!
    widthOf.set(col, Math.max(widthOf.get(col) ?? NOTE_WIDTH, item.width ?? NOTE_WIDTH))
  }

  // Cuántas columnas caben (siempre al menos una).
  let count = 0
  let used = 0
  while (count < 200) {
    const next = used + (count > 0 ? CELL_GAP : 0) + (widthOf.get(count) ?? NOTE_WIDTH)
    if (next > availableWidth && count >= 1) break
    used = next
    count++
  }

  const lists: LayoutItem[][] = Array.from({ length: count }, () => [])
  const homeless: LayoutItem[] = []
  for (const item of stored) {
    if (item.col! < count) lists[item.col!].push(item)
    else homeless.push(item)
  }
  // Las que no tienen sitio (o no caben) van a la columna con menos notas (a igualdad, la de más a la izquierda).
  for (const item of [...homeless, ...unplaced]) {
    let target = 0
    for (let c = 1; c < count; c++) if (lists[c].length < lists[target].length) target = c
    lists[target].push(item)
  }

  return lists.map((list, index) => ({
    index,
    ids: list.map((item) => item.id),
    width: Math.max(NOTE_WIDTH, ...list.map((item) => item.width ?? NOTE_WIDTH))
  }))
}

/**
 * Posiciones nuevas al llevar una nota a una columna, en un hueco concreto
 * (`index` = cuántas notas de esa columna quedan por encima, sin contar la que se mueve).
 * Devuelve la posición (columna y orden) de TODAS las notas, para guardarlas fijas.
 */
export function moveNote(
  columns: BoardColumn[],
  id: string,
  targetCol: number,
  index: number
): Record<string, { col: number; row: number }> {
  const lists = columns.map((c) => c.ids.filter((other) => other !== id))
  const target = Math.min(Math.max(targetCol, 0), lists.length - 1)
  lists[target].splice(Math.min(Math.max(index, 0), lists[target].length), 0, id)
  const result: Record<string, { col: number; row: number }> = {}
  lists.forEach((list, col) => list.forEach((noteId, row) => (result[noteId] = { col, row })))
  return result
}

/** Cuántas notas de la columna quedan por encima de un punto (en vertical), sin contar la que se arrastra. */
export function insertionIndex(noteMiddles: number[], pointerY: number): number {
  const index = noteMiddles.findIndex((middle) => middle > pointerY)
  return index === -1 ? noteMiddles.length : index
}
