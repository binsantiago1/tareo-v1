import { ArrowLeft, CalendarDays, LayoutGrid, List, Plus } from 'lucide-react'
import { AppLogo } from '@renderer/components/AppLogo'
import { SettingsMenu } from '@renderer/components/SettingsMenu'
import { cn } from '@renderer/lib/utils'

export type View = 'lista' | 'cuadricula' | 'calendario'

const VIEWS = [
  { value: 'lista', label: 'Lista', Icon: List },
  { value: 'cuadricula', label: 'Cuadrícula', Icon: LayoutGrid },
  { value: 'calendario', label: 'Calendario', Icon: CalendarDays }
] as const

/** Aspecto con el cursor encima (isla y barra): contorno, fondo blanco al 70% y sombra suave. */
const HOVER_SURFACE = 'hover:border-border hover:bg-card/70 hover:shadow-sm hover:backdrop-blur-sm'

/**
 * Cuando hay un menú abierto desde la barra se mantiene el aspecto "con el cursor encima",
 * aunque el cursor esté sobre el menú.
 */
const BAR_ON = 'group-hover/bar:opacity-100 group-has-[[data-state=open]]/bar:opacity-100'

/** Botón de icono de la barra: atenuado hasta que se pasa el cursor por la barra. */
const BAR_BUTTON = cn(
  'relative z-10 flex size-9 items-center justify-center rounded-xl text-foreground opacity-50 transition-[opacity,background-color] hover:bg-accent focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none motion-reduce:transition-none',
  BAR_ON
)

/** Separación entre botones de las vistas (size-9 = 2.25rem + gap-1 = 0.25rem). */
const VIEW_STEP_REM = 2.5

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
  const viewIndex = VIEWS.findIndex((v) => v.value === view)

  return (
    <header className="flex items-start justify-between gap-3 px-6 pt-4 pb-2">
      {/*
        Isla: solo el icono, en un rectángulo como el de la barra. Sin relleno ni contorno hasta
        que se le pasa el cursor; entonces aparece el rectángulo y se despliega (despacio) el nombre.
      */}
      <h1
        className={cn(
          HOVER_SURFACE,
          'group/brand flex h-11 items-center overflow-hidden rounded-2xl border border-transparent text-base font-bold tracking-tight transition-[background-color,border-color,box-shadow] duration-200 motion-reduce:transition-none'
        )}
      >
        <span className="flex size-11 shrink-0 items-center justify-center" aria-hidden="true">
          <AppLogo className="h-6 w-auto" />
        </span>
        <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-all duration-700 ease-in-out group-hover/brand:max-w-40 group-hover/brand:pr-5 group-hover/brand:opacity-100 motion-reduce:transition-none">
          Pendientes
        </span>
      </h1>

      <div className="flex items-center gap-2">
        {/* En el Archivo: flecha para volver a las áreas (a la vista en la que estabas). */}
        {archiveOpen && (
          <button
            type="button"
            aria-label="Volver a las áreas"
            title="Volver a las áreas"
            onClick={onToggleArchive}
            className="toast-in flex size-11 items-center justify-center rounded-2xl border bg-card/70 shadow-sm backdrop-blur-sm transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none motion-reduce:transition-none"
          >
            <ArrowLeft className="size-5" />
          </button>
        )}

        {/*
        Una sola barra con tres secciones. En reposo es transparente (sin relleno ni contorno) y
        sus iconos están atenuados; con el cursor encima aparece el rectángulo y los separadores.
      */}
        <div className="group/bar relative flex h-11 items-center gap-1 rounded-2xl border border-transparent px-1 transition-[background-color,border-color,box-shadow] duration-200 hover:border-border hover:bg-card/70 hover:shadow-sm hover:backdrop-blur-sm has-[[data-state=open]]:border-border has-[[data-state=open]]:bg-card/70 has-[[data-state=open]]:shadow-sm motion-reduce:transition-none">
          {/* Selección de vista: un fondo oscuro que se desliza de una vista a otra. */}
          <span
            aria-hidden="true"
            className={cn(
              'pointer-events-none absolute top-1 left-1 size-9 rounded-xl bg-primary opacity-0 transition-[transform,opacity] duration-300 ease-out motion-reduce:transition-none',
              !archiveOpen &&
                'group-hover/bar:opacity-100 group-has-[[data-state=open]]/bar:opacity-100'
            )}
            style={{ transform: `translateX(${Math.max(viewIndex, 0) * VIEW_STEP_REM}rem)` }}
          />

          {/* 1. Vistas */}
          <div role="group" aria-label="Vista" className="flex items-center gap-1">
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
                    'transition-colors',
                    active &&
                      'opacity-100 group-hover/bar:text-primary-foreground group-has-[[data-state=open]]/bar:text-primary-foreground hover:bg-transparent'
                  )}
                >
                  <Icon className="size-5" />
                </button>
              )
            })}
          </div>

          <span
            className={cn('h-5 w-px bg-border opacity-0 transition-opacity', BAR_ON)}
            aria-hidden="true"
          />

          {/* 2. Nueva área */}
          <button
            type="button"
            aria-label="Nueva área"
            title="Nueva área"
            onClick={onNewArea}
            className={BAR_BUTTON}
          >
            <Plus className="size-5" />
          </button>

          <span
            className={cn('h-5 w-px bg-border opacity-0 transition-opacity', BAR_ON)}
            aria-hidden="true"
          />

          {/* 3. Configuración */}
          <SettingsMenu
            archiveOpen={archiveOpen}
            archivedCount={archivedCount}
            onToggleArchive={onToggleArchive}
            onOpenBackup={onOpenBackup}
            buttonClass={BAR_BUTTON}
          />
        </div>
      </div>
    </header>
  )
}
