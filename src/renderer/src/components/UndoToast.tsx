import { X } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { cn } from '@renderer/lib/utils'
import { useDataStore } from '@renderer/store/useDataStore'

interface ToastProps {
  message: string
  leaving: boolean
  onUndo: () => void
  onClose: () => void
}

/** Aviso con botón "Deshacer". Aparece con una animación y se va con otra (`leaving`). */
function Toast({ message, leaving, onUndo, onClose }: ToastProps): React.JSX.Element {
  return (
    <div
      className={cn(
        'toast-in flex max-w-[90vw] items-center gap-3 rounded-lg border bg-card px-4 py-3 text-sm shadow-lg transition-[opacity,transform] duration-300 motion-reduce:transition-none',
        leaving && 'translate-y-2 opacity-0'
      )}
    >
      <span className="min-w-0 break-words">{message}</span>
      <Button size="sm" variant="outline" onClick={onUndo}>
        Deshacer
      </Button>
      <Button
        size="icon"
        variant="ghost"
        className="size-7"
        aria-label="Cerrar aviso"
        onClick={onClose}
      >
        <X className="size-4" />
      </Button>
    </div>
  )
}

/**
 * Avisos de abajo al centro: tarea completada y área borrada. Los tiempos y la desaparición
 * (a la vez que la tarea) los controla el almacén de datos.
 */
export function UndoToast(): React.JSX.Element | null {
  const undo = useDataStore((s) => s.undo)
  const leavingTasks = useDataStore((s) => s.leaving)
  const undoCompletion = useDataStore((s) => s.undoCompletion)
  const dismissUndo = useDataStore((s) => s.dismissUndo)
  const areaUndo = useDataStore((s) => s.areaUndo)
  const areaUndoLeaving = useDataStore((s) => s.areaUndoLeaving)
  const undoAreaDelete = useDataStore((s) => s.undoAreaDelete)
  const dismissAreaUndo = useDataStore((s) => s.dismissAreaUndo)

  if (!undo && !areaUndo) return null

  const taskCount = areaUndo?.tasks.length ?? 0

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 flex-col items-center gap-2"
    >
      {areaUndo && (
        <Toast
          key={areaUndo.key}
          message={`Área «${areaUndo.area.name}» borrada${
            taskCount > 0 ? ` con ${taskCount} ${taskCount === 1 ? 'tarea' : 'tareas'}` : ''
          }.`}
          leaving={areaUndoLeaving}
          onUndo={undoAreaDelete}
          onClose={dismissAreaUndo}
        />
      )}
      {undo && (
        <Toast
          key={undo.key}
          message={`«${undo.title}» completada. Pasará al Archivo.`}
          leaving={leavingTasks[undo.taskId] === true}
          onUndo={undoCompletion}
          onClose={dismissUndo}
        />
      )}
    </div>
  )
}
