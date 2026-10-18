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
  setWidgetHeight: (height) => ipcRenderer.send('widgets:altura', height)
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
