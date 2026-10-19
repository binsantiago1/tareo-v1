import { useState } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { PostIt } from '@renderer/components/PostIt'
import { useDataStore } from '@renderer/store/useDataStore'
import { NOTE_WIDTH } from '../../../shared/layout'
import type { Area, Task } from '../../../shared/types'

interface Props {
  area: Area
  tasks: Task[]
  onEdit: () => void
  onDelete: () => void
}

const TILTS = ['-0.5deg', '0.4deg', '-0.2deg', '0.55deg']

/** Post-it del tablero: se puede llevar a cualquier columna y altura manteniendo pulsado. */
export function PlacedPostIt({ area, tasks, onEdit, onDelete }: Props): React.JSX.Element {
  const setAreaSize = useDataStore((state) => state.setAreaSize)
  // Mientras se arrastra un asa, el tamaño se ve al momento pero solo se guarda al soltar.
  const [live, setLive] = useState<{ width: number; height: number } | null>(null)
  const { listeners, setNodeRef, transform, isDragging } = useDraggable({ id: area.id })

  return (
    <PostIt
      area={area}
      tasks={tasks}
      onEdit={onEdit}
      onDelete={onDelete}
      frame={{
        width: live?.width ?? area.width ?? NOTE_WIDTH,
        height: live?.height ?? area.height
      }}
      resize={{
        min: { width: 200, height: 120 },
        max: { width: 1400, height: 2400 },
        onResize: (size, final) => {
          if (final) {
            setLive(null)
            setAreaSize(area.id, size)
          } else {
            setLive(size)
          }
        },
        onReset: () => {
          setLive(null)
          setAreaSize(area.id, {})
        }
      }}
      drag={{
        setNodeRef,
        isDragging,
        listeners,
        style: {
          zIndex: isDragging ? 20 : 1,
          transform: CSS.Translate.toString(transform),
          // Cada post-it va ligeramente torcido, como pegado a mano; al arrastrarlo se endereza.
          rotate: isDragging ? '0deg' : TILTS[area.order % TILTS.length]
        }
      }}
    />
  )
}
