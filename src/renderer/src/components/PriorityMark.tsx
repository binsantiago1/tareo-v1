import { PRIORITY_LABELS } from '@renderer/lib/priority'
import { cn } from '@renderer/lib/utils'
import type { Priority } from '../../../shared/types'

const STYLES: Record<Priority, string> = {
  0: '',
  // ! y !! se ven igual (contorno neutro); !!! lleva el contenedor relleno de rojo.
  1: 'border-border text-foreground',
  2: 'border-border text-foreground',
  3: 'border-transparent bg-urgent text-urgent-foreground ring-1 ring-white/50'
}

/** Muestra !, !! o !!! (nada si no hay prioridad). */
export function PriorityMark({ priority }: { priority: Priority }): React.JSX.Element | null {
  if (priority === 0) return null
  return (
    <span
      title={PRIORITY_LABELS[priority]}
      aria-label={PRIORITY_LABELS[priority]}
      className={cn('shrink-0 rounded border px-1 text-xs leading-5 font-bold', STYLES[priority])}
    >
      {'!'.repeat(priority)}
    </span>
  )
}
