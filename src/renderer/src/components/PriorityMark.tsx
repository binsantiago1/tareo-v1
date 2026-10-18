import { PRIORITY_LABELS } from '@renderer/lib/priority'
import { cn } from '@renderer/lib/utils'
import type { Priority } from '../../../shared/types'

const STYLES: Record<Priority, string> = {
  0: '',
  1: 'border-border text-foreground',
  2: 'border-destructive text-destructive',
  3: 'border-destructive bg-destructive text-destructive-foreground'
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
