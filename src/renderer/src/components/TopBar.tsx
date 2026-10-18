import { Archive, Plus } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'

export type Screen = 'lista' | 'archivo'

interface Props {
  screen: Screen
  archivedCount: number
  onScreenChange: (screen: Screen) => void
  onNewArea: () => void
}

export function TopBar({
  screen,
  archivedCount,
  onScreenChange,
  onNewArea
}: Props): React.JSX.Element {
  return (
    <header className="flex items-center justify-between gap-4 border-b px-6 py-3">
      <h1 className="text-xl font-semibold">Pendientes</h1>
      {/* Selector de vista: de momento solo existe la vista Lista. */}
      <div role="group" aria-label="Vista" className="flex rounded-md border p-0.5">
        <Button
          size="sm"
          variant={screen === 'lista' ? 'secondary' : 'ghost'}
          aria-pressed={screen === 'lista'}
          onClick={() => onScreenChange('lista')}
        >
          Lista
        </Button>
      </div>
      <div className="flex gap-2">
        <Button
          variant={screen === 'archivo' ? 'secondary' : 'outline'}
          aria-pressed={screen === 'archivo'}
          onClick={() => onScreenChange(screen === 'archivo' ? 'lista' : 'archivo')}
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
