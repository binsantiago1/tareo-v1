import { useEffect } from 'react'
import { X } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { useDataStore } from '@renderer/store/useDataStore'

const VISIBLE_MS = 6000

/** Aviso temporal que aparece al completar una tarea (pasa al Archivo) con botón "Deshacer". */
export function UndoToast(): React.JSX.Element | null {
  const undo = useDataStore((s) => s.undo)
  const undoCompletion = useDataStore((s) => s.undoCompletion)
  const dismissUndo = useDataStore((s) => s.dismissUndo)
  const key = undo?.key

  // Cada tarea completada reinicia el reloj.
  useEffect(() => {
    if (key === undefined) return
    const timer = setTimeout(dismissUndo, VISIBLE_MS)
    return () => clearTimeout(timer)
  }, [key, dismissUndo])

  if (!undo) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-1/2 z-40 flex max-w-[90vw] -translate-x-1/2 items-center gap-3 rounded-lg border bg-card px-4 py-3 text-sm shadow-lg"
    >
      <span className="min-w-0 break-words">«{undo.title}» completada y movida al Archivo.</span>
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
