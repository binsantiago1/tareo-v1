import './assets/main.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { applyTheme, readThemePreference } from './lib/theme'

// El tema se aplica antes de pintar nada, para que no haya un parpadeo de color.
applyTheme(readThemePreference())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
