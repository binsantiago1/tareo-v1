import { Button } from '@renderer/components/ui/button'

function App(): React.JSX.Element {
  return (
    <main className="flex h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-3xl font-semibold">Pendientes</h1>
      <p className="text-muted-foreground">Aquí aparecerán tus áreas y tareas.</p>
      <Button>Botón de prueba</Button>
    </main>
  )
}

export default App
