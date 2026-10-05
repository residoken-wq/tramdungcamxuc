import { ValidationError, type CollectionBeforeChangeHook, type Field } from 'payload'

const idOf = (value: unknown): string | undefined => {
  if (value == null || value === '') return undefined
  if (typeof value === 'object') return idOf((value as { id?: unknown }).id)
  return String(value)
}

/**
 * Hidden column holding a composite key with a DB unique index. A null key is not
 * constrained (Postgres allows many NULLs), which lets a constraint apply conditionally.
 */
export const uniqueKeyField = (name: string): Field => ({
  name,
  type: 'text',
  unique: true,
  index: true,
  admin: { hidden: true, readOnly: true },
})

// REVIEW-REQUIRED: Computes the composite key and rejects duplicates with a Vietnamese message
// before the DB unique index would reject them with a generic error.
export function uniqueKeyHook(options: {
  keyField: string
  parts: string[]
  when?: (data: Record<string, unknown>) => boolean
  message: string
}): CollectionBeforeChangeHook {
  return async ({ data, originalDoc, req, collection }) => {
    const merged = { ...originalDoc, ...data } as Record<string, unknown>
    const applies = options.when ? options.when(merged) : true
    const ids = options.parts.map((part) => idOf(merged[part]))
    const key = applies && ids.every(Boolean) ? ids.join(':') : null
    if (key) {
      const clash = await req.payload.find({
        collection: collection.slug as never,
        where: { [options.keyField]: { equals: key } },
        limit: 1,
        depth: 0,
        req,
        overrideAccess: true,
      })
      const other = clash.docs[0] as { id?: unknown } | undefined
      if (other && other.id !== (originalDoc as { id?: unknown } | undefined)?.id) {
        throw new ValidationError({
          errors: [{ path: options.parts[0], message: options.message }],
        })
      }
    }
    return { ...data, [options.keyField]: key }
  }
}
