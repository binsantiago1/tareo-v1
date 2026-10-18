import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import { PostIt } from '@renderer/components/PostIt'
import type { Area, Task } from '../../../shared/types'

interface Props {
  area: Area
  tasks: Task[]
  onEdit: () => void
  onDelete: () => void
}

/** Post-it que se puede mover arrastrándolo (vista Lista). */
export function SortablePostIt({ area, tasks, onEdit, onDelete }: Props): React.JSX.Element {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: area.id })

  return (
    <PostIt
      area={area}
      tasks={tasks}
      onEdit={onEdit}
      onDelete={onDelete}
      drag={{
        setNodeRef,
        isDragging,
        style: { transform: CSS.Translate.toString(transform), transition },
        handle: (
          <button
            type="button"
            ref={setActivatorNodeRef}
            className="mt-1 shrink-0 cursor-grab touch-none rounded text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:cursor-grabbing"
            aria-label={`Mover el post-it ${area.name}`}
            title="Arrastrar para mover el post-it"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="size-5" />
          </button>
        )
      }}
    />
  )
}
