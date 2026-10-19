import { useEffect, useMemo, useState } from 'react'
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, rectSortingStrategy } from '@dnd-kit/sortable'
import { Button } from '@renderer/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@renderer/components/ui/dialog'
import { AreaDialog } from '@renderer/components/AreaDialog'
import { ArchiveView } from '@renderer/components/ArchiveView'
import { BackupDialog } from '@renderer/components/BackupDialog'
import { CalendarView } from '@renderer/components/CalendarView'
import { DeleteAreaDialog } from '@renderer/components/DeleteAreaDialog'
import { GridPostIt } from '@renderer/components/GridPostIt'
import { PostIt } from '@renderer/components/PostIt'
import { SortablePostIt } from '@renderer/components/SortablePostIt'
import { TopBar, type View } from '@renderer/components/TopBar'
import { UndoToast } from '@renderer/components/UndoToast'
import { useLongPressSensors } from '@renderer/lib/dnd'
import { useDataStore } from '@renderer/store/useDataStore'
import { autoGridColumns, type GridColumns } from '../../shared/grid'
import { DEFAULT_NOTE_COLOR, nextFreeColor } from '../../shared/palette'
import type { Area } from '../../shared/types'

type ColumnsSetting = 'auto' | GridColumns

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
    reorderAreas,
    lingering
  } = useDataStore()
  const sensors = useLongPressSensors()
  const [view, setView] = useState<View>('lista')
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [columnsSetting, setColumnsSetting] = useState<ColumnsSetting>('auto')
  const [openAreaId, setOpenAreaId] = useState<string | null>(null)
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
  const pendingOf = (areaId: string): typeof data.tasks =>
    data.tasks.filter((t) => t.areaId === areaId && !t.completed)
  const deletingTasks = deleting ? data.tasks.filter((t) => t.areaId === deleting.id) : []
  const archivedCount = data.tasks.filter((t) => t.completed).length
  const columns: GridColumns =
    columnsSetting === 'auto' ? autoGridColumns(areas.length) : columnsSetting
  // Si el área abierta se borra, el post-it ampliado se cierra solo.
  const openArea = areas.find((a) => a.id === openAreaId)

  const handleAreaDragEnd = ({ active, over }: DragEndEvent): void => {
    if (!over || active.id === over.id) return
    const ids = areas.map((a) => a.id)
    const from = ids.indexOf(String(active.id))
    const to = ids.indexOf(String(over.id))
    if (from === -1 || to === -1) return
    reorderAreas(arrayMove(ids, from, to))
  }

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
        ) : view === 'lista' ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleAreaDragEnd}
          >
            <SortableContext items={areas.map((a) => a.id)} strategy={rectSortingStrategy}>
              <div className="flex flex-wrap items-start gap-4">
                {areas.map((area) => (
                  <SortablePostIt
                    key={area.id}
                    area={area}
                    tasks={visibleOf(area.id)}
                    onEdit={() => setEditing(area)}
                    onDelete={() => setDeleting(area)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div className="grid gap-4">
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              Columnas:
              <select
                value={columnsSetting}
                onChange={(e) => {
                  const v = e.target.value
                  setColumnsSetting(v === 'auto' ? 'auto' : (Number(v) as GridColumns))
                }}
                className="h-8 rounded-md border border-input bg-field px-2 text-sm text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                <option value="auto">Automático ({autoGridColumns(areas.length)})</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
              </select>
            </label>
            <div
              className="grid gap-4"
              style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
            >
              {areas.map((area) => (
                <GridPostIt
                  key={area.id}
                  area={area}
                  tasks={pendingOf(area.id)}
                  onOpen={() => setOpenAreaId(area.id)}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Post-it completo, abierto desde la Cuadrícula. */}
      <Dialog open={openArea !== undefined} onOpenChange={(open) => !open && setOpenAreaId(null)}>
        <DialogContent
          aria-describedby={undefined}
          className="max-h-[90vh] max-w-xl overflow-y-auto border-0 bg-transparent p-0 shadow-none"
        >
          <DialogTitle className="sr-only">Área {openArea?.name}</DialogTitle>
          {openArea && (
            <PostIt
              area={openArea}
              tasks={visibleOf(openArea.id)}
              onEdit={() => setEditing(openArea)}
              onDelete={() => setDeleting(openArea)}
            />
          )}
        </DialogContent>
      </Dialog>

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
