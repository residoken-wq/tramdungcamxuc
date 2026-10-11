import { describe, it, expect, beforeAll } from 'vitest'
import { getPayload, type Payload } from 'payload'
import config from '../../src/payload.config'
import { DIAGNOSTIC_SCALE_MAX } from '../../src/lib/diagnostic'

describe('diagnosticResults collection (T2-12)', () => {
  let payload: Payload

  beforeAll(async () => {
    payload = await getPayload({ config })
  })

  it('accepts the top of the 1–5 scale and still rejects values outside it', async () => {
    const created = await payload.create({
      collection: 'diagnosticResults',
      data: { answers: [{ score: DIAGNOSTIC_SCALE_MAX }], topStage: 'cue' },
      overrideAccess: true,
    })
    expect(created.answers?.[0]?.score).toBe(DIAGNOSTIC_SCALE_MAX)
    await payload.delete({ collection: 'diagnosticResults', id: created.id, overrideAccess: true })

    await expect(
      payload.create({
        collection: 'diagnosticResults',
        data: { answers: [{ score: DIAGNOSTIC_SCALE_MAX + 1 }], topStage: 'cue' },
        overrideAccess: true,
      }),
    ).rejects.toThrow()
  })
})
