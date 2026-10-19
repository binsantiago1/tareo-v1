import { useState } from 'react'
import { INTERACTIVE } from '@renderer/lib/dnd'

/** Tiempo que hay que mantener pulsado antes de poder mover la ventana (igual que en la app). */
const HOLD_MS = 250
/** Si el cursor se mueve más de esto (en píxeles) durante la espera, se cancela. */
const TOLERANCE_PX = 8

/**
 * Mover la ventana de un post-it de escritorio manteniendo pulsado el clic en cualquier parte
 * de la nota, igual que se mueven los post-its en la ventana principal. No funciona sobre las
 * tareas (ahí el arrastre cambia el orden), ni sobre botones, campos, asas ni barras de desplazamiento.
 */
export function useWindowLongPressDrag(enabled: boolean): {
  moving: boolean
  onPointerDown: (e: React.PointerEvent<HTMLElement>) => void
} {
  const [moving, setMoving] = useState(false)

  const onPointerDown = (e: React.PointerEvent<HTMLElement>): void => {
    if (!enabled || e.button !== 0 || !e.isPrimary) return
    const target = e.target as HTMLElement
    // Los menús y diálogos se pintan fuera de la nota, pero React les hace llegar el evento.
    if (!e.currentTarget.contains(target)) return
    if (target.closest(`${INTERACTIVE}, li`)) return
    // Pulsar en una barra de desplazamiento no mueve la ventana.
    const scroller = target.closest<HTMLElement>('.postit-scroll')
    if (scroller && target === scroller) {
      const rect = scroller.getBoundingClientRect()
      if (
        e.clientX - rect.left >= scroller.clientWidth ||
        e.clientY - rect.top >= scroller.clientHeight
      ) {
        return
      }
    }

    const startClient = { x: e.clientX, y: e.clientY }
    const startScreen = { x: e.screenX, y: e.screenY }
    // La posición de la ventana se le pide al sistema (window.screenX puede ir un instante atrasado).
    let startWindow: { x: number; y: number } | undefined
    void window.api.getWidgetPosition().then((position) => {
      startWindow = position
    })
    let active = false

    const timer = setTimeout(() => {
      active = true
      setMoving(true)
    }, HOLD_MS)

    const stop = (): void => {
      clearTimeout(timer)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', stop)
      window.removeEventListener('pointercancel', stop)
      setMoving(false)
    }
    const move = (event: PointerEvent): void => {
      if (!active) {
        // Si el cursor se mueve antes de que pase el tiempo, no era un arrastre.
        const distance = Math.hypot(event.clientX - startClient.x, event.clientY - startClient.y)
        if (distance > TOLERANCE_PX) stop()
        return
      }
      if (!startWindow) return
      window.api.moveWidget(
        startWindow.x + event.screenX - startScreen.x,
        startWindow.y + event.screenY - startScreen.y
      )
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', stop)
    window.addEventListener('pointercancel', stop)
  }

  return { moving, onPointerDown }
}
