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
  /** Las subtareas están plegadas (ocultas) en el post-it. */
  collapsed?: boolean
}

export interface Area {
  id: string
  name: string
  note?: string
  /** Posición del post-it. */
  order: number
  sortCriterion: SortCriterion
  /** Tamaño del post-it en la ventana principal, en píxeles (si se cambió a mano). */
  width?: number
  height?: number
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
  /** Avisa cuando OTRA ventana de la app (la principal o un post-it de escritorio) cambió los datos. */
  onRemoteData: (callback: (data: AppData) => void) => () => void
  /** Ids de las áreas que están fijadas en el escritorio. */
  listWidgets: () => Promise<string[]>
  onWidgetsChanged: (callback: (areaIds: string[]) => void) => () => void
  /** Pone el post-it de un área en el escritorio (ventana flotante que se recuerda al reiniciar). */
  pinWidget: (areaId: string) => Promise<void>
  /** Quita el post-it del escritorio (el área no se borra). */
  unpinWidget: (areaId: string) => Promise<void>
  /** El post-it de escritorio informa de lo que mide su contenido y de si hay un menú/diálogo abierto. */
  reportWidgetHeight: (content: number, overlay: number) => void
  /** ¿Este post-it de escritorio tiene un tamaño fijado a mano (o se ajusta solo al contenido)? */
  getWidgetInfo: () => Promise<{ userSized: boolean }>
  /** El usuario cambió el tamaño de este post-it de escritorio con las asas (tamaño de la ventana). */
  setWidgetSize: (width: number, height: number) => void
  /** Vuelve al tamaño automático. */
  resetWidgetSize: () => void
  /** Pone todos los post-its de escritorio en su tamaño automático. */
  resetAllWidgetSizes: () => Promise<void>
  /** Avisa a un post-it de escritorio de que su tamaño se restableció desde la ventana principal. */
  onWidgetSizeReset: (callback: () => void) => () => void
  /** Empieza a mover la ventana de este post-it: sigue al cursor hasta que se llame a endWidgetMove. */
  startWidgetMove: () => void
  endWidgetMove: () => void
}

export type ExportResult =
  { status: 'ok'; path: string } | { status: 'canceled' } | { status: 'error'; message: string }

export type ImportResult =
  { status: 'ok'; data: AppData } | { status: 'canceled' } | { status: 'error'; message: string }
