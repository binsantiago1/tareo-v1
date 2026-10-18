import { useMemo, useState } from 'react'
import { ArchiveRestore, Trash2 } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { ConfirmDialog } from '@renderer/components/ConfirmDialog'
import { PriorityMark } from '@renderer/components/PriorityMark'
import { formatCompletedDate } from '@renderer/lib/dates'
import { useDataStore } from '@renderer/store/useDataStore'
import type { Task } from '../../../shared/types'

/** Archivo: tareas completadas. Se pueden restaurar o borrar definitivamente. */
export function ArchiveView(): React.JSX.Element {
  const data = useDataStore((s) => s.data)
  const restoreTask = useDataStore((s) => s.restoreTask)
  const removeTask = useDataStore((s) => s.removeTask)
  const [deleting, setDeleting] = useState<Task | null>(null)

  const areaNames = useMemo(() => new Map(data.areas.map((a) => [a.id, a.name])), [data.areas])
  // Las más recientes primero.
  const archived = useMemo(
    () =>
      data.tasks
        .filter((t) => t.completed)
        .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? '')),
    [data.tasks]
  )

  if (archived.length === 0) {
    return (
      <div className="mx-auto mt-16 flex max-w-sm flex-col items-center gap-2 text-center">
        <p className="text-lg font-medium">El Archivo está vacío</p>
        <p className="text-sm text-muted-foreground">
          Cuando completes una tarea, aparecerá aquí. Desde aquí podrás restaurarla o borrarla
          definitivamente.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h2 className="mb-4 text-2xl font-semibold">Archivo</h2>
      <ul className="grid gap-2">
        {archived.map((task) => (
          <li key={task.id} className="flex items-start gap-3 rounded-lg border bg-card p-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="break-words">{task.title}</span>
                <PriorityMark priority={task.priority} />
              </div>
              <p className="text-xs text-muted-foreground">
                {areaNames.get(task.areaId) ?? 'Área desconocida'}
                {task.completedAt && ` · Completada el ${formatCompletedDate(task.completedAt)}`}
                {task.subtasks.length > 0 && ` · ${task.subtasks.length} subtareas`}
              </p>
              {task.note && (
                <p className="mt-1 text-xs whitespace-pre-wrap break-words text-muted-foreground">
                  {task.note}
                </p>
              )}
            </div>
            <div className="flex shrink-0 gap-1">
              <Button variant="outline" size="sm" onClick={() => restoreTask(task.id)}>
                <ArchiveRestore className="size-4" />
                Restaurar
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Borrar definitivamente «${task.title}»`}
                title="Borrar definitivamente"
                onClick={() => setDeleting(task)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <ConfirmDialog
        open={deleting !== null}
        title={`¿Borrar definitivamente «${deleting?.title}»?`}
        description="Se borrará para siempre, con sus subtareas. Esta acción no se puede deshacer."
        confirmLabel="Borrar definitivamente"
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) removeTask(deleting.id)
          setDeleting(null)
        }}
      />
    </div>
  )
}
