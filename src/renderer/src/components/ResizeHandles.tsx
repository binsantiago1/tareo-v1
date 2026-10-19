export interface Size {
  width: number
  height: number
}

interface Props {
  /** Tamaño actual del post-it. */
  getSize: () => Size
  /** Se llama mientras se arrastra (final = false) y una última vez al soltar (final = true). */
  onResize: (size: Size, final: boolean) => void
  /** Doble clic en la esquina: vuelve al tamaño automático. */
  onReset: () => void
  min: Size
  max: Size
}

type Axis = 'x' | 'y' | 'xy'

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max)

interface HandleProps extends Omit<Props, 'onReset'> {
  axis: Axis
  className: string
  title?: string
  onDoubleClick?: () => void
}

/** Una asa: se agarra con el ratón y mueve el ancho, el alto o las dos cosas. */
function Handle({
  axis,
  className,
  title,
  onDoubleClick,
  getSize,
  onResize,
  min,
  max
}: HandleProps): React.JSX.Element {
  return (
    <span
      data-resize-handle
      aria-hidden="true"
      title={title}
      className={className}
      onDoubleClick={onDoubleClick}
      onPointerDown={(e) => {
        if (e.button !== 0) return
        e.preventDefault()
        e.stopPropagation()
        const startX = e.clientX
        const startY = e.clientY
        const start = getSize()
        let last: Size | undefined
        let frame: number | undefined

        // Se escucha en toda la ventana: así el arrastre sigue aunque el cursor salga del asa.
        const move = (event: PointerEvent): void => {
          last = {
            width: clamp(
              start.width + (axis === 'y' ? 0 : event.clientX - startX),
              min.width,
              max.width
            ),
            height: clamp(
              start.height + (axis === 'x' ? 0 : event.clientY - startY),
              min.height,
              max.height
            )
          }
          // Como mucho una actualización por imagen, para que sea fluido.
          if (frame === undefined) {
            frame = requestAnimationFrame(() => {
              frame = undefined
              if (last) onResize(last, false)
            })
          }
        }
        const stop = (): void => {
          window.removeEventListener('pointermove', move)
          window.removeEventListener('pointerup', stop)
          window.removeEventListener('pointercancel', stop)
          if (frame !== undefined) cancelAnimationFrame(frame)
          if (last) onResize(last, true)
        }
        window.addEventListener('pointermove', move)
        window.addEventListener('pointerup', stop)
        window.addEventListener('pointercancel', stop)
      }}
    />
  )
}

/**
 * Asas invisibles para cambiar el tamaño del post-it: el borde derecho (ancho), el borde de abajo
 * (alto) y la esquina doblada (las dos cosas). La esquina está recortada: solo la solapa recibe
 * el ratón.
 */
export function ResizeHandles({ onReset, ...shared }: Props): React.JSX.Element {
  return (
    <>
      <Handle
        {...shared}
        axis="x"
        className="absolute top-3 right-0 bottom-[26px] z-20 w-1.5 cursor-ew-resize touch-none"
      />
      <Handle
        {...shared}
        axis="y"
        className="absolute right-[26px] bottom-0 left-3 z-20 h-1.5 cursor-ns-resize touch-none"
      />
      <Handle
        {...shared}
        axis="xy"
        title="Arrastra para cambiar el tamaño. Doble clic: tamaño automático"
        className="absolute right-0 bottom-0 z-20 size-[26px] cursor-nwse-resize touch-none"
        onDoubleClick={onReset}
      />
    </>
  )
}
