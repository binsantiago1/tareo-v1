import type { CSSProperties } from 'react'
import { noteColorOf } from '../../../shared/palette'

/** Variables CSS con el color de papel de un área (se usan junto a la clase "note"). */
export function noteStyle(colorId: string | undefined): CSSProperties {
  const color = noteColorOf(colorId)
  return {
    '--note-hue': color.hue,
    '--note-chroma': color.chroma
  } as CSSProperties
}
