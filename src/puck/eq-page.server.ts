import 'server-only'
import type { Data } from '@puckeditor/core'
import type { Payload } from 'payload'
import { getEqIntroData } from '@/lib/eq/intro-data.server'
import { walkPuckItems } from './walk'
import { isEqPageBlockType, type EqPageResolved } from './eq-page-types'

/**
 * BX-08b: attaches `_resolved = { eqContent }` to every "EQ Buddy" block (also inside slots).
 * Texts stay in the "Nội dung EQ Buddy" global; the page only stores the layout.
 */
export async function resolveEqPageBlocks(data: Data, payload: Payload): Promise<void> {
  let found = false
  await walkPuckItems(data, (item) => {
    if (isEqPageBlockType(item.type)) found = true
  })
  if (!found) return
  const { content } = await getEqIntroData(payload)
  const resolved: EqPageResolved = { eqContent: content }
  await walkPuckItems(data, (item) => {
    if (isEqPageBlockType(item.type)) item.props._resolved = resolved
  })
}
