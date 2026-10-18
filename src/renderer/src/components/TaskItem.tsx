import { useState } from 'react'
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { ListPlus } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { ConfirmDialog } from '@renderer/components/ConfirmDialog'
import { ItemDialog } from '@renderer/components/ItemDialog'
import { PriorityMark } from '@renderer/components/PriorityMark'
import { QuickAdd } from '@renderer/components/QuickAdd'
import { RowMenu } from '@renderer/components/RowMenu'
import { SortableSubtask } from '@renderer/components/SubtaskRow'
import type { RowDrag } from '@renderer/components/SubtaskRow'
import { formatDueDate, todayString } from '@renderer/lib/dates'
import { useLongPressSensors } from '@renderer/lib/dnd'
import { HOVER_ACTIONS } from '@renderer/lib/hoverActions'
import { cn } from '@renderer/lib/utils'
import { useDataStore } from '@renderer/store/useDataStore'
import { isOverdue } from '../../../shared/taskRules'
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
  const sensors = useLongPressSensors()
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [addingSubtask, setAddingSubtask] = useState(false)

  const hasSubtasks = task.subtasks.length > 0
  const doneCount = task.subtasks.filter((s) => s.completed).length
  const overdue = !task.completed && isOverdue(task.dueDate, todayString())
  const subtaskIds = task.subtasks.map((s) => s.id)

  const handleSubtaskDragEnd = ({ active, over }: DragEndEvent): void => {
    if (!over || active.id === over.id) return
    const from = subtaskIds.indexOf(String(active.id))
    const to = subtaskIds.indexOf(String(over.id))
    if (from === -1 || to === -1) return
    reorderSubtasks(task.id, arrayMove(subtaskIds, from, to))
  }

  return (
    <li
      ref={drag?.setNodeRef}
      style={drag?.style}
      {...drag?.listeners}
      className={cn('grid gap-1 bg-card', drag?.isDragging && 'relative z-10 rounded shadow-md')}
    >
      <div className="group/zone flex items-start gap-2">
        <input
          type="checkbox"
          className="mt-1 size-4 shrink-0 accent-primary"
          checked={task.completed}
          disabled={hasSubtasks}
          aria-label={`Completar «${task.title}»`}
          title={hasSubtasks ? 'Se completa sola cuando terminas todas las subtareas' : undefined}
          onChange={() => toggleTask(task.id)}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span
              className={cn('break-words', task.completed && 'text-muted-foreground line-through')}
            >
              {task.title}
            </span>
            <PriorityMark priority={task.priority} />
            {hasSubtasks && (
              <span className="text-xs text-muted-foreground">
                {doneCount}/{task.subtasks.length}
              </span>
            )}
            {task.dueDate && (
              <span
                className={cn(
                  'text-xs',
                  overdue ? 'font-semibold text-destructive' : 'text-muted-foreground'
                )}
              >
                {overdue ? 'Vencida: ' : 'Vence: '}
                {formatDueDate(task.dueDate)}
              </span>
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
            onClick={() => setAddingSubtask(true)}
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
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleSubtaskDragEnd}
        >
          <SortableContext items={subtaskIds} strategy={verticalListSortingStrategy}>
            <ul className="ml-6 grid gap-1 border-l pl-3">
              {task.subtasks.map((sub) => (
                <SortableSubtask key={sub.id} task={task} subtask={sub} />
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
