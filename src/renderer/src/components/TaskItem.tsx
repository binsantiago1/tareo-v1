import { useEffect, useRef, useState } from 'react'
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { ChevronDown, ListPlus } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { Checkbox } from '@renderer/components/ui/checkbox'
import { ConfirmDialog } from '@renderer/components/ConfirmDialog'
import { ItemDialog } from '@renderer/components/ItemDialog'
import { PriorityMark } from '@renderer/components/PriorityMark'
import { QuickAdd } from '@renderer/components/QuickAdd'
import { RowMenu } from '@renderer/components/RowMenu'
import { SortableSubtask } from '@renderer/components/SubtaskRow'
import type { RowDrag } from '@renderer/components/SubtaskRow'
import { formatDaysLeft, formatDueDate, todayString } from '@renderer/lib/dates'
import { OVERDUE_NAME } from '@renderer/lib/urgency'
import { useLongPressSensors } from '@renderer/lib/dnd'
import { HOVER_ACTIONS } from '@renderer/lib/hoverActions'
import { cn } from '@renderer/lib/utils'
import { useDataStore } from '@renderer/store/useDataStore'
import { daysUntil, isOverdue } from '../../../shared/taskRules'
import type { Task } from '../../../shared/types'

interface Props {
  task: Task
  /** Piezas para arrastrar la tarea manteniendo pulsado el clic. */
  drag?: RowDrag
}

export function TaskItem({ task, drag }: Props): React.JSX.Element {
  const toggleTask = useDataStore((s) => s.toggleTask)
  const updateTask = useDataStore((s) => s.updateTask)
  const removeTask = useDataStore((s) => s.removeTask)
  const addSubtask = useDataStore((s) => s.addSubtask)
  const reorderSubtasks = useDataStore((s) => s.reorderSubtasks)
  const setCollapsed = useDataStore((s) => s.setCollapsed)
  const sensors = useLongPressSensors()
  const liRef = useRef<HTMLLIElement | null>(null)
  const leaving = useDataStore((s) => s.leaving[task.id] === true)
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [addingSubtask, setAddingSubtask] = useState(false)

  const hasSubtasks = task.subtasks.length > 0
  const doneCount = task.subtasks.filter((s) => s.completed).length
  const overdue = !task.completed && isOverdue(task.dueDate, todayString())
  const subtaskIds = task.subtasks.map((s) => s.id)
  const collapsed = hasSubtasks && task.collapsed === true

  const handleSubtaskDragEnd = ({ active, over }: DragEndEvent): void => {
    if (!over || active.id === over.id) return
    const from = subtaskIds.indexOf(String(active.id))
    const to = subtaskIds.indexOf(String(over.id))
    if (from === -1 || to === -1) return
    reorderSubtasks(task.id, arrayMove(subtaskIds, from, to))
  }

  // Animación de salida de una tarea completada: se desvanece y se encoge hasta desaparecer.
  // Si se pulsa "Deshacer" a mitad, la animación se cancela y la tarea vuelve a verse.
  useEffect(() => {
    const el = liRef.current
    if (!leaving || !el) return
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const height = el.offsetHeight
    el.style.overflow = 'hidden'
    const animation = el.animate(
      [
        { height: `${height}px`, opacity: 1, marginTop: '0px' },
        { height: '0px', opacity: 0, marginTop: '-0.5rem' }
      ],
      { duration: reduceMotion ? 0 : 350, easing: 'ease-in', fill: 'forwards' }
    )
    return () => {
      animation.cancel()
      el.style.overflow = ''
    }
  }, [leaving])

  return (
    <li
      ref={(node) => {
        liRef.current = node
        drag?.setNodeRef(node)
      }}
      style={drag?.style}
      {...drag?.listeners}
      className={cn('grid gap-1 bg-card', drag?.isDragging && 'relative z-10 rounded shadow-md')}
    >
      <div className="group/zone flex items-start gap-2">
        <Checkbox
          checked={task.completed}
          disabled={hasSubtasks}
          aria-label={`Completar «${task.title}»`}
          title={hasSubtasks ? 'Se completa sola cuando terminas todas las subtareas' : undefined}
          onChange={() => toggleTask(task.id)}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span
              className={cn(
                'strike break-words',
                task.completed && 'strike-on text-muted-foreground',
                overdue && OVERDUE_NAME
              )}
            >
              {task.title}
            </span>
            <PriorityMark priority={task.priority} />
            {task.dueDate && !task.completed && (
              <span
                title={`Fecha límite: ${formatDueDate(task.dueDate)}`}
                className={cn(
                  'text-xs',
                  overdue ? 'font-semibold text-destructive' : 'text-muted-foreground'
                )}
              >
                {overdue
                  ? `Vencida: ${formatDueDate(task.dueDate)}`
                  : formatDaysLeft(daysUntil(task.dueDate, todayString()))}
              </span>
            )}
            {hasSubtasks && (
              <button
                type="button"
                aria-expanded={!collapsed}
                aria-label={`${collapsed ? 'Mostrar' : 'Ocultar'} las subtareas de «${task.title}»`}
                title={collapsed ? 'Mostrar subtareas' : 'Ocultar subtareas'}
                onClick={() => setCollapsed(task.id, !collapsed)}
                className="-my-0.5 inline-flex items-center gap-0.5 rounded-md py-0.5 pr-0.5 pl-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none motion-reduce:transition-none"
              >
                {doneCount}/{task.subtasks.length}
                <ChevronDown
                  className={cn(
                    'size-3.5 transition-transform duration-200 motion-reduce:transition-none',
                    collapsed && '-rotate-90'
                  )}
                />
              </button>
            )}
          </div>
          {task.note && (
            <p className="mt-0.5 text-xs whitespace-pre-wrap break-words text-muted-foreground">
              {task.note}
            </p>
          )}
        </div>
        {/* Los iconos solo aparecen al pasar el cursor por la tarea (o al navegar con teclado). */}
        <div className={HOVER_ACTIONS}>
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            aria-label={`Añadir subtarea a «${task.title}»`}
            title="Añadir subtarea"
            onClick={() => {
              if (collapsed) setCollapsed(task.id, false)
              setAddingSubtask(true)
            }}
          >
            <ListPlus className="size-4" />
          </Button>
          <RowMenu
            label={`la tarea «${task.title}»`}
            onEdit={() => setEditing(true)}
            onDelete={() => setDeleting(true)}
          />
        </div>
      </div>

      {(hasSubtasks || addingSubtask) && (
        <div
          className={cn(
            'grid transition-[grid-template-rows,opacity] duration-200 motion-reduce:transition-none',
            collapsed ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100'
          )}
          // Plegadas, las subtareas no reciben foco ni clics.
          inert={collapsed}
        >
          <div className="min-h-0 overflow-hidden">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleSubtaskDragEnd}
            >
              <SortableContext items={subtaskIds} strategy={verticalListSortingStrategy}>
                <ul className="ml-6 grid gap-1 border-l pl-3">
                  {task.subtasks.map((sub) => (
                    <SortableSubtask key={sub.id} task={task} subtask={sub} overdue={overdue} />
                  ))}
                  {addingSubtask && (
                    <li>
                      <QuickAdd
                        autoFocus
                        label={`Nueva subtarea de «${task.title}»`}
                        placeholder="Nueva subtarea"
                        onAdd={(title) => addSubtask(task.id, title)}
                        onCancel={() => setAddingSubtask(false)}
                      />
                    </li>
                  )}
                </ul>
              </SortableContext>
            </DndContext>
          </div>
        </div>
      )}

      <ItemDialog
        kind="tarea"
        initial={{
          title: task.title,
          note: task.note ?? '',
          priority: task.priority,
          dueDate: task.dueDate
        }}
        open={editing}
        onOpenChange={setEditing}
        onSave={(values) => updateTask(task.id, values)}
      />
      <ConfirmDialog
        open={deleting}
        title={`¿Borrar la tarea «${task.title}»?`}
        description={
          hasSubtasks
            ? `Se borrarán también sus ${task.subtasks.length} subtareas. Esta acción no se puede deshacer.`
            : 'Esta acción no se puede deshacer.'
        }
        confirmLabel="Borrar tarea"
        onCancel={() => setDeleting(false)}
        onConfirm={() => {
          removeTask(task.id)
          setDeleting(false)
        }}
      />
    </li>
  )
}
