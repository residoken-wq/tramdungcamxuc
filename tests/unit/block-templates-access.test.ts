// @vitest-environment node
import { describe, expect, it } from 'vitest'
import type { PayloadRequest } from 'payload'
import { vi } from '../../src/lib/i18n/vi'
import {
  blockTemplateAdminAccess,
  blockTemplateDeleteAccess,
  BlockTemplates,
} from '../../src/collections/BlockTemplates'

type MockUser = NonNullable<PayloadRequest['user']>

function makeReq(user: MockUser | null = null): PayloadRequest {
  return { user } as unknown as PayloadRequest
}

describe('EB-08: BlockTemplates access control', () => {
  const ownerUser: MockUser = {
    id: 1,
    collection: 'users',
    role: 'owner',
    email: 'owner@example.test',
  } as unknown as MockUser

  const editorUserA: MockUser = {
    id: 2,
    collection: 'users',
    role: 'editor',
    email: 'editor-a@example.test',
  } as unknown as MockUser

  const _editorUserB: MockUser = {
    id: 3,
    collection: 'users',
    role: 'editor',
    email: 'editor-b@example.test',
  } as unknown as MockUser

  const customerUser: MockUser = {
    id: 10,
    collection: 'customers',
    email: 'customer@example.test',
  } as unknown as MockUser

  describe('Admin access (read, create, update)', () => {
    it('allows owner to read, create, update', () => {
      const req = makeReq(ownerUser)
      expect(blockTemplateAdminAccess({ req })).toBe(true)
      expect(
        typeof BlockTemplates.access?.read === 'function' && BlockTemplates.access.read({ req }),
      ).toBe(true)
      expect(
        typeof BlockTemplates.access?.create === 'function' &&
          BlockTemplates.access.create({ req }),
      ).toBe(true)
      expect(
        typeof BlockTemplates.access?.update === 'function' &&
          BlockTemplates.access.update({ req }),
      ).toBe(true)
    })

    it('allows editor to read, create, update', () => {
      const req = makeReq(editorUserA)
      expect(blockTemplateAdminAccess({ req })).toBe(true)
      expect(
        typeof BlockTemplates.access?.read === 'function' && BlockTemplates.access.read({ req }),
      ).toBe(true)
      expect(
        typeof BlockTemplates.access?.create === 'function' &&
          BlockTemplates.access.create({ req }),
      ).toBe(true)
      expect(
        typeof BlockTemplates.access?.update === 'function' &&
          BlockTemplates.access.update({ req }),
      ).toBe(true)
    })

    it('denies unauthenticated guests from reading, creating, updating (public read = false)', () => {
      const req = makeReq(null)
      expect(blockTemplateAdminAccess({ req })).toBe(false)
      expect(
        typeof BlockTemplates.access?.read === 'function' && BlockTemplates.access.read({ req }),
      ).toBe(false)
      expect(
        typeof BlockTemplates.access?.create === 'function' &&
          BlockTemplates.access.create({ req }),
      ).toBe(false)
      expect(
        typeof BlockTemplates.access?.update === 'function' &&
          BlockTemplates.access.update({ req }),
      ).toBe(false)
    })

    it('denies customer users from reading, creating, updating', () => {
      const req = makeReq(customerUser)
      expect(blockTemplateAdminAccess({ req })).toBe(false)
      expect(
        typeof BlockTemplates.access?.read === 'function' && BlockTemplates.access.read({ req }),
      ).toBe(false)
      expect(
        typeof BlockTemplates.access?.create === 'function' &&
          BlockTemplates.access.create({ req }),
      ).toBe(false)
      expect(
        typeof BlockTemplates.access?.update === 'function' &&
          BlockTemplates.access.update({ req }),
      ).toBe(false)
    })
  })

  describe('Delete access', () => {
    it('allows owner to delete any template unconditionally', () => {
      const req = makeReq(ownerUser)
      expect(blockTemplateDeleteAccess({ req })).toBe(true)
    })

    it('restricts editor to delete only templates they created', () => {
      const req = makeReq(editorUserA)
      const result = blockTemplateDeleteAccess({ req })
      expect(result).toEqual({
        createdBy: {
          equals: editorUserA.id,
        },
      })
    })

    it('denies unauthenticated guests from deleting', () => {
      const req = makeReq(null)
      expect(blockTemplateDeleteAccess({ req })).toBe(false)
    })

    it('denies customer users from deleting', () => {
      const req = makeReq(customerUser)
      expect(blockTemplateDeleteAccess({ req })).toBe(false)
    })
  })

  describe('Collection schema configuration', () => {
    it('has the slug blockTemplates and belongs to Trang web admin group', () => {
      expect(BlockTemplates.slug).toBe('blockTemplates')
      expect(BlockTemplates.admin?.group).toBe(vi.cms.nav.website)
    })

    it('has required name, kind, puckData fields, and readOnly createdBy', () => {
      const fields = BlockTemplates.fields
      const nameField = fields.find((f) => 'name' in f && f.name === 'name') as {
        required?: boolean
        maxLength?: number
      }
      const kindField = fields.find((f) => 'name' in f && f.name === 'kind') as {
        required?: boolean
        options?: unknown[]
      }
      const puckDataField = fields.find((f) => 'name' in f && f.name === 'puckData') as {
        required?: boolean
      }
      const createdByField = fields.find((f) => 'name' in f && f.name === 'createdBy') as {
        admin?: { readOnly?: boolean }
      }

      expect(nameField?.required).toBe(true)
      expect(nameField?.maxLength).toBe(80)
      expect(kindField?.required).toBe(true)
      expect(kindField?.options?.length).toBe(2)
      expect(puckDataField?.required).toBe(true)
      expect(createdByField?.admin?.readOnly).toBe(true)
    })
  })

  describe('createdBy is set by the server only (QA EB-08c)', () => {
    type Hook = (args: {
      operation: 'create' | 'update'
      req: PayloadRequest
      originalDoc?: { createdBy?: unknown }
    }) => unknown
    const field = BlockTemplates.fields.find(
      (f) => 'name' in f && f.name === 'createdBy',
    ) as unknown as { hooks?: { beforeChange?: Hook[] } }
    const hook = field.hooks?.beforeChange?.[0] as Hook

    it('takes the signed-in user on create, ignoring the request value', () => {
      const editor = { id: 7, collection: 'users', role: 'editor' } as unknown as MockUser
      expect(hook({ operation: 'create', req: makeReq(editor) })).toBe(7)
    })

    it('keeps the original author on update (an editor cannot claim an owner template)', () => {
      const editor = { id: 7, collection: 'users', role: 'editor' } as unknown as MockUser
      expect(
        hook({ operation: 'update', req: makeReq(editor), originalDoc: { createdBy: 1 } }),
      ).toBe(1)
      expect(
        hook({ operation: 'update', req: makeReq(editor), originalDoc: { createdBy: { id: 1 } } }),
      ).toBe(1)
    })
  })
})
