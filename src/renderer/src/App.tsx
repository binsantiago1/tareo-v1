import { useEffect } from 'react'
import { Button } from '@renderer/components/ui/button'
import { useDataStore } from '@renderer/store/useDataStore'

// Pantalla TEMPORAL de la Fase 2 para comprobar el guardado. La Fase 3 la sustituye.
function App(): React.JSX.Element {
  const { data, loaded, warning, saveError, init, dismissWarning, addTestArea, removeArea } =
    useDataStore()

  useEffect(() => {
    void init()
  }, [init])

  if (!loaded) return <main className="p-8 text-muted-foreground">Cargando…</main>

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-4 p-8">
      <h1 className="text-3xl font-semibold">Pendientes</h1>

      {warning && (
        <div role="alert" className="rounded-md border border-destructive p-3 text-sm">
          <p>{warning}</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={dismissWarning}>
            Entendido
          </Button>
        </div>
      )}
      {saveError && (
        <p role="alert" className="text-sm text-destructive">
          No se pudo guardar: {saveError}
        </p>
      )}

      <p className="text-sm text-muted-foreground">
        Prueba de guardado (temporal): crea áreas, cierra la app y ábrela otra vez.
      </p>
      <div>
        <Button onClick={addTestArea}>Añadir área de prueba</Button>
      </div>

      {data.areas.length === 0 ? (
        <p className="text-muted-foreground">Todavía no hay áreas.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {data.areas.map((area) => (
            <li
              key={area.id}
              className="flex items-center justify-between rounded-md border bg-card p-3"
            >
              <span>{area.name}</span>
              <Button variant="ghost" size="sm" onClick={() => removeArea(area.id)}>
                Borrar
              </Button>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}

export default App
