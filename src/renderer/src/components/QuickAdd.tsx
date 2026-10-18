import { useState } from 'react'
import { Input } from '@renderer/components/ui/input'

interface Props {
  label: string
  placeholder: string
  autoFocus?: boolean
  onAdd: (title: string) => void
  /** Si se pasa, Escape (o salir del campo vacío) cierra el campo. */
  onCancel?: () => void
}

/** Campo para añadir rápido: se escribe el título y se pulsa Enter. */
export function QuickAdd({
  label,
  placeholder,
  autoFocus,
  onAdd,
  onCancel
}: Props): React.JSX.Element {
  const [value, setValue] = useState('')

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        const title = value.trim()
        if (!title) return
        onAdd(title)
        setValue('')
      }}
    >
      <Input
        aria-label={label}
        placeholder={placeholder}
        autoFocus={autoFocus}
        value={value}
        maxLength={200}
        className="h-8 bg-transparent"
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && onCancel) {
            e.stopPropagation()
            onCancel()
          }
        }}
        onBlur={() => !value.trim() && onCancel?.()}
      />
    </form>
  )
}
