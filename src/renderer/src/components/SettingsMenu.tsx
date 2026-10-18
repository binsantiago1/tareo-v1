import { useState } from 'react'
import { Archive, DatabaseBackup, Moon, Settings, Sun } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@renderer/components/ui/popover'
import { Switch } from '@renderer/components/ui/switch'
import { useTheme } from '@renderer/lib/theme'
import { cn } from '@renderer/lib/utils'

interface Props {
  archiveOpen: boolean
  archivedCount: number
  onToggleArchive: () => void
  onOpenBackup: () => void
  /** Clases del botón del engranaje (las pone la barra superior). */
  buttonClass: string
}

const ITEM_CLASS =
  'flex h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-medium hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none'

/** Engranaje de configuración: tema claro/oscuro, Archivo y Copias de seguridad. */
export function SettingsMenu({
  archiveOpen,
  archivedCount,
  onToggleArchive,
  onOpenBackup,
  buttonClass
}: Props): React.JSX.Element {
  const { dark, setDark } = useTheme()
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Configuración"
          title="Configuración"
          className={cn(buttonClass, open && 'bg-accent text-foreground')}
        >
          <Settings className="size-[15px]" />
        </button>
      </PopoverTrigger>
      <PopoverContent aria-label="Configuración">
        <div className="flex h-10 items-center justify-between gap-3 px-3">
          <span className="flex items-center gap-3 text-sm font-medium">
            {dark ? <Moon className="size-4" /> : <Sun className="size-4" />}
            Tema oscuro
          </span>
          <Switch
            checked={dark}
            onCheckedChange={setDark}
            label="Tema oscuro"
            icon={dark ? <Moon className="size-3" /> : <Sun className="size-3" />}
          />
        </div>
        <div className="my-1 h-px bg-border" role="separator" />
        <button
          type="button"
          className={ITEM_CLASS}
          aria-pressed={archiveOpen}
          onClick={() => {
            onToggleArchive()
            setOpen(false)
          }}
        >
          <Archive className="size-4" />
          Archivo{archivedCount > 0 && ` (${archivedCount})`}
        </button>
        <button
          type="button"
          className={ITEM_CLASS}
          onClick={() => {
            setOpen(false)
            onOpenBackup()
          }}
        >
          <DatabaseBackup className="size-4" />
          Copias de seguridad
        </button>
      </PopoverContent>
    </Popover>
  )
}
