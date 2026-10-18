import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { QuickAdd } from '@renderer/components/QuickAdd'
import { SortableTask } from '@renderer/components/SortableTask'
import { noteStyle } from '@renderer/lib/noteStyle'
import { cn } from '@renderer/lib/utils'
import { useDataStore } from '@renderer/store/useDataStore'
import { sortTasks } from '../../../shared/sorting'
import type { Area, SortCriterion, Task } from '../../../shared/types'

/** Piezas para poder mover el post-it arrastrándolo (solo en la vista Lista). */
export interface PostItDrag {
  setNodeRef: (node: HTMLElement | null) => void
  style: React.CSSProperties
  isDragging: boolean
  handle: React.ReactNode
}

interface Props {
  area: Area
  tasks: Task[]
  drag?: PostItDrag
  onEdit: () => void
  onDelete: () => void
}

const CRITERIA: { value: SortCriterion; label: string }[] = [
  { value: 'prioridad', label: 'Prioridad' },
  { value: 'tiempoRestante', label: 'Tiempo restante' },
  { value: 'fechaCreacion', label: 'Fecha de creación' },
  { value: 'personalizado', label: 'Personalizado' }
]

export function PostIt({ area, tasks, drag, onEdit, onDelete }: Props): React.JSX.Element {
  const { addTask, setSortCriterion, reorderTasks } = useDataStore()

  // Arrastrar tareas (contexto propio de este post-it). Funciona con ratón y con teclado.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  // `tasks` solo trae las pendientes: las completadas están en el Archivo.
  const pending = sortTasks(tasks, area.sortCriterion)
  const pendingIds = pending.map((t) => t.id)

  const handleTaskDragEnd = ({ active, over }: DragEndEvent): void => {
    if (!over || active.id === over.id) return
    const from = pendingIds.indexOf(String(active.id))
    const to = pendingIds.indexOf(String(over.id))
    if (from === -1 || to === -1) return
    reorderTasks(area.id, arrayMove(pendingIds, from, to))
  }

  return (
    <article
      ref={drag?.setNodeRef}
      style={{ ...noteStyle(area.color), ...drag?.style }}
      aria-label={`Área ${area.name}`}
      className={cn(
        'note paper flex min-h-64 flex-col gap-3 p-4 pt-5',
        drag?.isDragging && 'relative z-20 scale-[1.02] opacity-90'
      )}
    >
      <header className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-1">
          {drag?.handle}
          <h2 className="text-2xl leading-tight font-bold tracking-tight break-words">
            {area.name}
          </h2>
        </div>
        <div className="flex shrink-0">
          <Button variant="ghost" size="icon" aria-label={`Editar ${area.name}`} onClick={onEdit}>
            <Pencil className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" aria-label={`Borrar ${area.name}`} onClick={onDelete}>
            <Trash2 className="size-4" />
          </Button>
        </div>
      </header>
      {area.note && (
        <p className="text-sm whitespace-pre-wrap break-words text-muted-foreground">{area.note}</p>
      )}

      <label className="flex items-center gap-2 text-xs text-muted-foreground">
        Orden:
        <select
          value={area.sortCriterion}
          onChange={(e) => setSortCriterion(area.id, e.target.value as SortCriterion)}
          className="h-7 rounded-md border border-input bg-field px-2 text-xs text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          {CRITERIA.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </label>

      {tasks.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Sin tareas pendientes. Escribe una abajo y pulsa Enter.
        </p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleTaskDragEnd}
        >
          <SortableContext items={pendingIds} strategy={verticalListSortingStrategy}>
            <ul className="grid gap-2 text-sm">
              {pending.map((task) => (
                <SortableTask key={task.id} task={task} />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      <div className="mt-auto pt-2">
        <QuickAdd
          label={`Nueva tarea en ${area.name}`}
          placeholder="Nueva tarea y Enter"
          onAdd={(title) => addTask(area.id, title)}
        />
      </div>
    </article>
  )
}
