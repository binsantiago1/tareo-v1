import { create } from 'zustand'
import { createEmptyData, type Area, type AppData } from '../../../shared/types'

interface AreaValues {
  name: string
  note: string
}

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
  addArea: (values: AreaValues) => void
  updateArea: (id: string, values: AreaValues) => void
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

  addArea: ({ name, note }) => {
    const { data } = get()
    const order = data.areas.reduce((max, a) => Math.max(max, a.order), 0) + 1
    const area: Area = {
      id: crypto.randomUUID(),
      name,
      note: note || undefined,
      order,
      sortCriterion: 'prioridad'
    }
    set({ data: { ...data, areas: [...data.areas, area] } })
  },

  updateArea: (id, { name, note }) => {
    const { data } = get()
    set({
      data: {
        ...data,
        areas: data.areas.map((a) => (a.id === id ? { ...a, name, note: note || undefined } : a))
      }
    })
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
