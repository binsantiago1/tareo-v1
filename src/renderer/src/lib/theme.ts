import { useEffect, useState } from 'react'

/**
 * Lo que se guarda: "claro" u "oscuro" (elegido por la persona).
 * "sistema" solo existe hasta la primera vez que se usa el interruptor: la app arranca con el
 * modo de Windows y, al elegir, se recuerda la elección.
 */
export type ThemePreference = 'sistema' | 'claro' | 'oscuro'

const STORAGE_KEY = 'pendientes-tema'
const DARK_QUERY = '(prefers-color-scheme: dark)'

export function readThemePreference(): ThemePreference {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    if (value === 'claro' || value === 'oscuro' || value === 'sistema') return value
  } catch {
    // Sin acceso al almacenamiento: se usa el del sistema.
  }
  return 'sistema'
}

function writeThemePreference(preference: ThemePreference): void {
  try {
    localStorage.setItem(STORAGE_KEY, preference)
  } catch {
    // Si no se puede recordar, el tema sigue funcionando en esta sesión.
  }
}

function isDark(preference: ThemePreference): boolean {
  return (
    preference === 'oscuro' || (preference === 'sistema' && window.matchMedia(DARK_QUERY).matches)
  )
}

/** Pone o quita la clase "dark" en la página según la preferencia. */
export function applyTheme(preference: ThemePreference): void {
  document.documentElement.classList.toggle('dark', isDark(preference))
}

/** Modo oscuro activo (sí/no) y función para elegir claro u oscuro. */
export function useTheme(): { dark: boolean; setDark: (dark: boolean) => void } {
  const [preference, setPreference] = useState<ThemePreference>(readThemePreference)
  const [systemDark, setSystemDark] = useState(() => window.matchMedia(DARK_QUERY).matches)
  const dark = preference === 'oscuro' || (preference === 'sistema' && systemDark)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  // Si el tema se cambia en otra ventana (por ejemplo, la principal), este también lo sigue.
  useEffect(() => {
    const onStorage = (event: StorageEvent): void => {
      if (event.key === STORAGE_KEY) setPreference(readThemePreference())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  useEffect(() => {
    // Mientras no se haya elegido, la app sigue los cambios de modo de Windows.
    const media = window.matchMedia(DARK_QUERY)
    const onChange = (event: MediaQueryListEvent): void => setSystemDark(event.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  const setDark = (value: boolean): void => {
    const next: ThemePreference = value ? 'oscuro' : 'claro'
    writeThemePreference(next)
    setPreference(next)
  }

  return { dark, setDark }
}
