import { CalendarDays, LayoutGrid, List, Plus } from 'lucide-react'
import { SettingsMenu } from '@renderer/components/SettingsMenu'
import { cn } from '@renderer/lib/utils'

export type View = 'lista' | 'cuadricula' | 'calendario'

const VIEWS = [
  { value: 'lista', label: 'Lista', Icon: List },
  { value: 'cuadricula', label: 'Cuadrícula', Icon: LayoutGrid },
  { value: 'calendario', label: 'Calendario', Icon: CalendarDays }
] as const

/** Aspecto común de las "píldoras" flotantes de la derecha. */
const PILL =
  'flex h-11 items-center rounded-full border bg-card text-card-foreground shadow-md transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none motion-reduce:transition-none'

interface Props {
  view: View
  archiveOpen: boolean
  archivedCount: number
  onViewChange: (view: View) => void
  onToggleArchive: () => void
  onOpenBackup: () => void
  onNewArea: () => void
}

/** Cabecera flotante: isla con el nombre al centro y tres grupos de botones a la derecha. */
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
    <header className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-6 pt-4 pb-2">
      <div aria-hidden="true" />

      {/* Isla central, como la de los iPhone: siempre oscura. */}
      <h1 className="flex h-11 items-center gap-2.5 rounded-full bg-black px-5 text-base font-bold tracking-tight text-white shadow-lg ring-1 ring-white/15">
        <span
          aria-hidden="true"
          className="paper block size-5 rotate-[-4deg]"
          style={{ backgroundColor: 'oklch(0.93 0.12 98)' }}
        />
        Pendientes
      </h1>

      <div className="flex items-center justify-end gap-3">
        {/* 1. Vistas */}
        <div
          role="group"
          aria-label="Vista"
          className="flex h-11 items-center gap-1 rounded-full border bg-card p-1 shadow-md"
        >
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
                  'flex size-9 items-center justify-center rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none motion-reduce:transition-none',
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                <Icon className="size-5" />
              </button>
            )
          })}
        </div>

        {/* 2. Nueva área */}
        <button
          type="button"
          aria-label="Nueva área"
          title="Nueva área"
          onClick={onNewArea}
          className={cn(PILL, 'size-11 justify-center')}
        >
          <Plus className="size-5" />
        </button>

        {/* 3. Configuración */}
        <SettingsMenu
          archiveOpen={archiveOpen}
          archivedCount={archivedCount}
          onToggleArchive={onToggleArchive}
          onOpenBackup={onOpenBackup}
          pillClass={PILL}
        />
      </div>
    </header>
  )
}
