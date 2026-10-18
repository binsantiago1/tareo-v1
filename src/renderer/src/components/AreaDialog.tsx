import { useState } from 'react'
import { Button } from '@renderer/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle
} from '@renderer/components/ui/dialog'
import { ColorPicker } from '@renderer/components/ColorPicker'
import { Input, Textarea } from '@renderer/components/ui/input'
import { noteColorOf } from '../../../shared/palette'
import type { Area } from '../../../shared/types'

interface Values {
  name: string
  note: string
  color: string
}

interface Props {
  /** Si se pasa un área, el diálogo edita; si no, crea una nueva. */
  area?: Area
  /** Color con el que empieza una área nueva. */
  defaultColor: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (values: Values) => void
}

export function AreaDialog({
  area,
  defaultColor,
  open,
  onOpenChange,
  onSave
}: Props): React.JSX.Element {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {/* El formulario se monta al abrir, así siempre empieza con los valores actuales. */}
        <AreaForm
          area={area}
          defaultColor={defaultColor}
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

function AreaForm({
  area,
  defaultColor,
  onCancel,
  onSave
}: {
  area?: Area
  defaultColor: string
  onCancel: () => void
  onSave: (values: Values) => void
}): React.JSX.Element {
  const [name, setName] = useState(area?.name ?? '')
  const [note, setNote] = useState(area?.note ?? '')
  const [color, setColor] = useState(noteColorOf(area ? area.color : defaultColor).id)
  const trimmed = name.trim()

  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        if (trimmed) onSave({ name: trimmed, note: note.trim(), color })
      }}
    >
      <div className="grid gap-1">
        <DialogTitle>{area ? 'Editar área' : 'Nueva área'}</DialogTitle>
        <DialogDescription>
          {area
            ? 'Cambia el nombre, la nota o el color del área.'
            : 'Cada área es un post-it con sus tareas.'}
        </DialogDescription>
      </div>
      <label className="grid gap-1 text-sm font-medium">
        Nombre
        <Input
          autoFocus
          value={name}
          maxLength={60}
          placeholder="Por ejemplo: Casa, Trabajo, Estudios"
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      <label className="grid gap-1 text-sm font-medium">
        Nota (opcional)
        <Textarea
          value={note}
          placeholder="Algo que quieras recordar sobre esta área"
          onChange={(e) => setNote(e.target.value)}
        />
      </label>
      <ColorPicker value={color} onChange={setColor} />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={!trimmed}>
          {area ? 'Guardar' : 'Crear área'}
        </Button>
      </div>
    </form>
  )
}
