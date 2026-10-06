import 'server-only'
import { getPayload } from 'payload'
import config from '@/payload.config'
import type { Data } from '@puckeditor/core'

/**
 * Server-only helper to resolve server-side data (media URL/alt from Local API)
 * for Puck Data before passing to <Render>.
 * This ensures src/puck/config.tsx remains 100% pure isomorphic and prevents
 * Next.js server-only modules from leaking into client bundles.
 */
export async function resolveServerData(data: Data): Promise<Data> {
  if (!data || !Array.isArray(data.content)) {
    return data
  }

  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  // Deep clone data to avoid mutating original
  const resolvedData: Data = JSON.parse(JSON.stringify(data))

  const resolveItems = async (items: Array<{ type: string; props: Record<string, unknown> }>) => {
    for (const item of items) {
      if (item && (item.type === 'ImageText' || item.type === 'HeroImage') && item.props?.mediaId) {
        try {
          const mediaDoc = await payload.findByID({
            collection: 'media',
            id: String(item.props.mediaId),
          })
          if (
            mediaDoc &&
            mediaDoc.alt &&
            typeof mediaDoc.alt === 'string' &&
            mediaDoc.alt.trim().length > 0
          ) {
            item.props.imageUrl = (mediaDoc.url as string) || ''
            item.props.imageAlt = mediaDoc.alt.trim()
          } else {
            item.props.imageUrl = ''
            item.props.imageAlt = ''
          }
        } catch {
          item.props.imageUrl = ''
          item.props.imageAlt = ''
        }
      }
    }
  }

  await resolveItems(
    resolvedData.content as unknown as Array<{
      type: string
      props: Record<string, unknown>
    }>,
  )

  if (resolvedData.zones) {
    for (const zoneKey of Object.keys(resolvedData.zones)) {
      const zoneItems = resolvedData.zones[zoneKey]
      if (Array.isArray(zoneItems)) {
        await resolveItems(
          zoneItems as unknown as Array<{
            type: string
            props: Record<string, unknown>
          }>,
        )
      }
    }
  }

  return resolvedData
}
