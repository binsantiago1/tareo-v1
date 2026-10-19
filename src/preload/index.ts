import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { AppData, DataApi } from '../shared/types'

const api: DataApi = {
  loadData: () => ipcRenderer.invoke('datos:cargar'),
  saveData: (data: AppData) => ipcRenderer.invoke('datos:guardar', data),
  exportBackup: (data: AppData) => ipcRenderer.invoke('datos:exportar', data),
  importBackup: () => ipcRenderer.invoke('datos:importar'),
  onRemoteData: (callback) => {
    const listener = (_event: unknown, data: AppData): void => callback(data)
    ipcRenderer.on('datos:remotos', listener)
    return () => ipcRenderer.removeListener('datos:remotos', listener)
  },
  listWidgets: () => ipcRenderer.invoke('widgets:listar'),
  onWidgetsChanged: (callback) => {
    const listener = (_event: unknown, areaIds: string[]): void => callback(areaIds)
    ipcRenderer.on('widgets:cambiaron', listener)
    return () => ipcRenderer.removeListener('widgets:cambiaron', listener)
  },
  pinWidget: (areaId) => ipcRenderer.invoke('widgets:fijar', areaId),
  unpinWidget: (areaId) => ipcRenderer.invoke('widgets:quitar', areaId),
  reportWidgetHeight: (content, overlay) =>
    ipcRenderer.send('widgets:altura', { content, overlay }),
  getWidgetInfo: () => ipcRenderer.invoke('widgets:info'),
  setWidgetSize: (width, height) => ipcRenderer.send('widgets:tamano', { width, height }),
  resetWidgetSize: () => ipcRenderer.send('widgets:tamano-auto'),
  resetAllWidgetSizes: () => ipcRenderer.invoke('widgets:restablecer-todos'),
  onWidgetSizeReset: (callback) => {
    const listener = (): void => callback()
    ipcRenderer.on('widgets:tamano-restablecido', listener)
    return () => ipcRenderer.removeListener('widgets:tamano-restablecido', listener)
  },
  moveWidget: (x, y) => ipcRenderer.send('widgets:mover', { x, y }),
  getWidgetPosition: () => ipcRenderer.invoke('widgets:posicion')
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
