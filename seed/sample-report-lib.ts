import type { CollectionSlug, Payload } from 'payload'

export interface SampleReportRow {
  collection: string
  id: number | string
  title: string
  status: string
  hasSampleText: boolean
}

export interface SampleReport {
  summary: { collection: string; sample: number; stillMarked: number }[]
  rows: SampleReportRow[]
}

// Collections holding people (customers, admins) never print a title: it would be a name or email.
const NO_TITLE = new Set(['users', 'customers'])

export async function buildSampleReport(payload: Payload): Promise<SampleReport> {
  const summary: SampleReport['summary'] = []
  const rows: SampleReportRow[] = []

  for (const [slug, collection] of Object.entries(payload.collections)) {
    const fields = collection.config.flattenedFields
    if (!fields.some((field) => field.name === 'isSample')) continue

    const titleField = collection.config.admin?.useAsTitle
    const result = await payload.find({
      collection: slug as CollectionSlug,
      where: { isSample: { equals: true } },
      draft: true,
      depth: 0,
      limit: 1000,
      pagination: false,
      overrideAccess: true,
    })

    let stillMarked = 0
    for (const doc of result.docs as unknown as Record<string, unknown>[]) {
      const hasSampleText = JSON.stringify(doc).includes('[MẪU]')
      if (hasSampleText) stillMarked += 1
      const rawTitle = titleField ? doc[titleField] : undefined
      rows.push({
        collection: slug,
        id: doc.id as number | string,
        title: NO_TITLE.has(slug) ? '' : typeof rawTitle === 'string' ? rawTitle : '',
        status: typeof doc._status === 'string' ? doc._status : '-',
        hasSampleText,
      })
    }
    if (result.docs.length > 0) {
      summary.push({ collection: slug, sample: result.docs.length, stillMarked })
    }
  }

  return { summary, rows }
}
