import { Plus } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'

interface Props {
  onNewArea: () => void
}

export function TopBar({ onNewArea }: Props): React.JSX.Element {
  return (
    <header className="flex items-center justify-between gap-4 border-b px-6 py-3">
      <h1 className="text-xl font-semibold">Pendientes</h1>
      {/* Selector de vista: de momento solo existe la vista Lista. */}
      <div role="group" aria-label="Vista" className="flex rounded-md border p-0.5">
        <Button size="sm" variant="secondary" aria-pressed="true">
          Lista
        </Button>
      </div>
      <Button onClick={onNewArea}>
        <Plus className="size-4" />
        Nueva área
      </Button>
    </header>
  )
}
