import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { QuickAdd } from '@renderer/components/QuickAdd'
import { TaskItem } from '@renderer/components/TaskItem'
import { useDataStore } from '@renderer/store/useDataStore'
import type { Area, Task } from '../../../shared/types'

interface Props {
  area: Area
  tasks: Task[]
  onEdit: () => void
  onDelete: () => void
}

export function PostIt({ area, tasks, onEdit, onDelete }: Props): React.JSX.Element {
  const addTask = useDataStore((s) => s.addTask)

  // Hasta la Fase 5 (orden) las tareas van por orden de creación, con las completadas al final.
  const sorted = [...tasks].sort(
    (a, b) => Number(a.completed) - Number(b.completed) || a.personalOrder - b.personalOrder
  )

  return (
    <article
      aria-label={`Área ${area.name}`}
      className="flex min-h-64 flex-col gap-3 rounded-lg border bg-card p-4 text-card-foreground shadow-sm"
    >
      <header className="flex items-start justify-between gap-2">
        <h2 className="text-2xl leading-tight font-semibold break-words">{area.name}</h2>
        <div className="flex shrink-0">
          <Button variant="ghost" size="icon" aria-label={`Editar ${area.name}`} onClick={onEdit}>
            <Pencil className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" aria-label={`Borrar ${area.name}`} onClick={onDelete}>
            <Trash2 className="size-4" />
          </Button>
        </div>
      </header>
      {area.note && (
        <p className="text-sm whitespace-pre-wrap break-words text-muted-foreground">{area.note}</p>
      )}

      {sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Sin tareas. Escribe una abajo y pulsa Enter.
        </p>
      ) : (
        <ul className="grid gap-2 text-sm">
          {sorted.map((task) => (
            <TaskItem key={task.id} task={task} />
          ))}
        </ul>
      )}

      <div className="mt-auto pt-2">
        <QuickAdd
          label={`Nueva tarea en ${area.name}`}
          placeholder="Nueva tarea y Enter"
          onAdd={(title) => addTask(area.id, title)}
        />
      </div>
    </article>
  )
}
