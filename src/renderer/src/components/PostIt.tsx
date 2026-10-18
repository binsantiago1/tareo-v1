import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import type { Area } from '../../../shared/types'

interface Props {
  area: Area
  onEdit: () => void
  onDelete: () => void
}

export function PostIt({ area, onEdit, onDelete }: Props): React.JSX.Element {
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
      <p className="mt-auto text-sm text-muted-foreground">Aquí irán las tareas.</p>
    </article>
  )
}
