import { Button } from '@renderer/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle
} from '@renderer/components/ui/alert-dialog'
import type { Area } from '../../../shared/types'

interface Props {
  area: Area | null
  taskCount: number
  onCancel: () => void
  onConfirm: () => void
}

export function DeleteAreaDialog({
  area,
  taskCount,
  onCancel,
  onConfirm
}: Props): React.JSX.Element {
  const tasksText =
    taskCount === 0
      ? 'No tiene tareas.'
      : taskCount === 1
        ? 'Se borrará también 1 tarea.'
        : `Se borrarán también ${taskCount} tareas.`

  return (
    <AlertDialog open={area !== null} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent>
        <AlertDialogTitle>¿Borrar el área «{area?.name}»?</AlertDialogTitle>
        <AlertDialogDescription>
          {tasksText} Esta acción no se puede deshacer.
        </AlertDialogDescription>
        <div className="flex justify-end gap-2">
          <AlertDialogCancel asChild>
            <Button variant="outline">Cancelar</Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button variant="destructive" onClick={onConfirm}>
              Borrar área
            </Button>
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
