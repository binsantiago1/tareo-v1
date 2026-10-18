import { useState } from 'react'
import { ListPlus, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { ConfirmDialog } from '@renderer/components/ConfirmDialog'
import { ItemDialog } from '@renderer/components/ItemDialog'
import { PriorityMark } from '@renderer/components/PriorityMark'
import { QuickAdd } from '@renderer/components/QuickAdd'
import { formatDueDate, todayString } from '@renderer/lib/dates'
import { cn } from '@renderer/lib/utils'
import { useDataStore } from '@renderer/store/useDataStore'
import { isOverdue } from '../../../shared/taskRules'
import type { Subtask, Task } from '../../../shared/types'

export function TaskItem({ task }: { task: Task }): React.JSX.Element {
  const {
    toggleTask,
    updateTask,
    removeTask,
    addSubtask,
    toggleSubtask,
    updateSubtask,
    removeSubtask
  } = useDataStore()
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [addingSubtask, setAddingSubtask] = useState(false)
  const [editingSubtask, setEditingSubtask] = useState<Subtask | null>(null)
  const [deletingSubtask, setDeletingSubtask] = useState<Subtask | null>(null)

  const hasSubtasks = task.subtasks.length > 0
  const doneCount = task.subtasks.filter((s) => s.completed).length
  const overdue = !task.completed && isOverdue(task.dueDate, todayString())

  return (
    <li className="grid gap-1">
      <div className="flex items-start gap-2">
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
        <div className="flex shrink-0">
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
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            aria-label={`Editar «${task.title}»`}
            title="Editar tarea"
            onClick={() => setEditing(true)}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            aria-label={`Borrar «${task.title}»`}
            title="Borrar tarea"
            onClick={() => setDeleting(true)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      {(hasSubtasks || addingSubtask) && (
        <ul className="ml-6 grid gap-1 border-l pl-3">
          {task.subtasks.map((sub) => (
            <li key={sub.id} className="flex items-start gap-2">
              <input
                type="checkbox"
                className="mt-1 size-4 shrink-0 accent-primary"
                checked={sub.completed}
                aria-label={`Completar subtarea «${sub.title}»`}
                onChange={() => toggleSubtask(task.id, sub.id)}
              />
              <div className="min-w-0 flex-1 text-sm">
                <span
                  className={cn(
                    'break-words',
                    sub.completed && 'text-muted-foreground line-through'
                  )}
                >
                  {sub.title}
                </span>
                {sub.note && (
                  <p className="text-xs whitespace-pre-wrap break-words text-muted-foreground">
                    {sub.note}
                  </p>
                )}
              </div>
              <div className="flex shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6"
                  aria-label={`Editar subtarea «${sub.title}»`}
                  title="Editar subtarea"
                  onClick={() => setEditingSubtask(sub)}
                >
                  <Pencil className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6"
                  aria-label={`Borrar subtarea «${sub.title}»`}
                  title="Borrar subtarea"
                  onClick={() => setDeletingSubtask(sub)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </li>
          ))}
          {addingSubtask && (
            <li>
              <QuickAdd
                autoFocus
                label={`Nueva subtarea de «${task.title}»`}
                placeholder="Nueva subtarea y Enter (Esc para cerrar)"
                onAdd={(title) => addSubtask(task.id, title)}
                onCancel={() => setAddingSubtask(false)}
              />
            </li>
          )}
        </ul>
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
      <ItemDialog
        key={editingSubtask?.id}
        kind="subtarea"
        initial={{
          title: editingSubtask?.title ?? '',
          note: editingSubtask?.note ?? '',
          priority: 0
        }}
        open={editingSubtask !== null}
        onOpenChange={(open) => !open && setEditingSubtask(null)}
        onSave={({ title, note }) =>
          editingSubtask && updateSubtask(task.id, editingSubtask.id, { title, note })
        }
      />
      <ConfirmDialog
        open={deletingSubtask !== null}
        title={`¿Borrar la subtarea «${deletingSubtask?.title}»?`}
        description="Esta acción no se puede deshacer."
        confirmLabel="Borrar subtarea"
        onCancel={() => setDeletingSubtask(null)}
        onConfirm={() => {
          if (deletingSubtask) removeSubtask(task.id, deletingSubtask.id)
          setDeletingSubtask(null)
        }}
      />
    </li>
  )
}
