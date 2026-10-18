import type { CSSProperties } from 'react'
import { noteColorOf } from '../../../shared/palette'

/** Variables CSS con los colores de papel de un área (se usan junto a la clase "note"). */
export function noteStyle(colorId: string | undefined): CSSProperties {
  const color = noteColorOf(colorId)
  return {
    '--note-bg': color.bg,
    '--note-ink': color.ink,
    '--note-alert': color.alert,
    '--note-alert-ink': color.alertInk
  } as CSSProperties
}
