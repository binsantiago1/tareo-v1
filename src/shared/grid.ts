/** Columnas de la vista Cuadrícula: 2, 3 o 4. */
export type GridColumns = 2 | 3 | 4

/** Propuesta automática: hasta 4 áreas → 2 columnas; de 5 a 9 → 3; 10 o más → 4. */
export function autoGridColumns(areaCount: number): GridColumns {
  if (areaCount <= 4) return 2
  if (areaCount <= 9) return 3
  return 4
}

/**
 * Cuántas tareas se muestran en un post-it cuadrado y cuántas quedan ocultas ("+N más").
 * Si no caben todas, la última fila se reserva para el aviso "+N más".
 */
export function visibleTaskCount(
  total: number,
  availableHeight: number,
  rowHeight: number
): { shown: number; hidden: number } {
  const capacity = Math.max(Math.floor(availableHeight / rowHeight), 0)
  if (total <= capacity) return { shown: total, hidden: 0 }
  const shown = Math.max(capacity - 1, 0)
  return { shown, hidden: total - shown }
}
