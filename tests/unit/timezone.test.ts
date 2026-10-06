import { execFileSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'
import { EqCards } from '../../src/collections/EqCards'

describe('timezone independence for printedAt', () => {
  const lockHook = EqCards.hooks?.beforeChange?.[0]
  if (!lockHook) {
    throw new Error('lockPrintedQR hook not found in EqCards.hooks.beforeChange')
  }

  it('validates printedAt consistently with process.env.TZ=UTC and Asia/Ho_Chi_Minh in child processes', () => {
    const runInProcess = (tz: string) => {
      const code = `
        const inputs = [
          '2026-10-05',
          '2026-10-05T07:00:00+07:00',
          '2026-10-05T00:00:00.000Z',
          '2026-10-06T00:00:00.000Z',
        ];
        const originalTime = new Date('2026-10-05T00:00:00.000Z').getTime();
        const results = inputs.map((input) => {
          const time = new Date(input).getTime();
          return {
            input,
            time,
            isEqual: time === originalTime,
          };
        });
        console.log(JSON.stringify(results));
      `
      const output = execFileSync(process.execPath, ['-e', code], {
        env: { ...process.env, TZ: tz },
        encoding: 'utf-8',
      })
      return JSON.parse(output.trim())
    }

    const utcResults = runInProcess('UTC')
    const vnResults = runInProcess('Asia/Ho_Chi_Minh')

    // Both environments must produce identical timestamps and equality comparisons
    expect(vnResults).toEqual(utcResults)

    // Expected timestamps for the test dates
    expect(utcResults).toEqual([
      { input: '2026-10-05', time: 1791158400000, isEqual: true },
      { input: '2026-10-05T07:00:00+07:00', time: 1791158400000, isEqual: true },
      { input: '2026-10-05T00:00:00.000Z', time: 1791158400000, isEqual: true },
      { input: '2026-10-06T00:00:00.000Z', time: 1791244800000, isEqual: false },
    ])
  })

  it('runs lockPrintedQR hook correctly regardless of timezone representation', () => {
    const originalDoc = {
      id: 1,
      code: 'CARD-01',
      qrSlug: 'slug-initial',
      printedAt: '2026-10-05T00:00:00.000Z',
    }

    // Equivalent representations of the same point in time should pass
    for (const printedAt of [
      '2026-10-05',
      '2026-10-05T07:00:00+07:00',
      '2026-10-05T00:00:00.000Z',
    ]) {
      const data = { printedAt, message: 'Test message' }
      // @ts-expect-error test hook call
      const result = lockHook({ data, originalDoc })
      expect(result).toMatchObject({ printedAt, message: 'Test message' })
    }

    // Attempting to change to a different date must throw ValidationError
    const differentDates = ['2026-10-06', '2026-10-05T08:00:00+07:00', null, '']
    for (const printedAt of differentDates) {
      const data = { printedAt }
      expect(() =>
        // @ts-expect-error test hook call
        lockHook({ data, originalDoc }),
      ).toThrow()
    }
  })

  it('verifies process environment defaults to UTC', () => {
    expect(process.env.TZ).toBe('UTC')
    expect(new Date().getTimezoneOffset()).toBe(0)
  })
})
