import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { registerBackupHandlers } from './backup'
import { loadData, saveData } from './storage'
import { createWidgetManager } from './widgets'
import type { AppData } from '../shared/types'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  const window = new BrowserWindow({
    title: 'Pendientes',
    width: 1000,
    minWidth: 760,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    icon,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })
  mainWindow = window

  window.on('ready-to-show', () => {
    window.show()
  })
  window.on('closed', () => {
    mainWindow = null
  })

  window.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // Con electron-vite en desarrollo se carga la dirección del servidor; en la app instalada, el archivo.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    window.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    window.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

/** Abre la ventana principal, o la trae al frente si ya estaba abierta. */
function openMainWindow(): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.show()
    mainWindow.focus()
  } else {
    createWindow()
  }
}

// Una sola copia de la app: si ya está en marcha (por ejemplo en segundo plano con los post-its
// de escritorio), abrir el acceso directo de nuevo trae la ventana principal al frente.
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => openMainWindow())

  app.whenReady().then(async () => {
    electronApp.setAppUserModelId('com.pendientes.app')

    // F12 abre las herramientas de desarrollo (solo en desarrollo).
    app.on('browser-window-created', (_, window) => {
      optimizer.watchWindowShortcuts(window)
    })

    // Datos: se guardan en la carpeta userData de la app
    const dataDir = app.getPath('userData')
    const widgets = createWidgetManager({
      dataDir,
      preloadPath: join(__dirname, '../preload/index.js'),
      icon,
      openMainWindow
    })

    ipcMain.handle('datos:cargar', () => loadData(dataDir))
    ipcMain.handle('datos:guardar', async (event, data: AppData) => {
      await saveData(dataDir, data)
      // Las demás ventanas (principal y post-its de escritorio) ven el cambio al momento.
      for (const window of BrowserWindow.getAllWindows()) {
        if (!window.isDestroyed() && window.webContents !== event.sender) {
          window.webContents.send('datos:remotos', data)
        }
      }
      widgets.syncWithAreas(data.areas.map((a) => a.id))
    })
    registerBackupHandlers(dataDir)
    widgets.register()

    // Si arranca con Windows (--widgets), solo aparecen los post-its de escritorio.
    const { data } = await loadData(dataDir)
    await widgets.restore(data.areas.map((a) => a.id))
    const onlyWidgets = process.argv.includes('--widgets') && widgets.hasPinned()
    if (!onlyWidgets) createWindow()

    app.on('activate', function () {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })

    // Mientras haya post-its fijados, la app sigue en segundo plano al cerrar la ventana principal.
    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin' && !widgets.hasPinned()) app.quit()
    })
  })
}
