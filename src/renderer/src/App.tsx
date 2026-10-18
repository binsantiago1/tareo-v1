import { useEffect, useMemo, useState } from 'react'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates
} from '@dnd-kit/sortable'
import { Button } from '@renderer/components/ui/button'
import { AreaDialog } from '@renderer/components/AreaDialog'
import { DeleteAreaDialog } from '@renderer/components/DeleteAreaDialog'
import { PostIt } from '@renderer/components/PostIt'
import { ArchiveView } from '@renderer/components/ArchiveView'
import { TopBar, type Screen } from '@renderer/components/TopBar'
import { UndoToast } from '@renderer/components/UndoToast'
import { useDataStore } from '@renderer/store/useDataStore'
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
    reorderAreas
  } = useDataStore()
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )
  const [screen, setScreen] = useState<Screen>('lista')
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Area | null>(null)
  const [deleting, setDeleting] = useState<Area | null>(null)

  useEffect(() => {
    void init()
  }, [init])

  const areas = useMemo(() => [...data.areas].sort((a, b) => a.order - b.order), [data.areas])
  const deletingTasks = deleting ? data.tasks.filter((t) => t.areaId === deleting.id) : []
  const archivedCount = data.tasks.filter((t) => t.completed).length

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
        screen={screen}
        archivedCount={archivedCount}
        onScreenChange={setScreen}
        onNewArea={() => {
          setScreen('lista')
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
        {screen === 'archivo' ? (
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
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleAreaDragEnd}
          >
            <SortableContext items={areas.map((a) => a.id)} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(16rem,1fr))] items-start gap-4">
                {areas.map((area) => (
                  <PostIt
                    key={area.id}
                    area={area}
                    tasks={data.tasks.filter((t) => t.areaId === area.id && !t.completed)}
                    onEdit={() => setEditing(area)}
                    onDelete={() => setDeleting(area)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </main>

      <AreaDialog open={creating} onOpenChange={setCreating} onSave={addArea} />
      <AreaDialog
        key={editing?.id}
        area={editing ?? undefined}
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
