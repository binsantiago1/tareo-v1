import { ConfirmDialog } from '@renderer/components/ConfirmDialog'
import type { Area } from '../../../shared/types'

interface Props {
  area: Area | null
  taskCount: number
  /** Cuántas de esas tareas ya están completadas en el Archivo. */
  archivedCount: number
  onCancel: () => void
  onConfirm: () => void
}

/** Confirmación para borrar un área: avisa de cuántas tareas se borran con ella. */
export function DeleteAreaDialog({
  area,
  taskCount,
  archivedCount,
  onCancel,
  onConfirm
}: Props): React.JSX.Element {
  const tasksText =
    taskCount === 0
      ? 'No tiene tareas.'
      : taskCount === 1
        ? 'Se borrará también 1 tarea'
        : `Se borrarán también ${taskCount} tareas`
  const archivedText =
    archivedCount > 0
      ? ` (${archivedCount === 1 ? '1 está' : `${archivedCount} están`} completada${archivedCount === 1 ? '' : 's'} en el Archivo).`
      : taskCount > 0
        ? '.'
        : ''

  return (
    <ConfirmDialog
      open={area !== null}
      title={`¿Borrar el área «${area?.name ?? ''}»?`}
      description={`${tasksText}${archivedText} Podrás deshacerlo durante unos segundos.`}
      confirmLabel="Borrar área"
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  )
}
