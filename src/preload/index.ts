import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { AppData, DataApi } from '../shared/types'

const api: DataApi = {
  loadData: () => ipcRenderer.invoke('datos:cargar'),
  saveData: (data: AppData) => ipcRenderer.invoke('datos:guardar', data),
  exportBackup: (data: AppData) => ipcRenderer.invoke('datos:exportar', data),
  importBackup: () => ipcRenderer.invoke('datos:importar')
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
