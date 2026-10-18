import './assets/main.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import WidgetApp from './WidgetApp'
import { applyTheme, readThemePreference } from './lib/theme'

// El tema se aplica antes de pintar nada, para que no haya un parpadeo de color.
applyTheme(readThemePreference())

// La misma página sirve para la ventana principal y para los post-its de escritorio
// (estos se abren con la dirección «#/widget/<id del área>»).
const widgetMatch = /^#\/widget\/(.+)$/.exec(window.location.hash)
if (widgetMatch) document.documentElement.classList.add('widget')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {widgetMatch ? <WidgetApp areaId={decodeURIComponent(widgetMatch[1])} /> : <App />}
  </StrictMode>
)
