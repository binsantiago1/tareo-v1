import { Fragment, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  DndContext,
  pointerWithin,
  useDroppable,
  type DragEndEvent,
  type DragMoveEvent
} from '@dnd-kit/core'
import { PlacedPostIt } from '@renderer/components/PlacedPostIt'
import { useLongPressSensors } from '@renderer/lib/dnd'
import { cn } from '@renderer/lib/utils'
import { useDataStore } from '@renderer/store/useDataStore'
import {
  CELL_GAP,
  computeBoard,
  insertionIndex,
  moveNote,
  type BoardColumn
} from '../../../shared/layout'
import type { Area, Task } from '../../../shared/types'

interface Props {
  /** Áreas en su orden natural (el de creación). */
  areas: Area[]
  tasksOf: (areaId: string) => Task[]
  onEdit: (area: Area) => void
  onDelete: (area: Area) => void
}

interface DropTarget {
  col: number
  /** Cuántas notas de esa columna quedan por encima del hueco. */
  index: number
}

/** Línea que marca dónde va a quedar la nota que se está arrastrando. */
function DropLine(): React.JSX.Element {
  return <div className="h-1 shrink-0 rounded-full bg-foreground/60" aria-hidden="true" />
}

/** Una columna del tablero: las notas van apiladas de arriba abajo, pegadas unas a otras. */
function ColumnView({
  column,
  dragging,
  draggedId,
  dropIndex,
  renderNote
}: {
  column: BoardColumn
  dragging: boolean
  draggedId: string | null
  /** Hueco donde se soltaría la nota arrastrada (solo si es esta columna). */
  dropIndex: number | null
  renderNote: (id: string) => React.ReactNode
}): React.JSX.Element {
  const { setNodeRef, isOver } = useDroppable({ id: `col-${column.index}` })

  // La línea se coloca entre las notas, sin contar la que se está arrastrando.
  let above = 0
  const children: React.ReactNode[] = []
  for (const id of column.ids) {
    if (id === draggedId) {
      children.push(<Fragment key={id}>{renderNote(id)}</Fragment>)
      continue
    }
    if (dropIndex === above) children.push(<DropLine key={`line-${above}`} />)
    children.push(<Fragment key={id}>{renderNote(id)}</Fragment>)
    above++
  }
  if (dropIndex !== null && dropIndex >= above) children.push(<DropLine key="line-end" />)

  return (
    <div
      ref={setNodeRef}
      data-col={column.index}
      style={{ width: column.width, gap: CELL_GAP }}
      className={cn(
        'flex shrink-0 flex-col rounded-md outline-2 outline-dashed transition-colors motion-reduce:transition-none',
        dragging ? 'outline-foreground/20' : 'outline-transparent',
        dragging && isOver && 'bg-foreground/5 outline-foreground/50'
      )}
    >
      {children}
    </div>
  )
}

/**
 * Tablero de post-its por columnas:
 * - Cada columna tiene el ancho de su nota más ancha y las notas se apilan una pegada a otra.
 * - Se puede llevar una nota a cualquier columna y a cualquier altura (una línea marca el hueco);
 *   se pueden dejar columnas vacías.
 * - Cuántas columnas hay depende del ancho de la ventana.
 */
export function PostItBoard({ areas, tasksOf, onEdit, onDelete }: Props): React.JSX.Element {
  const sensors = useLongPressSensors()
  const setAreaPositions = useDataStore((s) => s.setAreaPositions)
  const hostRef = useRef<HTMLDivElement>(null)
  const [availableWidth, setAvailableWidth] = useState(1200)
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null)

  // Las columnas se ajustan al ancho de la ventana.
  useLayoutEffect(() => {
    const host = hostRef.current
    if (!host) return
    const update = (): void => setAvailableWidth(host.clientWidth)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(host)
    return () => observer.disconnect()
  }, [])

  const columns = useMemo(
    () =>
      computeBoard(
        areas.map((a) => ({ id: a.id, col: a.col, row: a.row, width: a.width })),
        availableWidth
      ),
    [areas, availableWidth]
  )
  const areaById = useMemo(() => new Map(areas.map((a) => [a.id, a])), [areas])

  /** Dónde caería la nota arrastrada: la columna bajo el cursor y el hueco según su altura. */
  const targetOf = (event: DragMoveEvent | DragEndEvent): DropTarget | null => {
    const over = /^col-(\d+)$/.exec(String(event.over?.id ?? ''))
    const host = hostRef.current
    if (!over || !host) return null
    const col = Number(over[1])
    const pointer = event.activatorEvent as PointerEvent
    const pointerY = pointer.clientY + event.delta.y
    const middles = [...host.querySelectorAll<HTMLElement>(`[data-col="${col}"] [data-area-id]`)]
      .filter((el) => el.dataset.areaId !== String(event.active.id))
      .map((el) => {
        const rect = el.getBoundingClientRect()
        return rect.top + rect.height / 2
      })
    return { col, index: insertionIndex(middles, pointerY) }
  }

  const handleDragEnd = (event: DragEndEvent): void => {
    const target = targetOf(event)
    setDraggedId(null)
    setDropTarget(null)
    if (!target) return
    // Se fija la posición de todas las notas tal como quedan, con la elegida en su nuevo hueco.
    setAreaPositions(moveNote(columns, String(event.active.id), target.col, target.index))
  }

  return (
    <div ref={hostRef} className="w-full">
      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={(event) => setDraggedId(String(event.active.id))}
        onDragMove={(event) => setDropTarget(targetOf(event))}
        onDragCancel={() => {
          setDraggedId(null)
          setDropTarget(null)
        }}
        onDragEnd={handleDragEnd}
      >
        {/* Las columnas llegan hasta abajo del todo del tablero, para poder soltar debajo de la última nota. */}
        <div className="flex min-h-[70vh] items-stretch" style={{ gap: CELL_GAP }}>
          {columns.map((column) => (
            <ColumnView
              key={column.index}
              column={column}
              dragging={draggedId !== null}
              draggedId={draggedId}
              dropIndex={dropTarget?.col === column.index ? dropTarget.index : null}
              renderNote={(id) => {
                const area = areaById.get(id)
                if (!area) return null
                return (
                  <PlacedPostIt
                    area={area}
                    tasks={tasksOf(id)}
                    onEdit={() => onEdit(area)}
                    onDelete={() => onDelete(area)}
                  />
                )
              }}
            />
          ))}
        </div>
      </DndContext>
    </div>
  )
}
