/**
 * Clases para los iconos de acción que solo aparecen al pasar el cursor por encima.
 * El elemento que define la zona debe llevar la clase "group/zone".
 * También se ven al navegar con el teclado o mientras hay un menú abierto.
 */
export const HOVER_ACTIONS =
  'flex shrink-0 opacity-0 transition-opacity group-hover/zone:opacity-100 group-focus-within/zone:opacity-100 has-[[data-state=open]]:opacity-100 motion-reduce:transition-none'
