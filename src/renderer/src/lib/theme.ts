import { useEffect, useState } from 'react'

/** "sistema" sigue el modo claro/oscuro de Windows. */
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

/** Pone o quita la clase "dark" en la página según la preferencia. */
export function applyTheme(preference: ThemePreference): void {
  const dark =
    preference === 'oscuro' || (preference === 'sistema' && window.matchMedia(DARK_QUERY).matches)
  document.documentElement.classList.toggle('dark', dark)
}

/** Preferencia de tema (recordada) y función para cambiarla. */
export function useTheme(): {
  preference: ThemePreference
  setPreference: (p: ThemePreference) => void
} {
  const [preference, setPreferenceState] = useState<ThemePreference>(readThemePreference)

  useEffect(() => {
    applyTheme(preference)
    if (preference !== 'sistema') return
    // Si Windows cambia de modo mientras la app está abierta, la app lo sigue.
    const media = window.matchMedia(DARK_QUERY)
    const onChange = (): void => applyTheme('sistema')
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [preference])

  const setPreference = (p: ThemePreference): void => {
    writeThemePreference(p)
    setPreferenceState(p)
  }

  return { preference, setPreference }
}
