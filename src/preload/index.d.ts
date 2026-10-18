import { ElectronAPI } from '@electron-toolkit/preload'
import type { DataApi } from '../shared/types'

declare global {
  interface Window {
    electron: ElectronAPI
    api: DataApi
  }
}
