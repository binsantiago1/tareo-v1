import { create } from 'zustand'
import {
  createEmptyData,
  type Area,
  type AppData,
  type DateOnly,
  type Priority,
  type SortCriterion,
  type Subtask,
  type Task
} from '../../../shared/types'
import {
  addSubtaskTo,
  removeSubtaskFrom,
  restoreTask,
  toggleSubtaskCompleted,
  toggleTaskCompleted
} from '../../../shared/taskRules'
import { isArchiveExpired } from '../../../shared/archive'

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
  /**
   * Tareas recién completadas que siguen a la vista (tachadas) unos segundos antes de pasar
   * al Archivo. Guarda el id de la tarea y la marca de la completación.
   */
  lingering: Record<string, number>
  /** Tareas de `lingering` que ya están haciendo su animación de salida. */
  leaving: Record<string, boolean>
  /** Última área borrada (con sus tareas), para ofrecer "Deshacer" unos segundos. */
  areaUndo?: { key: number; area: Area; tasks: Task[] }
  /** El aviso de área borrada está haciendo su animación de salida. */
  areaUndoLeaving: boolean
  /** Ids de las áreas que están fijadas en el escritorio como post-it flotante. */
  pinned: string[]
  init: () => Promise<void>
  /** Pone o quita el post-it de un área en el escritorio. */
  togglePin: (areaId: string) => void
  dismissWarning: () => void
  /** Sustituye todos los datos (al importar una copia de seguridad). */
  replaceData: (data: AppData) => void
  addArea: (values: AreaValues) => void
  updateArea: (id: string, values: AreaValues) => void
  removeArea: (id: string) => void
  /** Cambia el tamaño del post-it en la ventana principal (sin valores = tamaño automático). */
  setAreaSize: (id: string, size: { width?: number; height?: number }) => void
  /** Todos los post-its (ventana principal y escritorio) vuelven a su tamaño automático. */
  resetNoteSizes: () => void
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
  undoAreaDelete: () => void
  dismissAreaUndo: () => void
  dismissUndo: () => void
  addSubtask: (taskId: string, title: string) => void
  updateSubtask: (taskId: string, subtaskId: string, values: SubtaskValues) => void
  removeSubtask: (taskId: string, subtaskId: string) => void
  /** Pone las subtareas de una tarea en el orden dado (lista de ids). */
  reorderSubtasks: (taskId: string, orderedIds: string[]) => void
  toggleSubtask: (taskId: string, subtaskId: string) => void
  /** Borra las tareas que llevan más de 7 días en el Archivo. */
  purgeExpiredArchive: () => void
  /** Pliega o despliega las subtareas de una tarea. */
  setCollapsed: (taskId: string, collapsed: boolean) => void
}

// Estado interno del guardado y de la escucha de otras ventanas.
let listening = false
let purgeTimer: ReturnType<typeof setInterval> | undefined
const PURGE_EVERY_MS = 60 * 60 * 1000
let skipNextSave = false

/** Tiempo que una tarea completada sigue a la vista (con el aviso "Deshacer"). */
const LINGER_MS = 5000
/** Duración de la animación de salida (tarea y avisos). */
const EXIT_MS = 350
/** Tiempo para deshacer el borrado de un área. */
const AREA_UNDO_MS = 8000

function withoutKey<T>(record: Record<string, T>, key: string): Record<string, T> {
  const copy = { ...record }
  delete copy[key]
  return copy
}

export const useDataStore = create<DataState>((set, get) => {
  const now = (): string => new Date().toISOString()

  /** Muestra el aviso "Deshacer" tras completar una tarea. */
  const offerUndo = (task: Task, subtaskId?: string): void => {
    const key = Date.now()
    set({
      undo: { key, title: task.title, taskId: task.id, subtaskId },
      lingering: { ...get().lingering, [task.id]: key }
    })
    // Pasado el tiempo, la tarea y el aviso "Deshacer" se van a la vez, con una animación.
    setTimeout(() => {
      if (get().lingering[task.id] !== key) return
      set({ leaving: { ...get().leaving, [task.id]: true } })
      setTimeout(() => {
        const state = get()
        if (state.lingering[task.id] !== key) return
        const leaving = { ...state.leaving }
        delete leaving[task.id]
        set({
          lingering: withoutKey(state.lingering, task.id),
          leaving,
          undo: state.undo?.key === key ? undefined : state.undo
        })
      }, EXIT_MS)
    }, LINGER_MS)
  }

  /** Cambia una tarea concreta, dejando el resto igual. */
  const changeTask = (id: string, change: (task: Task) => Task): void => {
    const { data } = get()
    set({ data: { ...data, tasks: data.tasks.map((t) => (t.id === id ? change(t) : t)) } })
  }

  return {
    data: createEmptyData(),
    loaded: false,
    lingering: {},
    leaving: {},
    areaUndoLeaving: false,

    pinned: [],

    init: async () => {
      const { data, warning } = await window.api.loadData()
      set({ data, warning, loaded: true })
      // Las tareas archivadas se borran solas a los 7 días: al abrir y, si la app sigue abierta
      // (por ejemplo con post-its en el escritorio), cada hora.
      get().purgeExpiredArchive()
      if (!purgeTimer) {
        purgeTimer = setInterval(() => get().purgeExpiredArchive(), PURGE_EVERY_MS)
      }
      // Se escuchan los cambios que hacen las otras ventanas (principal y post-its de escritorio).
      if (!listening) {
        listening = true
        window.api.onRemoteData((remote) => {
          skipNextSave = true // viene de otra ventana, que ya lo guardó
          set({ data: remote })
        })
        window.api.onWidgetsChanged((ids) => set({ pinned: ids }))
      }
      set({ pinned: await window.api.listWidgets() })
    },

    togglePin: (areaId) => {
      if (get().pinned.includes(areaId)) void window.api.unpinWidget(areaId)
      else void window.api.pinWidget(areaId)
    },

    dismissWarning: () => set({ warning: undefined }),

    replaceData: (data) =>
      set({
        data,
        undo: undefined,
        lingering: {},
        leaving: {},
        areaUndo: undefined,
        areaUndoLeaving: false
      }),

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

    resetNoteSizes: () => {
      const { data } = get()
      set({
        data: {
          ...data,
          areas: data.areas.map((a) => ({ ...a, width: undefined, height: undefined }))
        }
      })
      void window.api.resetAllWidgetSizes()
    },

    setAreaSize: (id, { width, height }) => {
      const { data } = get()
      set({
        data: { ...data, areas: data.areas.map((a) => (a.id === id ? { ...a, width, height } : a)) }
      })
    },

    removeArea: (id) => {
      const { data } = get()
      const area = data.areas.find((a) => a.id === id)
      const key = Date.now()
      set({
        data: {
          ...data,
          areas: data.areas.filter((a) => a.id !== id),
          tasks: data.tasks.filter((t) => t.areaId !== id)
        },
        // Se guarda el área con todas sus tareas para poder deshacer el borrado unos segundos.
        areaUndo: area
          ? { key, area, tasks: data.tasks.filter((t) => t.areaId === id) }
          : undefined,
        areaUndoLeaving: false
      })
      if (!area) return
      setTimeout(() => {
        if (get().areaUndo?.key !== key) return
        set({ areaUndoLeaving: true })
        setTimeout(() => {
          if (get().areaUndo?.key === key) set({ areaUndo: undefined, areaUndoLeaving: false })
        }, EXIT_MS)
      }, AREA_UNDO_MS)
    },

    undoAreaDelete: () => {
      const { areaUndo, data } = get()
      if (!areaUndo) return
      set({
        data: {
          ...data,
          areas: [...data.areas, areaUndo.area],
          tasks: [...data.tasks, ...areaUndo.tasks]
        },
        areaUndo: undefined,
        areaUndoLeaving: false
      })
    },

    dismissAreaUndo: () => set({ areaUndo: undefined, areaUndoLeaving: false }),

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
      set({
        undo: undefined,
        lingering: withoutKey(get().lingering, undo.taskId),
        leaving: withoutKey(get().leaving, undo.taskId)
      })
      if (undo.subtaskId) {
        changeTask(undo.taskId, (t) => toggleSubtaskCompleted(t, undo.subtaskId!, now()))
      } else {
        changeTask(undo.taskId, (t) => toggleTaskCompleted(t, now()))
      }
    },

    dismissUndo: () => {
      const undo = get().undo
      set({
        undo: undefined,
        lingering: undo ? withoutKey(get().lingering, undo.taskId) : get().lingering,
        leaving: undo ? withoutKey(get().leaving, undo.taskId) : get().leaving
      })
    },

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

    purgeExpiredArchive: () => {
      const { data } = get()
      const now = Date.now()
      const tasks = data.tasks.filter((t) => !isArchiveExpired(t, now))
      if (tasks.length !== data.tasks.length) set({ data: { ...data, tasks } })
    },

    setCollapsed: (taskId, collapsed) =>
      changeTask(taskId, (t) => ({ ...t, collapsed: collapsed || undefined })),

    reorderSubtasks: (taskId, orderedIds) =>
      changeTask(taskId, (t) => ({
        ...t,
        subtasks: orderedIds
          .map((id) => t.subtasks.find((s) => s.id === id))
          .filter((s): s is Subtask => s !== undefined)
      })),

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
  if (skipNextSave) {
    skipNextSave = false
    return
  }
  window.api
    .saveData(state.data)
    .then(() => useDataStore.setState({ saveError: undefined }))
    .catch((e: unknown) =>
      useDataStore.setState({ saveError: e instanceof Error ? e.message : String(e) })
    )
})
