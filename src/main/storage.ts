import { promises as fs } from 'fs'
import { join } from 'path'
import type { AppData, LoadResult } from '../shared/types'

const DATA_FILE = 'datos.json'
const BACKUP_COUNT = 5
/** Mínimo de tiempo entre dos copias de seguridad (para no rotarlas en cada cambio). */
const BACKUP_MIN_AGE_MS = 5 * 60 * 1000

function emptyData(): AppData {
  return { version: 1, areas: [], tasks: [] }
}

function isValidData(value: unknown): value is AppData {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return v.version === 1 && Array.isArray(v.areas) && Array.isArray(v.tasks)
}

async function readJson(path: string): Promise<AppData | null> {
  try {
    const parsed: unknown = JSON.parse(await fs.readFile(path, 'utf-8'))
    return isValidData(parsed) ? parsed : null
  } catch {
    return null
  }
}

async function exists(path: string): Promise<boolean> {
  try {
    await fs.access(path)
    return true
  } catch {
    return false
  }
}

function backupPath(dir: string, n: number): string {
  return join(dir, `datos.copia${n}.json`)
}

/** Carga los datos. Nunca lanza: si algo falla, devuelve datos vacíos y un aviso. */
export async function loadData(dir: string): Promise<LoadResult> {
  const file = join(dir, DATA_FILE)
  if (!(await exists(file))) {
    // ¿Primera vez, o se perdió el archivo principal pero quedan copias?
    for (let n = 1; n <= BACKUP_COUNT; n++) {
      const fromBackup = await readJson(backupPath(dir, n))
      if (fromBackup) {
        return {
          data: fromBackup,
          warning: 'No se encontró el archivo de datos; se recuperó la última copia de seguridad.'
        }
      }
    }
    return { data: emptyData() }
  }

  const data = await readJson(file)
  if (data) return { data }

  // Archivo dañado: se conserva aparte (nunca se borra) y se intenta recuperar una copia.
  const damagedName = `datos.danado-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
  try {
    await fs.rename(file, join(dir, damagedName))
  } catch {
    // Si no se puede renombrar, se sigue igualmente; no se pierde nada porque no se borra.
  }
  for (let n = 1; n <= BACKUP_COUNT; n++) {
    const fromBackup = await readJson(backupPath(dir, n))
    if (fromBackup) {
      return {
        data: fromBackup,
        warning: `El archivo de datos estaba dañado. Se guardó aparte como "${damagedName}" y se recuperó la última copia de seguridad.`
      }
    }
  }
  return {
    data: emptyData(),
    warning: `El archivo de datos estaba dañado y no había copia de seguridad. Se guardó aparte como "${damagedName}" y se empezó vacío.`
  }
}

/** Rota las copias: copia1 es la más reciente. Solo si la última tiene más de 5 minutos. */
async function rotateBackups(dir: string, file: string): Promise<void> {
  if (!(await exists(file))) return
  // No copiar un archivo principal dañado sobre las copias buenas.
  if (!(await readJson(file))) return
  try {
    const stat = await fs.stat(backupPath(dir, 1))
    if (Date.now() - stat.mtimeMs < BACKUP_MIN_AGE_MS) return
  } catch {
    // no hay copia1 todavía: se crea
  }
  for (let n = BACKUP_COUNT; n >= 2; n--) {
    if (await exists(backupPath(dir, n - 1))) {
      await fs.rename(backupPath(dir, n - 1), backupPath(dir, n)).catch(() => undefined)
    }
  }
  await fs.copyFile(file, backupPath(dir, 1))
}

let queue: Promise<void> = Promise.resolve()

/** Guarda de forma segura: archivo temporal + renombrar. Los guardados se hacen en fila. */
export function saveData(dir: string, data: AppData): Promise<void> {
  const task = queue.then(async () => {
    await fs.mkdir(dir, { recursive: true })
    const file = join(dir, DATA_FILE)
    const tmp = file + '.tmp'
    await rotateBackups(dir, file)
    const handle = await fs.open(tmp, 'w')
    try {
      await handle.writeFile(JSON.stringify(data, null, 2), 'utf-8')
      await handle.sync()
    } finally {
      await handle.close()
    }
    await fs.rename(tmp, file)
  })
  // Un fallo no debe bloquear los guardados siguientes.
  queue = task.catch(() => undefined)
  return task
}

/** Lee el texto de una copia de seguridad. Devuelve null si no es un archivo de datos válido. */
export function parseBackup(text: string): AppData | null {
  try {
    const parsed: unknown = JSON.parse(text)
    return isValidData(parsed) ? parsed : null
  } catch {
    return null
  }
}

/**
 * Guarda una copia del archivo actual antes de que una importación lo sustituya,
 * para no perder nunca los datos de antes. Devuelve el nombre de la copia, o null si no había archivo.
 */
export async function snapshotBeforeImport(dir: string): Promise<string | null> {
  const file = join(dir, DATA_FILE)
  if (!(await exists(file))) return null
  const name = `datos.antes-de-importar-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
  await fs.copyFile(file, join(dir, name))
  return name
}
