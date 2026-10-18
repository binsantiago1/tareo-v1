import { useLayoutEffect, useRef, useState } from 'react'
import { PriorityMark } from '@renderer/components/PriorityMark'
import { sortTasks } from '../../../shared/sorting'
import { visibleTaskCount } from '../../../shared/grid'
import type { Area, Task } from '../../../shared/types'

/** Alto fijo de cada fila de tarea (h-6 = 1.5rem = 24px), para calcular cuántas caben. */
const ROW_HEIGHT = 24

interface Props {
  area: Area
  /** Solo tareas pendientes. */
  tasks: Task[]
  onOpen: () => void
}

/** Post-it cuadrado y comprimido de la vista Cuadrícula. Al hacer clic se abre completo. */
export function GridPostIt({ area, tasks, onOpen }: Props): React.JSX.Element {
  const listRef = useRef<HTMLSpanElement>(null)
  const [listHeight, setListHeight] = useState(0)

  // Mide el espacio disponible para las tareas y lo actualiza si cambia el tamaño.
  useLayoutEffect(() => {
    const el = listRef.current
    if (!el) return
    setListHeight(el.clientHeight)
    const observer = new ResizeObserver(() => setListHeight(el.clientHeight))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const sorted = sortTasks(tasks, area.sortCriterion)
  const { shown, hidden } = visibleTaskCount(sorted.length, listHeight, ROW_HEIGHT)

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Abrir el área ${area.name} (${tasks.length} ${tasks.length === 1 ? 'tarea pendiente' : 'tareas pendientes'})`}
      className="flex aspect-square min-w-0 flex-col gap-1.5 overflow-hidden rounded-lg border bg-card p-3 text-left text-card-foreground shadow-sm transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <span className="line-clamp-2 text-lg leading-tight font-semibold break-words">
        {area.name}
      </span>
      {area.note && (
        <span className="line-clamp-2 text-xs break-words text-muted-foreground">{area.note}</span>
      )}
      <span ref={listRef} className="mt-1 block min-h-0 flex-1 overflow-hidden">
        {sorted.length === 0 ? (
          <span className="flex h-6 items-center text-sm text-muted-foreground">
            Sin tareas pendientes
          </span>
        ) : (
          <>
            {sorted.slice(0, shown).map((task) => (
              <span key={task.id} className="flex h-6 items-center gap-1.5 text-sm">
                <PriorityMark priority={task.priority} />
                <span className="truncate">{task.title}</span>
              </span>
            ))}
            {hidden > 0 && (
              <span className="flex h-6 items-center text-xs font-medium text-muted-foreground">
                +{hidden} más
              </span>
            )}
          </>
        )}
      </span>
    </button>
  )
}
