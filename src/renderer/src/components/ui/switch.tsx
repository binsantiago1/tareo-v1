import { cn } from '@renderer/lib/utils'

interface Props {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  /** Nombre accesible del interruptor. */
  label: string
  /** Icono que se muestra dentro de la perilla. */
  icon?: React.ReactNode
}

/** Interruptor accesible (role="switch"): se activa con clic, espacio o Enter. */
export function Switch({ checked, onCheckedChange, label, icon }: Props): React.JSX.Element {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border border-input transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card focus-visible:outline-none motion-reduce:transition-none',
        checked ? 'bg-primary' : 'bg-muted'
      )}
    >
      <span
        className={cn(
          'pointer-events-none flex size-5 items-center justify-center rounded-full bg-card text-foreground shadow transition-transform motion-reduce:transition-none',
          checked ? 'translate-x-[1.35rem]' : 'translate-x-0.5'
        )}
      >
        {icon}
      </span>
    </button>
  )
}
