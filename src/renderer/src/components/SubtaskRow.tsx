import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ConfirmDialog } from '@renderer/components/ConfirmDialog'
import { Checkbox } from '@renderer/components/ui/checkbox'
import { ItemDialog } from '@renderer/components/ItemDialog'
import { RowMenu } from '@renderer/components/RowMenu'
import { HOVER_ACTIONS } from '@renderer/lib/hoverActions'
import { OVERDUE_NAME } from '@renderer/lib/urgency'
import { cn } from '@renderer/lib/utils'
import { useDataStore } from '@renderer/store/useDataStore'
import type { Subtask, Task } from '../../../shared/types'

/** Piezas para poder arrastrar la fila manteniendo pulsado el clic. */
export interface RowDrag {
  setNodeRef: (node: HTMLElement | null) => void
  style: React.CSSProperties
  isDragging: boolean
  listeners: React.HTMLAttributes<HTMLElement> | undefined
}

interface Props {
  task: Task
  subtask: Subtask
  /** La tarea está vencida: sus subtareas pendientes también se ven en rojo. */
  overdue?: boolean
  drag?: RowDrag
}

/** Una subtarea: casilla, texto y menú de tres puntos (que aparece al pasar el cursor). */
export function SubtaskRow({ task, subtask, overdue, drag }: Props): React.JSX.Element {
  const toggleSubtask = useDataStore((s) => s.toggleSubtask)
  const updateSubtask = useDataStore((s) => s.updateSubtask)
  const removeSubtask = useDataStore((s) => s.removeSubtask)
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)

  return (
    <li
      ref={drag?.setNodeRef}
      style={drag?.style}
      {...drag?.listeners}
      className={cn(
        'group/zone flex items-start gap-2 bg-card',
        drag?.isDragging && 'relative z-10 rounded shadow-md'
      )}
    >
      <Checkbox
        checked={subtask.completed}
        aria-label={`Completar subtarea «${subtask.title}»`}
        onChange={() => toggleSubtask(task.id, subtask.id)}
      />
      <div className="min-w-0 flex-1 text-sm">
        <span
          className={cn(
            'strike break-words',
            subtask.completed && 'strike-on text-muted-foreground',
            overdue && !subtask.completed && OVERDUE_NAME
          )}
        >
          {subtask.title}
        </span>
        {subtask.note && (
          <p className="text-xs whitespace-pre-wrap break-words text-muted-foreground">
            {subtask.note}
          </p>
        )}
      </div>
      <div className={HOVER_ACTIONS}>
        <RowMenu
          label={`la subtarea «${subtask.title}»`}
          className="size-6"
          onEdit={() => setEditing(true)}
          onDelete={() => setDeleting(true)}
        />
      </div>

      <ItemDialog
        kind="subtarea"
        initial={{ title: subtask.title, note: subtask.note ?? '', priority: 0 }}
        open={editing}
        onOpenChange={setEditing}
        onSave={({ title, note }) => updateSubtask(task.id, subtask.id, { title, note })}
      />
      <ConfirmDialog
        open={deleting}
        title={`¿Borrar la subtarea «${subtask.title}»?`}
        description="Esta acción no se puede deshacer."
        confirmLabel="Borrar subtarea"
        onCancel={() => setDeleting(false)}
        onConfirm={() => {
          removeSubtask(task.id, subtask.id)
          setDeleting(false)
        }}
      />
    </li>
  )
}

/** Subtarea que se puede mover de sitio manteniendo pulsado el clic. */
export function SortableSubtask({ task, subtask, overdue }: Props): React.JSX.Element {
  const { listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: subtask.id
  })
  return (
    <SubtaskRow
      task={task}
      subtask={subtask}
      overdue={overdue}
      drag={{
        setNodeRef,
        isDragging,
        listeners,
        style: { transform: CSS.Translate.toString(transform), transition }
      }}
    />
  )
}
