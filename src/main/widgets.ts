import { BrowserWindow, Menu, Tray, app, ipcMain, nativeImage, screen } from 'electron'
import { promises as fs } from 'fs'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'

/** Margen transparente alrededor del post-it (para que quepa la sombra), a cada lado. */
const MARGIN = 16
/** Tamaño de ventana por defecto: 320 de post-it + el margen. */
const DEFAULT_WIDTH = 320 + MARGIN * 2
const DEFAULT_HEIGHT = 260
const MIN_WIDTH = 200 + MARGIN * 2
const MIN_HEIGHT = 120 + MARGIN * 2
/** Tiempo máximo de un movimiento (seguro contra un clic que no se suelta del todo). */
const MAX_MOVE_MS = 30_000

interface PinnedWidget {
  areaId: string
  x?: number
  y?: number
  /** Tamaño de la ventana si el usuario lo cambió a mano. */
  width?: number
  height?: number
  userSized?: boolean
}

/** Tamaño "deseado" de cada ventana (sin contar lo que crece temporalmente por un menú). */
interface WidgetLayout {
  width: number
  height: number
  /** true si lo fijó el usuario con las asas; false = la altura se ajusta sola al contenido. */
  userSized: boolean
  /** Altura mínima mientras haya un menú o diálogo abierto (0 = ninguno). */
  overlayMin: number
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
 * Se recuerdan en `widgets.json` (con su posición y tamaño) y se vuelven a abrir al iniciar la app.
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
  const layouts = new Map<string, WidgetLayout>()
  const moving = new Map<BrowserWindow, NodeJS.Timeout>()

  function stopMoving(window: BrowserWindow | null): void {
    if (!window) return
    const timer = moving.get(window)
    if (timer) clearInterval(timer)
    moving.delete(window)
  }
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
    // Solo en la app empaquetada (en desarrollo no se toca la configuración de Windows).
    if (app.isPackaged) {
      app.setLoginItemSettings({
        openAtLogin: pinned.length > 0,
        // En la versión portable, el .exe real es el que indica esta variable (no el temporal).
        path: process.env['PORTABLE_EXECUTABLE_FILE'] ?? process.execPath,
        args: ['--widgets']
      })
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
      x: area.x + area.width - DEFAULT_WIDTH - 24 - (index % 4) * 30,
      y: area.y + 70 + (index % 8) * 36
    }
  }

  /** Pone la ventana en el tamaño deseado (más lo que necesite un menú abierto), dentro de la pantalla. */
  function applyLayout(areaId: string): void {
    const window = windows.get(areaId)
    const layout = layouts.get(areaId)
    if (!window || window.isDestroyed() || !layout) return
    const bounds = window.getBounds()
    const area = screen.getDisplayMatching(bounds).workArea
    const width = Math.round(Math.min(Math.max(layout.width, MIN_WIDTH), area.width - 20))
    const height = Math.round(
      Math.min(Math.max(layout.height, layout.overlayMin, MIN_HEIGHT), area.height - 20)
    )
    // Si al crecer se saldría de la pantalla, la ventana se desplaza lo necesario.
    const x = Math.max(area.x, Math.min(bounds.x, area.x + area.width - width))
    const y = Math.max(area.y, Math.min(bounds.y, area.y + area.height - height))
    if (x === bounds.x && y === bounds.y && width === bounds.width && height === bounds.height) {
      return
    }
    window.setBounds({ x, y, width, height }, false)
  }

  /** Guarda (sin prisa) la posición y el tamaño de un post-it. */
  const timers = new Map<string, NodeJS.Timeout>()
  function rememberLater(areaId: string): void {
    clearTimeout(timers.get(areaId))
    timers.set(
      areaId,
      setTimeout(() => {
        const window = windows.get(areaId)
        const entry = pinned.find((p) => p.areaId === areaId)
        const layout = layouts.get(areaId)
        if (!window || window.isDestroyed() || !entry || !layout) return
        const [x, y] = window.getPosition()
        entry.x = x
        entry.y = y
        entry.userSized = layout.userSized
        if (layout.userSized) {
          entry.width = layout.width
          entry.height = layout.height
        } else {
          delete entry.width
          delete entry.height
        }
        void save()
      }, 400)
    )
  }

  function areaIdOf(window: BrowserWindow | null): string | undefined {
    for (const [areaId, w] of windows) if (w === window) return areaId
    return undefined
  }

  function openWindow(widget: PinnedWidget): void {
    if (windows.has(widget.areaId)) return
    const index = pinned.findIndex((p) => p.areaId === widget.areaId)
    const saved =
      widget.x !== undefined && widget.y !== undefined ? visiblePosition(widget.x, widget.y) : null
    const position = saved ?? defaultPosition(index)
    const layout: WidgetLayout = {
      width: widget.userSized && widget.width ? widget.width : DEFAULT_WIDTH,
      height: widget.userSized && widget.height ? widget.height : DEFAULT_HEIGHT,
      userSized: widget.userSized === true,
      overlayMin: 0
    }
    layouts.set(widget.areaId, layout)

    const window = new BrowserWindow({
      ...position,
      width: layout.width,
      height: layout.height,
      useContentSize: true,
      frame: false,
      transparent: true,
      // El sistema no deja redimensionar ventanas transparentes: el tamaño lo cambian las asas
      // del propio post-it, que piden el nuevo tamaño al proceso principal.
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
    window.on('closed', () => {
      stopMoving(window)
      windows.delete(widget.areaId)
      layouts.delete(widget.areaId)
    })
    window.on('moved', () => rememberLater(widget.areaId))
    window.on('move', () => rememberLater(widget.areaId))

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
    layouts.delete(areaId)
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

      // ¿Esta ventana tiene tamaño fijado por el usuario o se ajusta sola?
      ipcMain.handle('widgets:info', (event) => {
        const areaId = areaIdOf(BrowserWindow.fromWebContents(event.sender))
        return { userSized: areaId ? (layouts.get(areaId)?.userSized ?? false) : false }
      })

      // La interfaz informa de cuánto mide su contenido y de si hay un menú o diálogo abierto.
      ipcMain.on('widgets:altura', (event, payload: { content: number; overlay: number }) => {
        const areaId = areaIdOf(BrowserWindow.fromWebContents(event.sender))
        const layout = areaId ? layouts.get(areaId) : undefined
        if (!areaId || !layout || !Number.isFinite(payload?.content)) return
        if (!layout.userSized) layout.height = Math.max(payload.content, MIN_HEIGHT)
        layout.overlayMin = Number.isFinite(payload.overlay) ? payload.overlay : 0
        applyLayout(areaId)
      })

      // El usuario está cambiando el tamaño con las asas.
      ipcMain.on('widgets:tamano', (event, size: { width: number; height: number }) => {
        const areaId = areaIdOf(BrowserWindow.fromWebContents(event.sender))
        const layout = areaId ? layouts.get(areaId) : undefined
        if (!areaId || !layout || !Number.isFinite(size?.width) || !Number.isFinite(size?.height)) {
          return
        }
        layout.userSized = true
        layout.width = size.width
        layout.height = size.height
        applyLayout(areaId)
        rememberLater(areaId)
      })

      // Mover la ventana manteniendo pulsado el clic sobre el post-it. La posición se calcula
      // aquí con la del cursor en la pantalla (la que da el sistema), no con la que ve la página,
      // que va un instante atrasada cuando la propia ventana se está moviendo.
      ipcMain.on('widgets:mover-inicio', (event) => {
        const window = BrowserWindow.fromWebContents(event.sender)
        if (!window || window.isDestroyed()) return
        stopMoving(window)
        const startCursor = screen.getCursorScreenPoint()
        const [startX, startY] = window.getPosition()
        const startedAt = Date.now()
        const timer = setInterval(() => {
          // Por seguridad: si no llega el aviso de soltar el clic, se para solo.
          if (window.isDestroyed() || Date.now() - startedAt > MAX_MOVE_MS) {
            stopMoving(window)
            return
          }
          const cursor = screen.getCursorScreenPoint()
          const x = startX + cursor.x - startCursor.x
          const y = startY + cursor.y - startCursor.y
          const [currentX, currentY] = window.getPosition()
          if (x !== currentX || y !== currentY) window.setPosition(x, y)
        }, 8)
        moving.set(window, timer)
      })
      ipcMain.on('widgets:mover-fin', (event) => {
        stopMoving(BrowserWindow.fromWebContents(event.sender))
      })

      // Botón "Restablecer tamaño de notas" de la ventana principal: todos los post-its de
      // escritorio vuelven al tamaño automático (ancho normal y alto que muestra todas las tareas).
      ipcMain.handle('widgets:restablecer-todos', async () => {
        for (const entry of pinned) {
          entry.userSized = false
          delete entry.width
          delete entry.height
        }
        await save()
        for (const [areaId, layout] of layouts) {
          layout.userSized = false
          layout.width = DEFAULT_WIDTH
          applyLayout(areaId)
          windows.get(areaId)?.webContents.send('widgets:tamano-restablecido')
        }
      })

      // Doble clic en la esquina: vuelve al tamaño automático.
      ipcMain.on('widgets:tamano-auto', (event) => {
        const areaId = areaIdOf(BrowserWindow.fromWebContents(event.sender))
        const layout = areaId ? layouts.get(areaId) : undefined
        if (!areaId || !layout) return
        layout.userSized = false
        layout.width = DEFAULT_WIDTH
        applyLayout(areaId)
        rememberLater(areaId)
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
