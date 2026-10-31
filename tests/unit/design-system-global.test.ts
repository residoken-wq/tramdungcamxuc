// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
vi.mock('server-only', () => ({}))

import { randomUUID } from 'node:crypto'
import { getPayload, type GroupField, type Payload } from 'payload'
import config from '../../src/payload.config'
import type { DesignSystem, User } from '../../src/payload-types'
import { getDesignSystem } from '../../src/lib/design/design-system.server'
import { DEFAULT_COLORS } from '../../src/lib/design/design-system'
import { DesignSystem as DesignSystemGlobal } from '../../src/globals/DesignSystem'

type GlobalData = Omit<DesignSystem, 'id' | 'updatedAt' | 'createdAt'>

describe('EB-01: designSystem global', () => {
  let payload: Payload
  let before: DesignSystem | null = null
  let owner: User
  let editor: User
  const userIds: number[] = []

  const asUser = (user: User) => ({ ...user, collection: 'users' as const })
  const writeAs = (user: User | null, data: Partial<GlobalData>) =>
    payload.updateGlobal({
      slug: 'designSystem',
      data,
      ...(user ? { user: asUser(user), overrideAccess: false } : { overrideAccess: true }),
    })

  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    before = (await payload.findGlobal({ slug: 'designSystem', depth: 0 })) as DesignSystem
    const suffix = randomUUID().slice(0, 8)
    // Users created after the first one default to editor (Users hook), so promote explicitly.
    const created = await payload.create({
      collection: 'users',
      data: {
        email: `eb01-owner-${suffix}@example.test`,
        password: `Pass-${suffix}-1`,
        role: 'owner',
      },
      overrideAccess: true,
    })
    owner = (await payload.update({
      collection: 'users',
      id: created.id,
      data: { role: 'owner' },
      overrideAccess: true,
    })) as User
    editor = await payload.create({
      collection: 'users',
      data: {
        email: `eb01-editor-${suffix}@example.test`,
        password: `Pass-${suffix}-2`,
        role: 'editor',
      },
      overrideAccess: true,
    })
    userIds.push(owner.id, editor.id)
  })

  afterAll(async () => {
    if (before) {
      const { id: _id, updatedAt: _u, createdAt: _c, ...rest } = before
      await payload.updateGlobal({ slug: 'designSystem', data: rest, overrideAccess: true })
    }
    for (const id of userIds) {
      await payload.delete({ collection: 'users', id, overrideAccess: true }).catch(() => {})
    }
  })

  it('is readable without login', async () => {
    await expect(
      payload.findGlobal({ slug: 'designSystem', overrideAccess: false }),
    ).resolves.toBeTruthy()
  })

  it('defaults every lock switch to locked and fonts to the Brand Book', () => {
    const fields = DesignSystemGlobal.fields
    const group = (name: string) =>
      fields.find((f): f is GroupField => 'name' in f && f.name === name && f.type === 'group')
    const lockDefaults = Object.fromEntries(
      (group('lock')?.fields ?? []).flatMap((f) =>
        'name' in f && 'defaultValue' in f ? [[f.name, f.defaultValue]] : [],
      ),
    )
    expect(lockDefaults).toEqual({
      colors: 'locked',
      fonts: 'locked',
      sizes: 'locked',
      customCss: 'locked',
      contrastCheck: true,
    })
    const fontRow = group('fonts')?.fields[0]
    const fontDefaults =
      fontRow && fontRow.type === 'row'
        ? Object.fromEntries(
            fontRow.fields.flatMap((f) =>
              'name' in f && 'defaultValue' in f ? [[f.name, f.defaultValue]] : [],
            ),
          )
        : {}
    expect(fontDefaults).toEqual({
      heading: 'Anton',
      ui: 'Montserrat',
      quote: 'Playfair Display',
      body: 'Montserrat',
    })
  })

  it('lets only the owner update it', async () => {
    await expect(writeAs(editor, { radiusCard: 12 })).rejects.toThrow()
    const saved = (await writeAs(owner, { radiusCard: 12 })) as DesignSystem
    expect(saved.radiusCard).toBe(12)
  })

  it('rejects removing or renaming a core colour token', async () => {
    await expect(writeAs(owner, { colors: DEFAULT_COLORS.slice(1) })).rejects.toThrow()
    const renamed = DEFAULT_COLORS.map((c, i) => (i === 0 ? { ...c, token: 'navy' } : c))
    await expect(writeAs(owner, { colors: renamed })).rejects.toThrow()
  })

  it('rejects duplicate tokens, bad HEX and unknown fonts', async () => {
    await expect(
      writeAs(owner, { colors: [...DEFAULT_COLORS, { ...DEFAULT_COLORS[0]! }] }),
    ).rejects.toThrow()
    await expect(
      writeAs(owner, { colors: [...DEFAULT_COLORS, { token: 'xanh', label: null, hex: 'green' }] }),
    ).rejects.toThrow()
    await expect(
      writeAs(owner, {
        fonts: { heading: 'Comic Sans', ui: 'Montserrat', quote: 'Lora', body: 'Inter' },
      }),
    ).rejects.toThrow()
  })

  it('getDesignSystem reflects an owner change', async () => {
    const colors = DEFAULT_COLORS.map((c) =>
      c.token === 'accent-pink' ? { ...c, hex: '#FF0000' } : c,
    )
    await writeAs(owner, {
      colors: [...colors, { token: 'xanh-la', label: 'Xanh lá', hex: '#00AA00' }],
      lock: {
        colors: 'open',
        fonts: 'locked',
        sizes: 'locked',
        customCss: 'locked',
        contrastCheck: true,
      },
    })
    const ds = await getDesignSystem(payload)
    expect(ds.colors.find((c) => c.token === 'accent-pink')?.hex).toBe('#FF0000')
    expect(ds.colors.find((c) => c.token === 'xanh-la')?.hex).toBe('#00AA00')
    expect(ds.lock.colors).toBe('open')
  })
})
