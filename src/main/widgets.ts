import { BrowserWindow, Menu, Tray, app, ipcMain, nativeImage, screen } from 'electron'
import { promises as fs } from 'fs'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'

/** Ancho de la ventana: 320 de post-it + 16 de margen a cada lado (para que quepa la sombra). */
const WIDGET_WIDTH = 352
const MIN_HEIGHT = 120

interface PinnedWidget {
  areaId: string
  x?: number
  y?: number
}

interface Options {
  dataDir: string
  preloadPath: string
  icon: string
  /** Abre (o trae al frente) la ventana principal. */
  openMainWindow: () => void
}

/**
 * Post-its de escritorio: una ventana flotante sin marco por cada área fijada.
 * Se recuerdan en `widgets.json` (con su posición) y se vuelven a abrir al iniciar la app.
 * Mientras haya alguno fijado, la app sigue viva en segundo plano (icono junto al reloj) y
 * se registra para arrancar con Windows.
 */
export function createWidgetManager(options: Options): {
  register: () => void
  restore: (areaIds: string[]) => Promise<void>
  syncWithAreas: (areaIds: string[]) => void
  hasPinned: () => boolean
} {
  const file = join(options.dataDir, 'widgets.json')
  let pinned: PinnedWidget[] = []
  const windows = new Map<string, BrowserWindow>()
  let tray: Tray | null = null
  let knownAreaIds: Set<string> | null = null

  async function load(): Promise<void> {
    try {
      const parsed: unknown = JSON.parse(await fs.readFile(file, 'utf-8'))
      pinned = Array.isArray(parsed)
        ? (parsed as PinnedWidget[]).filter((p) => typeof p?.areaId === 'string')
        : []
    } catch {
      pinned = []
    }
  }

  async function save(): Promise<void> {
    try {
      await fs.mkdir(options.dataDir, { recursive: true })
      const tmp = file + '.tmp'
      await fs.writeFile(tmp, JSON.stringify(pinned, null, 2), 'utf-8')
      await fs.rename(tmp, file)
    } catch (error) {
      console.error('No se pudo guardar widgets.json', error)
    }
  }

  function broadcastList(): void {
    const ids = pinned.map((p) => p.areaId)
    for (const window of BrowserWindow.getAllWindows()) {
      if (!window.isDestroyed()) window.webContents.send('widgets:cambiaron', ids)
    }
  }

  /** Icono junto al reloj (solo mientras haya post-its fijados) y arranque con Windows. */
  function updateBackgroundPresence(): void {
    if (pinned.length > 0 && !tray) {
      const image = nativeImage.createFromPath(options.icon).resize({ width: 16, height: 16 })
      tray = new Tray(image)
      tray.setToolTip('Pendientes')
      tray.setContextMenu(
        Menu.buildFromTemplate([
          { label: 'Abrir Pendientes', click: () => options.openMainWindow() },
          { type: 'separator' },
          { label: 'Salir', click: () => app.quit() }
        ])
      )
      tray.on('click', () => options.openMainWindow())
    } else if (pinned.length === 0 && tray) {
      tray.destroy()
      tray = null
    }
    // Solo en la app instalada (en desarrollo no se toca la configuración de Windows).
    if (app.isPackaged) {
      app.setLoginItemSettings({ openAtLogin: pinned.length > 0, args: ['--widgets'] })
    }
  }

  /** Que la ventana no quede fuera de la pantalla si cambió la configuración de monitores. */
  function visiblePosition(x: number, y: number): { x: number; y: number } | null {
    const inside = screen
      .getAllDisplays()
      .some(
        (d) =>
          x + 40 > d.workArea.x &&
          x < d.workArea.x + d.workArea.width - 40 &&
          y >= d.workArea.y - 10 &&
          y < d.workArea.y + d.workArea.height - 40
      )
    return inside ? { x, y } : null
  }

  function defaultPosition(index: number): { x: number; y: number } {
    const area = screen.getPrimaryDisplay().workArea
    return {
      x: area.x + area.width - WIDGET_WIDTH - 24 - (index % 4) * 30,
      y: area.y + 70 + (index % 8) * 36
    }
  }

  function openWindow(widget: PinnedWidget): void {
    if (windows.has(widget.areaId)) return
    const index = pinned.findIndex((p) => p.areaId === widget.areaId)
    const saved =
      widget.x !== undefined && widget.y !== undefined ? visiblePosition(widget.x, widget.y) : null
    const position = saved ?? defaultPosition(index)

    const window = new BrowserWindow({
      ...position,
      width: WIDGET_WIDTH,
      height: 260,
      useContentSize: true,
      frame: false,
      transparent: true,
      resizable: false,
      maximizable: false,
      minimizable: false,
      fullscreenable: false,
      skipTaskbar: true,
      hasShadow: false,
      show: false,
      title: 'Pendientes',
      icon: options.icon,
      webPreferences: { preload: options.preloadPath, sandbox: false }
    })
    windows.set(widget.areaId, window)
    window.on('ready-to-show', () => window.showInactive())
    window.on('closed', () => windows.delete(widget.areaId))

    // Se recuerda dónde dejó el usuario cada post-it.
    let timer: NodeJS.Timeout | undefined
    const remember = (): void => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        if (window.isDestroyed()) return
        const [x, y] = window.getPosition()
        const entry = pinned.find((p) => p.areaId === widget.areaId)
        if (entry) {
          entry.x = x
          entry.y = y
          void save()
        }
      }, 400)
    }
    window.on('moved', remember)
    window.on('move', remember)

    const hash = `/widget/${widget.areaId}`
    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
      window.loadURL(`${process.env['ELECTRON_RENDERER_URL']}#${hash}`)
    } else {
      window.loadFile(join(__dirname, '../renderer/index.html'), { hash })
    }
  }

  function closeWindow(areaId: string): void {
    const window = windows.get(areaId)
    if (window && !window.isDestroyed()) window.destroy()
    windows.delete(areaId)
  }

  async function pin(areaId: string): Promise<void> {
    if (!pinned.some((p) => p.areaId === areaId)) {
      pinned.push({ areaId })
      await save()
    }
    const entry = pinned.find((p) => p.areaId === areaId)!
    openWindow(entry)
    windows.get(areaId)?.showInactive()
    updateBackgroundPresence()
    broadcastList()
  }

  async function unpin(areaId: string): Promise<void> {
    pinned = pinned.filter((p) => p.areaId !== areaId)
    // Primero se guarda y después se cierra la ventana: si era la última, la app se cierra sola
    // y el cambio ya tiene que estar escrito.
    await save()
    closeWindow(areaId)
    updateBackgroundPresence()
    broadcastList()
  }

  return {
    register: () => {
      ipcMain.handle('widgets:listar', () => pinned.map((p) => p.areaId))
      ipcMain.handle('widgets:fijar', (_event, areaId: string) => pin(areaId))
      ipcMain.handle('widgets:quitar', (_event, areaId: string) => unpin(areaId))
      ipcMain.on('widgets:altura', (event, height: number) => {
        const window = BrowserWindow.fromWebContents(event.sender)
        if (!window || window.isDestroyed() || !Number.isFinite(height)) return
        const area = screen.getDisplayMatching(window.getBounds()).workArea
        const max = Math.max(MIN_HEIGHT, area.height - 20)
        const next = Math.round(Math.min(Math.max(height, MIN_HEIGHT), max))
        const bounds = window.getBounds()
        // Si al crecer se saldría por abajo de la pantalla, la ventana sube lo necesario.
        const y = Math.max(area.y, Math.min(bounds.y, area.y + area.height - next))
        window.setBounds({ x: bounds.x, y, width: WIDGET_WIDTH, height: next }, false)
      })
    },

    /** Al iniciar: se abren los post-its fijados cuyas áreas siguen existiendo. */
    restore: async (areaIds) => {
      await load()
      knownAreaIds = new Set(areaIds)
      const existing = pinned.filter((p) => knownAreaIds!.has(p.areaId))
      // Solo se descartan los fijados de áreas que ya no existen si hay datos que comparar
      // (si el archivo de datos vino vacío o dañado, no se pierde nada).
      if (areaIds.length > 0 && existing.length !== pinned.length) {
        pinned = existing
        await save()
      }
      for (const widget of existing) openWindow(widget)
      updateBackgroundPresence()
    },

    /**
     * Cada vez que cambian los datos: si un área con post-it de escritorio desaparece, su ventana
     * se cierra (sigue "fijada": si el área vuelve con "Deshacer", la ventana reaparece).
     */
    syncWithAreas: (areaIds) => {
      knownAreaIds = new Set(areaIds)
      for (const widget of pinned) {
        const exists = knownAreaIds.has(widget.areaId)
        if (exists && !windows.has(widget.areaId)) openWindow(widget)
        if (!exists && windows.has(widget.areaId)) closeWindow(widget.areaId)
      }
    },

    hasPinned: () => pinned.length > 0
  }
}
