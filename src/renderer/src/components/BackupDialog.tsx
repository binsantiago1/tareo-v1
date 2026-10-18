import { useState } from 'react'
import { Download, Upload } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle
} from '@renderer/components/ui/dialog'
import { ConfirmDialog } from '@renderer/components/ConfirmDialog'
import { useDataStore } from '@renderer/store/useDataStore'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Exportar e importar copias de seguridad (un archivo .json que tú guardas donde quieras). */
export function BackupDialog({ open, onOpenChange }: Props): React.JSX.Element {
  const data = useDataStore((s) => s.data)
  const replaceData = useDataStore((s) => s.replaceData)
  const [confirmingImport, setConfirmingImport] = useState(false)
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null)
  const [busy, setBusy] = useState(false)

  const exportBackup = async (): Promise<void> => {
    setBusy(true)
    const result = await window.api.exportBackup(data)
    setBusy(false)
    if (result.status === 'ok')
      setMessage({ text: `Copia guardada en: ${result.path}`, error: false })
    else if (result.status === 'error')
      setMessage({ text: `No se pudo exportar: ${result.message}`, error: true })
  }

  const importBackup = async (): Promise<void> => {
    setBusy(true)
    const result = await window.api.importBackup()
    setBusy(false)
    if (result.status === 'ok') {
      replaceData(result.data)
      setMessage({
        text: `Copia importada: ${result.data.areas.length} áreas y ${result.data.tasks.length} tareas.`,
        error: false
      })
    } else if (result.status === 'error') {
      setMessage({ text: `No se pudo importar: ${result.message}`, error: true })
    }
  }

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(o) => {
          if (!o) setMessage(null)
          onOpenChange(o)
        }}
      >
        <DialogContent>
          <div className="grid gap-1">
            <DialogTitle>Copias de seguridad</DialogTitle>
            <DialogDescription>
              Guarda todos tus datos en un archivo para tenerlos a salvo, o recupéralos desde uno.
            </DialogDescription>
          </div>
          <div className="grid gap-2">
            <Button variant="outline" disabled={busy} onClick={() => void exportBackup()}>
              <Download className="size-4" />
              Exportar copia de seguridad
            </Button>
            <Button variant="outline" disabled={busy} onClick={() => setConfirmingImport(true)}>
              <Upload className="size-4" />
              Importar copia de seguridad
            </Button>
          </div>
          <div role="status" aria-live="polite" className="min-h-5 text-sm">
            {message && (
              <p className={message.error ? 'text-destructive' : 'text-muted-foreground'}>
                {message.text}
              </p>
            )}
          </div>
          <div className="flex justify-end">
            <Button onClick={() => onOpenChange(false)}>Cerrar</Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmingImport}
        title="¿Sustituir tus datos por la copia?"
        description="Importar una copia reemplaza todo lo que tienes ahora (áreas, tareas y Archivo). Antes de reemplazarlo se guarda una copia de tus datos actuales en la carpeta de datos de la app, por si te arrepientes."
        confirmLabel="Elegir archivo y sustituir"
        onCancel={() => setConfirmingImport(false)}
        onConfirm={() => {
          setConfirmingImport(false)
          void importBackup()
        }}
      />
    </>
  )
}
