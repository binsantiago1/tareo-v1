import { useEffect, useRef, useState } from 'react'
import { AreaDialog } from '@renderer/components/AreaDialog'
import { PostIt } from '@renderer/components/PostIt'
import { useTheme } from '@renderer/lib/theme'
import { cn } from '@renderer/lib/utils'
import { useDataStore } from '@renderer/store/useDataStore'
import { DEFAULT_NOTE_COLOR } from '../../shared/palette'

/** Alto mínimo de la ventana mientras hay un diálogo o un menú abierto (para que quepan). */
const DIALOG_MIN_HEIGHT = 600
const MENU_MIN_HEIGHT = 360

/**
 * Post-it de escritorio: una ventana flotante con el post-it de un área, completo y editable.
 * Comparte los datos con la ventana principal (los cambios se ven en las dos al momento).
 */
export default function WidgetApp({ areaId }: { areaId: string }): React.JSX.Element | null {
  const data = useDataStore((s) => s.data)
  const loaded = useDataStore((s) => s.loaded)
  const lingering = useDataStore((s) => s.lingering)
  const init = useDataStore((s) => s.init)
  const updateArea = useDataStore((s) => s.updateArea)
  const [editing, setEditing] = useState(false)
  // null = todavía no se sabe; true = el usuario fijó el tamaño con las asas; false = se ajusta solo
  const [userSized, setUserSized] = useState<boolean | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  useTheme() // aplica el tema (y lo sigue si se cambia en la ventana principal)

  useEffect(() => {
    void init()
    void window.api.getWidgetInfo().then((info) => setUserSized(info.userSized))
    // Si se pulsa "Restablecer tamaño de notas" en la ventana principal, este post-it vuelve al tamaño automático.
    return window.api.onWidgetSizeReset(() => setUserSized(false))
  }, [init])

  const area = data.areas.find((a) => a.id === areaId)
  // Como en la ventana principal: las tareas recién completadas se quedan unos segundos, tachadas.
  const tasks = data.tasks.filter((t) => t.areaId === areaId && (!t.completed || t.id in lingering))
  const hasArea = area !== undefined

  // La ventana se ajusta sola a la altura del post-it (el sistema no deja redimensionar
  // ventanas transparentes) y crece mientras haya un diálogo o un menú abierto.
  useEffect(() => {
    const root = rootRef.current
    if (!hasArea || !root) return
    const report = (): void => {
      const overlay = document.querySelector('[role="dialog"], [role="alertdialog"]')
        ? DIALOG_MIN_HEIGHT
        : document.querySelector('[role="menu"]')
          ? MENU_MIN_HEIGHT
          : 0
      // Con el tamaño fijado a mano, el contenido no manda: solo se avisa de los menús abiertos.
      const content = userSized ? 0 : Math.ceil(root.getBoundingClientRect().height)
      window.api.reportWidgetHeight(content, overlay)
    }
    const resize = new ResizeObserver(report)
    resize.observe(root)
    const mutation = new MutationObserver(report)
    mutation.observe(document.body, { childList: true })
    report()
    return () => {
      resize.disconnect()
      mutation.disconnect()
    }
  }, [hasArea, userSized])

  // Si el área se borra, el proceso principal cierra esta ventana.
  if (!loaded || !area || userSized === null) return null

  return (
    <>
      <div ref={rootRef} className={cn('box-border p-4', userSized && 'h-screen')}>
        <PostIt
          area={area}
          tasks={tasks}
          widget={{ onClose: () => void window.api.unpinWidget(area.id) }}
          frame={{ width: '100%', height: userSized ? '100%' : undefined }}
          resize={{
            min: { width: 200, height: 120 },
            max: { width: 2400, height: 2400 },
            // La ventana mide lo que el post-it más su margen transparente (16 a cada lado).
            onResize: (size) => {
              setUserSized(true)
              window.api.setWidgetSize(Math.round(size.width + 32), Math.round(size.height + 32))
            },
            onReset: () => {
              setUserSized(false)
              window.api.resetWidgetSize()
            }
          }}
          onEdit={() => setEditing(true)}
        />
      </div>
      <AreaDialog
        area={area}
        defaultColor={DEFAULT_NOTE_COLOR}
        open={editing}
        onOpenChange={setEditing}
        onSave={(values) => updateArea(area.id, values)}
      />
    </>
  )
}
