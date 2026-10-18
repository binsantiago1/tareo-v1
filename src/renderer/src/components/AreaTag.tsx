import { noteStyle } from '@renderer/lib/noteStyle'

/** Etiqueta con el nombre de un área, en el color de su post-it. */
export function AreaTag({ name, color }: { name: string; color?: string }): React.JSX.Element {
  return (
    <span
      style={noteStyle(color)}
      className="note inline-block max-w-full truncate rounded-sm border border-black/10 px-1.5 text-xs font-medium dark:border-white/15"
    >
      {name}
    </span>
  )
}
