import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import { TaskItem } from '@renderer/components/TaskItem'
import type { Task } from '../../../shared/types'

/** Tarea pendiente que se puede arrastrar (con ratón o con teclado: espacio y flechas). */
export function SortableTask({ task }: { task: Task }): React.JSX.Element {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: task.id })

  return (
    <TaskItem
      task={task}
      drag={{
        setNodeRef,
        isDragging,
        style: { transform: CSS.Translate.toString(transform), transition },
        handle: (
          <button
            type="button"
            ref={setActivatorNodeRef}
            className="mt-0.5 w-5 shrink-0 cursor-grab touch-none rounded text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:cursor-grabbing"
            aria-label={`Arrastrar «${task.title}» para cambiar su orden`}
            title="Arrastrar para reordenar"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="size-4" />
          </button>
        )
      }}
    />
  )
}
