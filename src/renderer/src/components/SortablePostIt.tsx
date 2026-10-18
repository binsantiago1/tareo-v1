import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { PostIt } from '@renderer/components/PostIt'
import type { Area, Task } from '../../../shared/types'

interface Props {
  area: Area
  tasks: Task[]
  onEdit: () => void
  onDelete: () => void
}

const TILTS = ['-0.5deg', '0.4deg', '-0.2deg', '0.55deg']

/** Post-it que se puede mover de sitio manteniendo pulsado el clic (vista Lista). */
export function SortablePostIt({ area, tasks, onEdit, onDelete }: Props): React.JSX.Element {
  const { listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: area.id
  })

  return (
    <PostIt
      area={area}
      tasks={tasks}
      onEdit={onEdit}
      onDelete={onDelete}
      drag={{
        setNodeRef,
        isDragging,
        listeners,
        style: {
          transform: CSS.Translate.toString(transform),
          transition,
          // Cada post-it va ligeramente torcido, como pegado a mano; al arrastrarlo se endereza.
          rotate: isDragging ? '0deg' : TILTS[area.order % TILTS.length]
        }
      }}
    />
  )
}
