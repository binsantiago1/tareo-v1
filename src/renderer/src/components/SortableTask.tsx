import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { TaskItem } from '@renderer/components/TaskItem'
import type { Task } from '../../../shared/types'

/** Tarea pendiente que se puede mover de sitio manteniendo pulsado el clic. */
export function SortableTask({ task }: { task: Task }): React.JSX.Element {
  const { listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id })

  return (
    <TaskItem
      task={task}
      drag={{
        setNodeRef,
        isDragging,
        listeners,
        style: { transform: CSS.Translate.toString(transform), transition }
      }}
    />
  )
}
