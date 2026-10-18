import { create } from 'zustand'
import {
  createEmptyData,
  type Area,
  type AppData,
  type DateOnly,
  type Priority,
  type Task
} from '../../../shared/types'
import {
  addSubtaskTo,
  removeSubtaskFrom,
  toggleSubtaskCompleted,
  toggleTaskCompleted
} from '../../../shared/taskRules'

interface AreaValues {
  name: string
  note: string
}

export interface TaskValues {
  title: string
  note: string
  priority: Priority
  dueDate?: DateOnly
}

export interface SubtaskValues {
  title: string
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
  addTask: (areaId: string, title: string) => void
  updateTask: (id: string, values: TaskValues) => void
  removeTask: (id: string) => void
  toggleTask: (id: string) => void
  addSubtask: (taskId: string, title: string) => void
  updateSubtask: (taskId: string, subtaskId: string, values: SubtaskValues) => void
  removeSubtask: (taskId: string, subtaskId: string) => void
  toggleSubtask: (taskId: string, subtaskId: string) => void
}

export const useDataStore = create<DataState>((set, get) => {
  const now = (): string => new Date().toISOString()

  /** Cambia una tarea concreta, dejando el resto igual. */
  const changeTask = (id: string, change: (task: Task) => Task): void => {
    const { data } = get()
    set({ data: { ...data, tasks: data.tasks.map((t) => (t.id === id ? change(t) : t)) } })
  }

  return {
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
    },

    addTask: (areaId, title) => {
      const { data } = get()
      const personalOrder =
        data.tasks
          .filter((t) => t.areaId === areaId)
          .reduce((m, t) => Math.max(m, t.personalOrder), 0) + 1
      const task: Task = {
        id: crypto.randomUUID(),
        areaId,
        title,
        priority: 0,
        createdAt: now(),
        completed: false,
        personalOrder,
        subtasks: []
      }
      set({ data: { ...data, tasks: [...data.tasks, task] } })
    },

    updateTask: (id, { title, note, priority, dueDate }) =>
      changeTask(id, (t) => ({ ...t, title, note: note || undefined, priority, dueDate })),

    removeTask: (id) => {
      const { data } = get()
      set({ data: { ...data, tasks: data.tasks.filter((t) => t.id !== id) } })
    },

    toggleTask: (id) => changeTask(id, (t) => toggleTaskCompleted(t, now())),

    addSubtask: (taskId, title) =>
      changeTask(taskId, (t) =>
        addSubtaskTo(t, { id: crypto.randomUUID(), title, completed: false }, now())
      ),

    updateSubtask: (taskId, subtaskId, { title, note }) =>
      changeTask(taskId, (t) => ({
        ...t,
        subtasks: t.subtasks.map((s) =>
          s.id === subtaskId ? { ...s, title, note: note || undefined } : s
        )
      })),

    removeSubtask: (taskId, subtaskId) =>
      changeTask(taskId, (t) => removeSubtaskFrom(t, subtaskId, now())),

    toggleSubtask: (taskId, subtaskId) =>
      changeTask(taskId, (t) => toggleSubtaskCompleted(t, subtaskId, now()))
  }
})

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
