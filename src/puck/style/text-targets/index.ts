import { LAPTOP_TEXT_TARGETS } from './laptop'
import { PC_TEXT_TARGETS } from './pc'

export type TextTargetDef = { key: string; label: string }

export const TEXT_TARGETS: Record<string, TextTargetDef[]> = {
  ...LAPTOP_TEXT_TARGETS,
  ...PC_TEXT_TARGETS,
}

