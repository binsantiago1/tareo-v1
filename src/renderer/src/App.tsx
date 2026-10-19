import { useEffect, useMemo, useState } from 'react'
import { Button } from '@renderer/components/ui/button'
import { AreaDialog } from '@renderer/components/AreaDialog'
import { ArchiveView } from '@renderer/components/ArchiveView'
import { BackupDialog } from '@renderer/components/BackupDialog'
import { CalendarView } from '@renderer/components/CalendarView'
import { DeleteAreaDialog } from '@renderer/components/DeleteAreaDialog'
import { PostItBoard } from '@renderer/components/PostItBoard'
import { TopBar, type View } from '@renderer/components/TopBar'
import { UndoToast } from '@renderer/components/UndoToast'
import { useDataStore } from '@renderer/store/useDataStore'
import { DEFAULT_NOTE_COLOR, nextFreeColor } from '../../shared/palette'
import type { Area } from '../../shared/types'

function App(): React.JSX.Element {
  const {
    data,
    loaded,
    warning,
    saveError,
    init,
    dismissWarning,
    addArea,
    updateArea,
    removeArea,
    lingering
  } = useDataStore()
  const [view, setView] = useState<View>('lista')
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [backupOpen, setBackupOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Area | null>(null)
  const [deleting, setDeleting] = useState<Area | null>(null)

  useEffect(() => {
    void init()
  }, [init])

  const areas = useMemo(() => [...data.areas].sort((a, b) => a.order - b.order), [data.areas])
  // En el post-it también se ven (tachadas) las tareas recién completadas, unos segundos.
  const visibleOf = (areaId: string): typeof data.tasks =>
    data.tasks.filter((t) => t.areaId === areaId && (!t.completed || t.id in lingering))
  const deletingTasks = deleting ? data.tasks.filter((t) => t.areaId === deleting.id) : []
  const archivedCount = data.tasks.filter((t) => t.completed).length

  if (!loaded) return <main className="p-8 text-muted-foreground">Cargando…</main>

  return (
    <div className="flex h-screen flex-col">
      <TopBar
        view={view}
        archiveOpen={archiveOpen}
        archivedCount={archivedCount}
        onViewChange={(v) => {
          setView(v)
          setArchiveOpen(false)
        }}
        onToggleArchive={() => setArchiveOpen((open) => !open)}
        onOpenBackup={() => setBackupOpen(true)}
        onNewArea={() => {
          setArchiveOpen(false)
          setCreating(true)
        }}
      />

      {warning && (
        <div role="alert" className="m-4 rounded-md border border-destructive p-3 text-sm">
          <p>{warning}</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={dismissWarning}>
            Entendido
          </Button>
        </div>
      )}
      {saveError && (
        <p role="alert" className="m-4 text-sm text-destructive">
          No se pudo guardar: {saveError}
        </p>
      )}

      <main className="flex-1 overflow-y-auto p-6">
        {archiveOpen ? (
          <ArchiveView />
        ) : areas.length === 0 ? (
          <div className="mx-auto mt-16 flex max-w-sm flex-col items-center gap-3 text-center">
            <p className="text-lg font-medium">Todavía no tienes áreas</p>
            <p className="text-sm text-muted-foreground">
              Un área es un post-it para agrupar tareas, por ejemplo «Casa» o «Trabajo». Crea la
              primera para empezar.
            </p>
            <Button onClick={() => setCreating(true)}>Nueva área</Button>
          </div>
        ) : view === 'calendario' ? (
          <CalendarView />
        ) : (
          <PostItBoard
            areas={areas}
            tasksOf={visibleOf}
            onEdit={(area) => setEditing(area)}
            onDelete={(area) => setDeleting(area)}
          />
        )}
      </main>

      <BackupDialog open={backupOpen} onOpenChange={setBackupOpen} />
      <AreaDialog
        open={creating}
        defaultColor={nextFreeColor(areas.map((a) => a.color))}
        onOpenChange={setCreating}
        onSave={addArea}
      />
      <AreaDialog
        key={editing?.id}
        area={editing ?? undefined}
        defaultColor={DEFAULT_NOTE_COLOR}
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        onSave={(values) => editing && updateArea(editing.id, values)}
      />
      <DeleteAreaDialog
        area={deleting}
        taskCount={deletingTasks.length}
        archivedCount={deletingTasks.filter((t) => t.completed).length}
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) removeArea(deleting.id)
          setDeleting(null)
        }}
      />
      <UndoToast />
    </div>
  )
}

export default App
