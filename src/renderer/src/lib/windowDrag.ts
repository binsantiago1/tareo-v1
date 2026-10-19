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
 * El movimiento en sí lo hace el proceso principal siguiendo al cursor.
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
    let active = false

    const timer = setTimeout(() => {
      active = true
      setMoving(true)
      window.api.startWidgetMove()
    }, HOLD_MS)

    const stop = (): void => {
      clearTimeout(timer)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', stop)
      window.removeEventListener('pointercancel', stop)
      window.removeEventListener('blur', stop)
      if (active) window.api.endWidgetMove()
      setMoving(false)
    }
    const move = (event: PointerEvent): void => {
      // Si el botón ya no está pulsado (se soltó fuera de la ventana), se termina.
      if (event.buttons === 0 && event.pointerType === 'mouse') {
        stop()
        return
      }
      if (!active) {
        // Si el cursor se mueve antes de que pase el tiempo, no era un arrastre.
        const distance = Math.hypot(event.clientX - startClient.x, event.clientY - startClient.y)
        if (distance > TOLERANCE_PX) stop()
      }
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', stop)
    window.addEventListener('pointercancel', stop)
    window.addEventListener('blur', stop)
  }

  return { moving, onPointerDown }
}
