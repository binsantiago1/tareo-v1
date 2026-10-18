import { BrowserWindow, dialog, ipcMain } from 'electron'
import { promises as fs } from 'fs'
import { parseBackup, snapshotBeforeImport } from './storage'
import type { AppData, ExportResult, ImportResult } from '../shared/types'

const FILTERS = [{ name: 'Copia de seguridad de Pendientes', extensions: ['json'] }]

function todayForFileName(): string {
  const d = new Date()
  const pad = (n: number): string => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

/** Exportar e importar copias de seguridad con los diálogos de Windows. */
export function registerBackupHandlers(dataDir: string): void {
  ipcMain.handle('datos:exportar', async (event, data: AppData): Promise<ExportResult> => {
    try {
      const window = BrowserWindow.fromWebContents(event.sender)
      const options = {
        title: 'Exportar copia de seguridad',
        defaultPath: `pendientes-copia-${todayForFileName()}.json`,
        filters: FILTERS
      }
      const result = window
        ? await dialog.showSaveDialog(window, options)
        : await dialog.showSaveDialog(options)
      if (result.canceled || !result.filePath) return { status: 'canceled' }
      await fs.writeFile(result.filePath, JSON.stringify(data, null, 2), 'utf-8')
      return { status: 'ok', path: result.filePath }
    } catch (error) {
      return { status: 'error', message: describe(error) }
    }
  })

  ipcMain.handle('datos:importar', async (event): Promise<ImportResult> => {
    try {
      const window = BrowserWindow.fromWebContents(event.sender)
      const options = {
        title: 'Importar copia de seguridad',
        filters: FILTERS,
        properties: ['openFile' as const]
      }
      const result = window
        ? await dialog.showOpenDialog(window, options)
        : await dialog.showOpenDialog(options)
      if (result.canceled || result.filePaths.length === 0) return { status: 'canceled' }

      const data = parseBackup(await fs.readFile(result.filePaths[0], 'utf-8'))
      if (!data) {
        return {
          status: 'error',
          message: 'Ese archivo no es una copia de seguridad válida de Pendientes.'
        }
      }
      // Antes de sustituir nada, se guarda una copia de los datos actuales.
      await snapshotBeforeImport(dataDir)
      return { status: 'ok', data }
    } catch (error) {
      return { status: 'error', message: describe(error) }
    }
  })
}
