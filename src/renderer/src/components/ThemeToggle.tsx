import { Monitor, Moon, Sun } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { useTheme, type ThemePreference } from '@renderer/lib/theme'

const NEXT: Record<ThemePreference, ThemePreference> = {
  sistema: 'claro',
  claro: 'oscuro',
  oscuro: 'sistema'
}

const LABEL: Record<ThemePreference, string> = {
  sistema: 'Automático',
  claro: 'Claro',
  oscuro: 'Oscuro'
}

const ICON = { sistema: Monitor, claro: Sun, oscuro: Moon }

/** Botón que alterna entre Automático (el de Windows), Claro y Oscuro. */
export function ThemeToggle(): React.JSX.Element {
  const { preference, setPreference } = useTheme()
  const Icon = ICON[preference]

  return (
    <Button
      variant="outline"
      onClick={() => setPreference(NEXT[preference])}
      title={`Tema: ${LABEL[preference]}. Pulsa para cambiar a ${LABEL[NEXT[preference]]}.`}
      aria-label={`Tema: ${LABEL[preference]}. Pulsa para cambiar a ${LABEL[NEXT[preference]]}.`}
    >
      <Icon className="size-4" />
      {LABEL[preference]}
    </Button>
  )
}
