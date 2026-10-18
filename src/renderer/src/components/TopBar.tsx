import { Archive, Plus } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'

export type View = 'lista' | 'cuadricula'

const VIEWS: { value: View; label: string }[] = [
  { value: 'lista', label: 'Lista' },
  { value: 'cuadricula', label: 'Cuadrícula' }
]

interface Props {
  view: View
  archiveOpen: boolean
  archivedCount: number
  onViewChange: (view: View) => void
  onToggleArchive: () => void
  onNewArea: () => void
}

export function TopBar({
  view,
  archiveOpen,
  archivedCount,
  onViewChange,
  onToggleArchive,
  onNewArea
}: Props): React.JSX.Element {
  return (
    <header className="flex items-center justify-between gap-4 border-b px-6 py-3">
      <h1 className="text-xl font-semibold">Pendientes</h1>
      {/* Selector de vista (el Calendario llega en la Fase 8). */}
      <div role="group" aria-label="Vista" className="flex gap-1 rounded-md border p-0.5">
        {VIEWS.map((v) => {
          const active = !archiveOpen && view === v.value
          return (
            <Button
              key={v.value}
              size="sm"
              variant={active ? 'secondary' : 'ghost'}
              aria-pressed={active}
              onClick={() => onViewChange(v.value)}
            >
              {v.label}
            </Button>
          )
        })}
      </div>
      <div className="flex gap-2">
        <Button
          variant={archiveOpen ? 'secondary' : 'outline'}
          aria-pressed={archiveOpen}
          onClick={onToggleArchive}
        >
          <Archive className="size-4" />
          Archivo{archivedCount > 0 && ` (${archivedCount})`}
        </Button>
        <Button onClick={onNewArea}>
          <Plus className="size-4" />
          Nueva área
        </Button>
      </div>
    </header>
  )
}
