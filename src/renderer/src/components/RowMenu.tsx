import { MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@renderer/components/ui/dropdown-menu'
import { cn } from '@renderer/lib/utils'

interface Props {
  /** Qué es (para lectores de pantalla), por ejemplo «Comprar pan». */
  label: string
  onEdit: () => void
  onDelete: () => void
  className?: string
}

/** Icono de tres puntos verticales con "Editar" y "Borrar". */
export function RowMenu({ label, onEdit, onDelete, className }: Props): React.JSX.Element {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn('size-7', className)}
          aria-label={`Opciones de ${label}`}
          title="Opciones"
        >
          <MoreVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onSelect={onEdit}>
          <Pencil className="size-4" />
          Editar
        </DropdownMenuItem>
        <DropdownMenuItem className="text-destructive" onSelect={onDelete}>
          <Trash2 className="size-4" />
          Borrar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
