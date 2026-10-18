import { create } from 'zustand'
import { createEmptyData, type Area, type AppData } from '../../../shared/types'

interface DataState {
  data: AppData
  /** true cuando ya se leyó el archivo (hasta entonces no se guarda nada). */
  loaded: boolean
  /** Aviso si hubo que recuperar un archivo dañado. */
  warning?: string
  /** Último error al guardar, si lo hubo. */
  saveError?: string
  init: () => Promise<void>
  dismissWarning: () => void
  addTestArea: () => void
  removeArea: (id: string) => void
}

export const useDataStore = create<DataState>((set, get) => ({
  data: createEmptyData(),
  loaded: false,

  init: async () => {
    const { data, warning } = await window.api.loadData()
    set({ data, warning, loaded: true })
  },

  dismissWarning: () => set({ warning: undefined }),

  addTestArea: () => {
    const { data } = get()
    const n = data.areas.length + 1
    const area: Area = {
      id: crypto.randomUUID(),
      name: `Área de prueba ${n}`,
      order: n,
      sortCriterion: 'prioridad'
    }
    set({ data: { ...data, areas: [...data.areas, area] } })
  },

  removeArea: (id) => {
    const { data } = get()
    set({
      data: {
        ...data,
        areas: data.areas.filter((a) => a.id !== id),
        tasks: data.tasks.filter((t) => t.areaId !== id)
      }
    })
  }
}))

// Guardado automático: cada vez que cambian los datos (ya cargados), se guardan.
useDataStore.subscribe((state, prev) => {
  if (!state.loaded || state.data === prev.data) return
  window.api
    .saveData(state.data)
    .then(() => useDataStore.setState({ saveError: undefined }))
    .catch((e: unknown) =>
      useDataStore.setState({ saveError: e instanceof Error ? e.message : String(e) })
    )
})
