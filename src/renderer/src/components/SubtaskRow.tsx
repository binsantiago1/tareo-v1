import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ConfirmDialog } from '@renderer/components/ConfirmDialog'
import { ItemDialog } from '@renderer/components/ItemDialog'
import { RowMenu } from '@renderer/components/RowMenu'
import { HOVER_ACTIONS } from '@renderer/lib/hoverActions'
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
  drag?: RowDrag
}

/** Una subtarea: casilla, texto y menú de tres puntos (que aparece al pasar el cursor). */
export function SubtaskRow({ task, subtask, drag }: Props): React.JSX.Element {
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
      <input
        type="checkbox"
        className="mt-1 size-4 shrink-0 accent-primary"
        checked={subtask.completed}
        aria-label={`Completar subtarea «${subtask.title}»`}
        onChange={() => toggleSubtask(task.id, subtask.id)}
      />
      <div className="min-w-0 flex-1 text-sm">
        <span
          className={cn('break-words', subtask.completed && 'text-muted-foreground line-through')}
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
export function SortableSubtask({ task, subtask }: Props): React.JSX.Element {
  const { listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: subtask.id
  })
  return (
    <SubtaskRow
      task={task}
      subtask={subtask}
      drag={{
        setNodeRef,
        isDragging,
        listeners,
        style: { transform: CSS.Translate.toString(transform), transition }
      }}
    />
  )
}
