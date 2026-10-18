import { useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle
} from '@renderer/components/ui/dialog'
import { Input, Textarea } from '@renderer/components/ui/input'
import { PRIORITY_LABELS } from '@renderer/lib/priority'
import type { DateOnly, Priority } from '../../../shared/types'

export interface ItemValues {
  title: string
  note: string
  priority: Priority
  dueDate?: DateOnly
}

interface Props {
  /** "tarea" muestra además prioridad y fecha límite; "subtarea" solo título y nota. */
  kind: 'tarea' | 'subtarea'
  initial: ItemValues
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (values: ItemValues) => void
}

const PRIORITIES: Priority[] = [0, 1, 2, 3]
const PRIORITY_BUTTON: Record<Priority, string> = { 0: 'Ninguna', 1: '!', 2: '!!', 3: '!!!' }

export function ItemDialog({
  kind,
  initial,
  open,
  onOpenChange,
  onSave
}: Props): React.JSX.Element {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {/* Se monta al abrir, así siempre empieza con los valores actuales. */}
        <ItemForm
          kind={kind}
          initial={initial}
          onCancel={() => onOpenChange(false)}
          onSave={(values) => {
            onSave(values)
            onOpenChange(false)
          }}
        />
      </DialogContent>
    </Dialog>
  )
}

function ItemForm({
  kind,
  initial,
  onCancel,
  onSave
}: {
  kind: 'tarea' | 'subtarea'
  initial: ItemValues
  onCancel: () => void
  onSave: (values: ItemValues) => void
}): React.JSX.Element {
  const [title, setTitle] = useState(initial.title)
  const [note, setNote] = useState(initial.note)
  const [priority, setPriority] = useState<Priority>(initial.priority)
  const [dueDate, setDueDate] = useState(initial.dueDate ?? '')
  const trimmed = title.trim()

  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        if (!trimmed) return
        onSave({
          title: trimmed,
          note: note.trim(),
          priority: kind === 'tarea' ? priority : 0,
          dueDate: kind === 'tarea' && dueDate ? dueDate : undefined
        })
      }}
    >
      <div className="grid gap-1">
        <DialogTitle>{kind === 'tarea' ? 'Editar tarea' : 'Editar subtarea'}</DialogTitle>
        <DialogDescription>
          {kind === 'tarea'
            ? 'Cambia el título, la nota, la prioridad o la fecha límite.'
            : 'Cambia el título o la nota de la subtarea.'}
        </DialogDescription>
      </div>

      <label className="grid gap-1 text-sm font-medium">
        Título
        <Input autoFocus value={title} maxLength={200} onChange={(e) => setTitle(e.target.value)} />
      </label>

      <label className="grid gap-1 text-sm font-medium">
        Nota (opcional)
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} />
      </label>

      {kind === 'tarea' && (
        <>
          <div className="grid gap-1">
            <span id="prioridad-etiqueta" className="text-sm font-medium">
              Prioridad
            </span>
            <div role="group" aria-labelledby="prioridad-etiqueta" className="flex gap-2">
              {PRIORITIES.map((p) => (
                <Button
                  key={p}
                  type="button"
                  size="sm"
                  variant={priority === p ? 'default' : 'outline'}
                  aria-pressed={priority === p}
                  aria-label={PRIORITY_LABELS[p]}
                  onClick={() => setPriority(p)}
                >
                  {PRIORITY_BUTTON[p]}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid gap-1">
            <label htmlFor="fecha-limite" className="text-sm font-medium">
              Fecha límite (opcional)
            </label>
            <div className="flex gap-2">
              <Input
                id="fecha-limite"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={!dueDate}
                aria-label="Quitar fecha"
                title="Quitar fecha"
                onClick={() => setDueDate('')}
              >
                <X className="size-4" />
              </Button>
            </div>
          </div>
        </>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={!trimmed}>
          Guardar
        </Button>
      </div>
    </form>
  )
}
