import { CalendarDays, LayoutGrid, List, Plus } from 'lucide-react'
import { SettingsMenu } from '@renderer/components/SettingsMenu'
import { cn } from '@renderer/lib/utils'

export type View = 'lista' | 'cuadricula' | 'calendario'

const VIEWS = [
  { value: 'lista', label: 'Lista', Icon: List },
  { value: 'cuadricula', label: 'Cuadrícula', Icon: LayoutGrid },
  { value: 'calendario', label: 'Calendario', Icon: CalendarDays }
] as const

/** Superficie común de los elementos flotantes: fondo blanco al 70% y sombra suave. */
const SURFACE = 'border bg-card/70 shadow-sm backdrop-blur-sm'

/** Botón de icono pequeño de la barra (75% del tamaño anterior). */
const BAR_BUTTON =
  'flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none motion-reduce:transition-none'

interface Props {
  view: View
  archiveOpen: boolean
  archivedCount: number
  onViewChange: (view: View) => void
  onToggleArchive: () => void
  onOpenBackup: () => void
  onNewArea: () => void
}

/** Cabecera flotante: isla con el icono arriba a la izquierda y una barra de botones a la derecha. */
export function TopBar({
  view,
  archiveOpen,
  archivedCount,
  onViewChange,
  onToggleArchive,
  onOpenBackup,
  onNewArea
}: Props): React.JSX.Element {
  return (
    <header className="flex items-start justify-between gap-3 px-6 pt-4 pb-2">
      {/* Isla: solo el icono; al pasar el cursor se despliega el nombre. */}
      <h1
        className={cn(
          SURFACE,
          'group/brand flex h-8 items-center overflow-hidden rounded-full text-sm font-bold tracking-tight'
        )}
      >
        <span className="flex size-8 shrink-0 items-center justify-center" aria-hidden="true">
          <span
            className="paper block size-4 rotate-[-4deg]"
            style={{ backgroundColor: 'oklch(0.93 0.12 98)' }}
          />
        </span>
        <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-all duration-200 group-hover/brand:max-w-32 group-hover/brand:pr-3 group-hover/brand:opacity-100 motion-reduce:transition-none">
          Pendientes
        </span>
      </h1>

      {/* Una sola barra con tres secciones separadas por una línea vertical. */}
      <div className={cn(SURFACE, 'flex h-8 items-center gap-1 rounded-xl px-1')}>
        {/* 1. Vistas */}
        <div role="group" aria-label="Vista" className="flex items-center gap-0.5">
          {VIEWS.map(({ value, label, Icon }) => {
            const active = !archiveOpen && view === value
            return (
              <button
                key={value}
                type="button"
                aria-label={label}
                aria-pressed={active}
                title={label}
                onClick={() => onViewChange(value)}
                className={cn(
                  BAR_BUTTON,
                  active &&
                    'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground'
                )}
              >
                <Icon className="size-[15px]" />
              </button>
            )
          })}
        </div>

        <span className="h-4 w-px bg-border" aria-hidden="true" />

        {/* 2. Nueva área */}
        <button
          type="button"
          aria-label="Nueva área"
          title="Nueva área"
          onClick={onNewArea}
          className={BAR_BUTTON}
        >
          <Plus className="size-[15px]" />
        </button>

        <span className="h-4 w-px bg-border" aria-hidden="true" />

        {/* 3. Configuración */}
        <SettingsMenu
          archiveOpen={archiveOpen}
          archivedCount={archivedCount}
          onToggleArchive={onToggleArchive}
          onOpenBackup={onOpenBackup}
          buttonClass={BAR_BUTTON}
        />
      </div>
    </header>
  )
}
