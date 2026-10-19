import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { DndContext, pointerWithin, useDroppable, type DragEndEvent } from '@dnd-kit/core'
import { PlacedPostIt } from '@renderer/components/PlacedPostIt'
import { useLongPressSensors } from '@renderer/lib/dnd'
import { cn } from '@renderer/lib/utils'
import { useDataStore } from '@renderer/store/useDataStore'
import { CELL_GAP, NOTE_WIDTH, columnsFor, computeLayout } from '../../../shared/layout'
import type { Area, Task } from '../../../shared/types'

/** Alto mínimo de una fila de celdas. */
const MIN_ROW_HEIGHT = 96

interface Props {
  /** Áreas en su orden natural (el de creación). */
  areas: Area[]
  tasksOf: (areaId: string) => Task[]
  onEdit: (area: Area) => void
  onDelete: (area: Area) => void
}

/** Una celda del tablero: solo se ve mientras se arrastra un post-it, y se resalta al pasar por encima. */
function BoardCell({
  col,
  row,
  dragging
}: {
  col: number
  row: number
  dragging: boolean
}): React.JSX.Element {
  const { setNodeRef, isOver } = useDroppable({ id: `cell-${col}-${row}` })
  return (
    <div
      ref={setNodeRef}
      data-cell={`${col}-${row}`}
      style={{ gridColumn: col + 1, gridRow: row + 1 }}
      className={cn(
        'rounded-md border-2 border-dashed transition-colors motion-reduce:transition-none',
        dragging ? 'border-foreground/20' : 'pointer-events-none border-transparent',
        dragging && isOver && 'border-foreground/60 bg-foreground/10'
      )}
    />
  )
}

/**
 * Tablero de post-its como una hoja de cálculo: cada nota está en una celda (columna y fila),
 * se puede llevar a cualquier celda (si está ocupada, las dos notas se intercambian) y se pueden
 * dejar celdas vacías. Cuántas columnas hay depende del ancho de la ventana.
 */
export function PostItBoard({ areas, tasksOf, onEdit, onDelete }: Props): React.JSX.Element {
  const sensors = useLongPressSensors()
  const setAreaPositions = useDataStore((s) => s.setAreaPositions)
  const hostRef = useRef<HTMLDivElement>(null)
  const [columns, setColumns] = useState(4)
  const [dragging, setDragging] = useState(false)

  // Las columnas se ajustan al ancho de la ventana.
  useLayoutEffect(() => {
    const host = hostRef.current
    if (!host) return
    const update = (): void => setColumns(columnsFor(host.clientWidth))
    update()
    const observer = new ResizeObserver(update)
    observer.observe(host)
    return () => observer.disconnect()
  }, [])

  const layout = useMemo(
    () =>
      computeLayout(
        areas.map((a) => ({ id: a.id, col: a.col, row: a.row, width: a.width })),
        columns
      ),
    [areas, columns]
  )
  const usedRows = Math.max(...[...layout.values()].map((p) => p.row + 1), 0)
  // Una fila más de la ocupada, para poder llevar una nota debajo del todo.
  const rows = usedRows + 1

  const handleDragEnd = ({ active, over }: DragEndEvent): void => {
    setDragging(false)
    const target = /^cell-(\d+)-(\d+)$/.exec(String(over?.id ?? ''))
    const moved = layout.get(String(active.id))
    if (!target || !moved) return
    const row = Number(target[2])
    // Una nota ancha no puede empezar tan a la derecha que se salga del tablero.
    const col = Math.min(Number(target[1]), columns - moved.span)

    // Se fija la posición de todas las notas tal como se ven ahora, y se mueve la elegida.
    const next: Record<string, { col: number; row: number }> = {}
    for (const [id, p] of layout) next[id] = { col: p.col, row: p.row }
    next[String(active.id)] = { col, row }
    // Si en esa celda había otra nota, las dos intercambian sus sitios.
    const occupant = [...layout.entries()].find(
      ([id, p]) =>
        id !== String(active.id) &&
        p.row === row &&
        col < p.col + p.span &&
        p.col < col + moved.span
    )
    if (occupant) next[occupant[0]] = { col: moved.col, row: moved.row }
    setAreaPositions(next)
  }

  return (
    <div ref={hostRef} className="w-full">
      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={() => setDragging(true)}
        onDragCancel={() => setDragging(false)}
        onDragEnd={handleDragEnd}
      >
        <div
          className="grid"
          style={{
            gap: CELL_GAP,
            gridTemplateColumns: `repeat(${columns}, ${NOTE_WIDTH}px)`,
            gridTemplateRows: `repeat(${rows}, minmax(${MIN_ROW_HEIGHT}px, auto))`
          }}
        >
          {Array.from({ length: rows * columns }, (_, i) => (
            <BoardCell
              key={i}
              col={i % columns}
              row={Math.floor(i / columns)}
              dragging={dragging}
            />
          ))}
          {areas.map((area) => {
            const placement = layout.get(area.id)
            if (!placement) return null
            return (
              <PlacedPostIt
                key={area.id}
                area={area}
                tasks={tasksOf(area.id)}
                placement={placement}
                onEdit={() => onEdit(area)}
                onDelete={() => onDelete(area)}
              />
            )
          })}
        </div>
      </DndContext>
    </div>
  )
}
