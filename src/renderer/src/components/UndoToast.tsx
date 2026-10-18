import { X } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { useDataStore } from '@renderer/store/useDataStore'

/**
 * Aviso con botón "Deshacer" al completar una tarea. Desaparece a la vez que la tarea
 * (el tiempo lo controla el almacén de datos).
 */
export function UndoToast(): React.JSX.Element | null {
  const undo = useDataStore((s) => s.undo)
  const undoCompletion = useDataStore((s) => s.undoCompletion)
  const dismissUndo = useDataStore((s) => s.dismissUndo)

  if (!undo) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-1/2 z-40 flex max-w-[90vw] -translate-x-1/2 items-center gap-3 rounded-lg border bg-card px-4 py-3 text-sm shadow-lg"
    >
      <span className="min-w-0 break-words">«{undo.title}» completada. Pasará al Archivo.</span>
      <Button size="sm" variant="outline" onClick={undoCompletion}>
        Deshacer
      </Button>
      <Button
        size="icon"
        variant="ghost"
        className="size-7"
        aria-label="Cerrar aviso"
        onClick={dismissUndo}
      >
        <X className="size-4" />
      </Button>
    </div>
  )
}
