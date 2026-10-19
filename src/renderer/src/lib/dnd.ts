import { PointerSensor, useSensor, useSensors, type PointerSensorOptions } from '@dnd-kit/core'
import type { PointerEvent } from 'react'

/** Elementos con su propia función: pulsarlos nunca empieza un arrastre. */
export const INTERACTIVE =
  'input, textarea, select, button, a, label, [role="switch"], [role="menuitem"], [contenteditable="true"], [data-resize-handle]'

/** Tiempo que hay que mantener pulsado antes de poder arrastrar. */
const HOLD_MS = 250
/** Si el cursor se mueve más de esto (en píxeles) durante la espera, se cancela el arrastre. */
const HOLD_TOLERANCE_PX = 8

/**
 * Sensor de arrastre por pulsación larga: se mantiene pulsado el clic sobre el elemento
 * (no hay "asas"). Si se pulsa sobre un botón, casilla o campo de texto, no arrastra.
 */
export class LongPressSensor extends PointerSensor {
  static activators = [
    {
      eventName: 'onPointerDown' as const,
      handler: (reactEvent: PointerEvent, { onActivation }: PointerSensorOptions): boolean => {
        const event = reactEvent.nativeEvent
        if (!event.isPrimary || event.button !== 0) return false
        const target = event.target as HTMLElement
        // Los diálogos y menús se pintan fuera del elemento, pero React les hace llegar
        // el evento igualmente: si el clic no fue dentro del elemento, no se arrastra.
        if (!reactEvent.currentTarget.contains(target)) return false
        if (target.closest(INTERACTIVE)) return false
        onActivation?.({ event })
        return true
      }
    }
  ]
}

export function useLongPressSensors(): ReturnType<typeof useSensors> {
  return useSensors(
    useSensor(LongPressSensor, {
      activationConstraint: { delay: HOLD_MS, tolerance: HOLD_TOLERANCE_PX }
    })
  )
}
