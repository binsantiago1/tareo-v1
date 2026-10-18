import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { ArrowUpDown, Pin, PinOff, X } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger
} from '@renderer/components/ui/dropdown-menu'
import { QuickAdd } from '@renderer/components/QuickAdd'
import { RowMenu } from '@renderer/components/RowMenu'
import { SortableTask } from '@renderer/components/SortableTask'
import { useLongPressSensors } from '@renderer/lib/dnd'
import { HOVER_ACTIONS } from '@renderer/lib/hoverActions'
import { noteStyle } from '@renderer/lib/noteStyle'
import { cn } from '@renderer/lib/utils'
import { useDataStore } from '@renderer/store/useDataStore'
import { sortTasks } from '../../../shared/sorting'
import type { Area, SortCriterion, Task } from '../../../shared/types'

/** Piezas para mover el post-it manteniendo pulsado el clic (solo en la vista Lista). */
export interface PostItDrag {
  setNodeRef: (node: HTMLElement | null) => void
  style: React.CSSProperties
  isDragging: boolean
  listeners: React.HTMLAttributes<HTMLElement> | undefined
}

interface Props {
  area: Area
  tasks: Task[]
  drag?: PostItDrag
  /** Si se pasa, es el post-it de escritorio: tiene una X (al pasar el cursor) que lo quita del escritorio. */
  widget?: { onClose: () => void }
  onEdit: () => void
  /** Si no se pasa, el menú del área no ofrece "Borrar" (en el post-it de escritorio no se borra). */
  onDelete?: () => void
}

const CRITERIA: { value: SortCriterion; label: string }[] = [
  { value: 'prioridad', label: 'Prioridad' },
  { value: 'tiempoRestante', label: 'Tiempo restante' },
  { value: 'fechaCreacion', label: 'Fecha de creación' },
  { value: 'personalizado', label: 'Personalizado' }
]

export function PostIt({ area, tasks, drag, widget, onEdit, onDelete }: Props): React.JSX.Element {
  const addTask = useDataStore((s) => s.addTask)
  const setSortCriterion = useDataStore((s) => s.setSortCriterion)
  const reorderTasks = useDataStore((s) => s.reorderTasks)
  const togglePin = useDataStore((s) => s.togglePin)
  const isPinned = useDataStore((s) => s.pinned.includes(area.id))
  const sensors = useLongPressSensors()

  // `tasks` solo trae las pendientes: las completadas están en el Archivo.
  const pending = sortTasks(tasks, area.sortCriterion)
  const pendingIds = pending.map((t) => t.id)
  const criterionLabel = CRITERIA.find((c) => c.value === area.sortCriterion)?.label

  const handleTaskDragEnd = ({ active, over }: DragEndEvent): void => {
    if (!over || active.id === over.id) return
    const from = pendingIds.indexOf(String(active.id))
    const to = pendingIds.indexOf(String(over.id))
    if (from === -1 || to === -1) return
    reorderTasks(area.id, arrayMove(pendingIds, from, to))
  }

  return (
    <div
      ref={drag?.setNodeRef}
      style={drag?.style}
      {...drag?.listeners}
      className={cn('paper-shadow', drag?.isDragging && 'relative z-20 scale-[1.02] opacity-90')}
    >
      <article
        style={noteStyle(area.color)}
        aria-label={`Área ${area.name}`}
        className={cn(
          'note paper group/postit flex flex-col gap-3 p-4 pt-5',
          widget ? 'min-h-40' : 'min-h-64'
        )}
      >
        {widget && (
          <button
            type="button"
            aria-label="Quitar del escritorio"
            title="Quitar del escritorio"
            onClick={widget.onClose}
            className="no-drag absolute top-1.5 right-1.5 z-10 flex size-6 items-center justify-center rounded-md opacity-0 transition-opacity group-focus-within/postit:opacity-100 group-hover/postit:opacity-100 hover:bg-accent focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none motion-reduce:transition-none"
          >
            <X className="size-4" />
          </button>
        )}
        <header
          className={cn('group/zone flex items-start justify-between gap-2', widget && 'pr-6')}
        >
          {/* En el post-it de escritorio el título sirve para arrastrar la ventana. */}
          <h2
            className={cn(
              'text-2xl leading-tight font-bold tracking-tight break-words',
              widget && 'drag-region'
            )}
          >
            {area.name}
          </h2>
          {/* Los iconos solo aparecen al pasar el cursor por el título (o al navegar con teclado). */}
          <div className={cn(HOVER_ACTIONS, widget && 'no-drag')}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  aria-label={`Ordenar las tareas de ${area.name}`}
                  title={`Orden: ${criterionLabel}`}
                >
                  <ArrowUpDown className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Ordenar tareas por</DropdownMenuLabel>
                <DropdownMenuRadioGroup
                  value={area.sortCriterion}
                  onValueChange={(value) => setSortCriterion(area.id, value as SortCriterion)}
                >
                  {CRITERIA.map((c) => (
                    <DropdownMenuRadioItem key={c.value} value={c.value}>
                      {c.label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <RowMenu
              label={`el área ${area.name}`}
              className="size-8"
              onEdit={onEdit}
              onDelete={onDelete}
            >
              <DropdownMenuItem onSelect={() => togglePin(area.id)}>
                {isPinned ? <PinOff className="size-4" /> : <Pin className="size-4" />}
                {isPinned ? 'Quitar del escritorio' : 'Poner en el escritorio'}
              </DropdownMenuItem>
            </RowMenu>
          </div>
        </header>
        {area.note && (
          <p className="text-sm whitespace-pre-wrap break-words text-muted-foreground">
            {area.note}
          </p>
        )}

        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin tareas pendientes.</p>
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

        {/* El campo para añadir solo se ve al pasar el cursor por el post-it (o al usar el teclado). */}
        <div className="mt-auto pt-2 opacity-0 transition-opacity group-focus-within/postit:opacity-100 group-hover/postit:opacity-100 motion-reduce:transition-none">
          <QuickAdd
            label={`Nueva tarea en ${area.name}`}
            placeholder="Nueva tarea"
            onAdd={(title) => addTask(area.id, title)}
          />
        </div>
      </article>
    </div>
  )
}
