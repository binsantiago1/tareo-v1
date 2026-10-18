import { useEffect, useMemo, useState } from 'react'
import { Button } from '@renderer/components/ui/button'
import { AreaDialog } from '@renderer/components/AreaDialog'
import { DeleteAreaDialog } from '@renderer/components/DeleteAreaDialog'
import { PostIt } from '@renderer/components/PostIt'
import { TopBar } from '@renderer/components/TopBar'
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
    removeArea
  } = useDataStore()
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Area | null>(null)
  const [deleting, setDeleting] = useState<Area | null>(null)

  useEffect(() => {
    void init()
  }, [init])

  const areas = useMemo(() => [...data.areas].sort((a, b) => a.order - b.order), [data.areas])
  const deletingTaskCount = deleting ? data.tasks.filter((t) => t.areaId === deleting.id).length : 0

  if (!loaded) return <main className="p-8 text-muted-foreground">Cargando…</main>

  return (
    <div className="flex h-screen flex-col">
      <TopBar onNewArea={() => setCreating(true)} />

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
        {areas.length === 0 ? (
          <div className="mx-auto mt-16 flex max-w-sm flex-col items-center gap-3 text-center">
            <p className="text-lg font-medium">Todavía no tienes áreas</p>
            <p className="text-sm text-muted-foreground">
              Un área es un post-it para agrupar tareas, por ejemplo «Casa» o «Trabajo». Crea la
              primera para empezar.
            </p>
            <Button onClick={() => setCreating(true)}>Nueva área</Button>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(16rem,1fr))] items-start gap-4">
            {areas.map((area) => (
              <PostIt
                key={area.id}
                area={area}
                onEdit={() => setEditing(area)}
                onDelete={() => setDeleting(area)}
              />
            ))}
          </div>
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
        taskCount={deletingTaskCount}
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) removeArea(deleting.id)
          setDeleting(null)
        }}
      />
    </div>
  )
}

export default App
