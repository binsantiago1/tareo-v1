/** Fecha límite: solo fecha, formato "YYYY-MM-DD" (sin hora ni zona horaria). */
export type DateOnly = string

/** 0 = sin prioridad, 1 = !, 2 = !!, 3 = !!! */
export type Priority = 0 | 1 | 2 | 3

export type SortCriterion = 'prioridad' | 'tiempoRestante' | 'fechaCreacion' | 'personalizado'

export interface Subtask {
  id: string
  title: string
  note?: string
  completed: boolean
}

export interface Task {
  id: string
  areaId: string
  title: string
  note?: string
  priority: Priority
  dueDate?: DateOnly
  /** Momento de creación (ISO con hora, solo para ordenar). */
  createdAt: string
  completed: boolean
  completedAt?: string
  /** Posición dentro del área para el orden personalizado. */
  personalOrder: number
  subtasks: Subtask[]
}

export interface Area {
  id: string
  name: string
  note?: string
  /** Posición del post-it. */
  order: number
  sortCriterion: SortCriterion
  /** Color del post-it (id de la paleta). Las áreas antiguas pueden no tenerlo. */
  color?: string
}

export interface AppData {
  /** Versión del formato del archivo, para poder migrar datos en el futuro. */
  version: 1
  areas: Area[]
  tasks: Task[]
}

export function createEmptyData(): AppData {
  return { version: 1, areas: [], tasks: [] }
}

/** Resultado de cargar el archivo de datos. */
export interface LoadResult {
  data: AppData
  /** Mensaje para el usuario si hubo que recuperar o apartar un archivo dañado. */
  warning?: string
}

/** API que el proceso principal ofrece a la interfaz. */
export interface DataApi {
  loadData: () => Promise<LoadResult>
  saveData: (data: AppData) => Promise<void>
  /** Abre "Guardar como" y escribe una copia de seguridad con los datos dados. */
  exportBackup: (data: AppData) => Promise<ExportResult>
  /** Abre "Abrir archivo", valida la copia y la devuelve (no la aplica por sí sola). */
  importBackup: () => Promise<ImportResult>
}

export type ExportResult =
  { status: 'ok'; path: string } | { status: 'canceled' } | { status: 'error'; message: string }

export type ImportResult =
  { status: 'ok'; data: AppData } | { status: 'canceled' } | { status: 'error'; message: string }
