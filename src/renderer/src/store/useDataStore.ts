import { create } from 'zustand'
import {
  createEmptyData,
  type Area,
  type AppData,
  type DateOnly,
  type Priority,
  type SortCriterion,
  type Task
} from '../../../shared/types'
import {
  addSubtaskTo,
  removeSubtaskFrom,
  restoreTask,
  toggleSubtaskCompleted,
  toggleTaskCompleted
} from '../../../shared/taskRules'

interface AreaValues {
  name: string
  note: string
  color: string
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
  /** Última tarea completada, para ofrecer "Deshacer" unos segundos. */
  undo?: { key: number; title: string; taskId: string; subtaskId?: string }
  init: () => Promise<void>
  dismissWarning: () => void
  /** Sustituye todos los datos (al importar una copia de seguridad). */
  replaceData: (data: AppData) => void
  addArea: (values: AreaValues) => void
  updateArea: (id: string, values: AreaValues) => void
  removeArea: (id: string) => void
  /** Pone los post-its en el orden dado (lista de ids de áreas). */
  reorderAreas: (orderedIds: string[]) => void
  setSortCriterion: (areaId: string, criterion: SortCriterion) => void
  /** Guarda el orden arrastrado de las tareas pendientes y pasa el área a "personalizado". */
  reorderTasks: (areaId: string, orderedPendingIds: string[]) => void
  addTask: (areaId: string, title: string) => void
  updateTask: (id: string, values: TaskValues) => void
  removeTask: (id: string) => void
  toggleTask: (id: string) => void
  /** Saca una tarea del Archivo y la deja pendiente. */
  restoreTask: (id: string) => void
  undoCompletion: () => void
  dismissUndo: () => void
  addSubtask: (taskId: string, title: string) => void
  updateSubtask: (taskId: string, subtaskId: string, values: SubtaskValues) => void
  removeSubtask: (taskId: string, subtaskId: string) => void
  toggleSubtask: (taskId: string, subtaskId: string) => void
}

export const useDataStore = create<DataState>((set, get) => {
  const now = (): string => new Date().toISOString()

  /** Muestra el aviso "Deshacer" tras completar una tarea. */
  const offerUndo = (task: Task, subtaskId?: string): void => {
    set({ undo: { key: Date.now(), title: task.title, taskId: task.id, subtaskId } })
  }

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

    replaceData: (data) => set({ data, undo: undefined }),

    addArea: ({ name, note, color }) => {
      const { data } = get()
      const order = data.areas.reduce((max, a) => Math.max(max, a.order), 0) + 1
      const area: Area = {
        id: crypto.randomUUID(),
        name,
        note: note || undefined,
        color,
        order,
        sortCriterion: 'prioridad'
      }
      set({ data: { ...data, areas: [...data.areas, area] } })
    },

    updateArea: (id, { name, note, color }) => {
      const { data } = get()
      set({
        data: {
          ...data,
          areas: data.areas.map((a) =>
            a.id === id ? { ...a, name, note: note || undefined, color } : a
          )
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

    reorderAreas: (orderedIds) => {
      const { data } = get()
      const position = new Map(orderedIds.map((id, i) => [id, i + 1]))
      set({
        data: {
          ...data,
          areas: data.areas.map((a) => ({ ...a, order: position.get(a.id) ?? a.order }))
        }
      })
    },

    setSortCriterion: (areaId, criterion) => {
      const { data } = get()
      set({
        data: {
          ...data,
          areas: data.areas.map((a) => (a.id === areaId ? { ...a, sortCriterion: criterion } : a))
        }
      })
    },

    reorderTasks: (areaId, orderedPendingIds) => {
      const { data } = get()
      // Las completadas se quedan detrás, en el orden personal que ya tenían.
      const completedIds = data.tasks
        .filter((t) => t.areaId === areaId && !orderedPendingIds.includes(t.id))
        .sort((a, b) => a.personalOrder - b.personalOrder)
        .map((t) => t.id)
      const position = new Map([...orderedPendingIds, ...completedIds].map((id, i) => [id, i + 1]))
      set({
        data: {
          ...data,
          areas: data.areas.map((a) =>
            a.id === areaId ? { ...a, sortCriterion: 'personalizado' } : a
          ),
          tasks: data.tasks.map((t) =>
            t.areaId === areaId ? { ...t, personalOrder: position.get(t.id) ?? t.personalOrder } : t
          )
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

    toggleTask: (id) => {
      const before = get().data.tasks.find((t) => t.id === id)
      changeTask(id, (t) => toggleTaskCompleted(t, now()))
      const after = get().data.tasks.find((t) => t.id === id)
      if (before && after?.completed && !before.completed) offerUndo(after)
    },

    restoreTask: (id) => changeTask(id, (t) => restoreTask(t)),

    undoCompletion: () => {
      const undo = get().undo
      if (!undo) return
      set({ undo: undefined })
      if (undo.subtaskId) {
        changeTask(undo.taskId, (t) => toggleSubtaskCompleted(t, undo.subtaskId!, now()))
      } else {
        changeTask(undo.taskId, (t) => toggleTaskCompleted(t, now()))
      }
    },

    dismissUndo: () => set({ undo: undefined }),

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

    toggleSubtask: (taskId, subtaskId) => {
      const before = get().data.tasks.find((t) => t.id === taskId)
      changeTask(taskId, (t) => toggleSubtaskCompleted(t, subtaskId, now()))
      const after = get().data.tasks.find((t) => t.id === taskId)
      // Si esta subtarea fue la que completó la tarea, se puede deshacer.
      if (before && after?.completed && !before.completed) offerUndo(after, subtaskId)
    }
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
