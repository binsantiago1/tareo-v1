import { noteStyle } from '@renderer/lib/noteStyle'
import { cn } from '@renderer/lib/utils'
import { NOTE_COLORS, noteColorOf } from '../../../shared/palette'

interface Props {
  value: string
  onChange: (colorId: string) => void
}

/** Las 10 combinaciones de papel y letra. Funciona con ratón y con las flechas del teclado. */
export function ColorPicker({ value, onChange }: Props): React.JSX.Element {
  const selected = noteColorOf(value)

  return (
    <div className="grid gap-2">
      <div className="flex items-baseline justify-between">
        <span id="color-etiqueta" className="text-sm font-medium">
          Color del post-it
        </span>
        <span className="text-sm text-muted-foreground">{selected.label}</span>
      </div>
      <div
        role="radiogroup"
        aria-labelledby="color-etiqueta"
        className="grid grid-cols-5 gap-2"
        onKeyDown={(e) => {
          const index = NOTE_COLORS.findIndex((c) => c.id === selected.id)
          const step =
            e.key === 'ArrowRight' || e.key === 'ArrowDown'
              ? 1
              : e.key === 'ArrowLeft' || e.key === 'ArrowUp'
                ? -1
                : 0
          if (step === 0) return
          e.preventDefault()
          const next = NOTE_COLORS[(index + step + NOTE_COLORS.length) % NOTE_COLORS.length]
          onChange(next.id)
          const buttons = e.currentTarget.querySelectorAll<HTMLButtonElement>('button')
          buttons[NOTE_COLORS.indexOf(next)]?.focus()
        }}
      >
        {NOTE_COLORS.map((color) => {
          const active = color.id === selected.id
          return (
            <button
              key={color.id}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={color.label}
              title={color.label}
              tabIndex={active ? 0 : -1}
              style={noteStyle(color.id)}
              onClick={() => onChange(color.id)}
              className={cn(
                'note flex h-11 items-center justify-center rounded-md border border-black/15 text-lg font-bold shadow-sm transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card focus-visible:outline-none motion-reduce:transition-none dark:border-white/20',
                active && 'ring-2 ring-foreground ring-offset-2 ring-offset-card'
              )}
            >
              {/* Muestra la combinación de fondo y letra. */}
              <span aria-hidden="true">Aa</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
