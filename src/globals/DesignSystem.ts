import type { ArrayFieldValidation, Field, GlobalConfig, TextFieldSingleValidation } from 'payload'
import { number, select, text } from '../fields/content'
import { isOwner } from '../lib/auth/access'
import {
  colorListProblem,
  DEFAULT_COLORS,
  DEFAULT_DESIGN_SYSTEM,
  isValidHex,
  LOCK_KEYS,
  MAX_COLORS,
  TOKEN_PATTERN,
} from '../lib/design/design-system'
import { DEFAULT_FONTS, isDesignFont, type FontRole } from '../lib/design/fonts'
import { vi } from '../lib/i18n/vi'

const t = vi.eb01

const validateColorList: ArrayFieldValidation = (value, { data }) => {
  // In the admin form state an array value can be a row count; fall back to the document data.
  const rows = Array.isArray(value)
    ? value
    : ((data as { colors?: unknown } | undefined)?.colors ?? null)
  if (!Array.isArray(rows)) return true
  if (rows.length > MAX_COLORS) return `Tối đa ${MAX_COLORS} màu.`
  const problem = colorListProblem(rows as { token?: unknown }[])
  if (!problem) return true
  return problem.kind === 'duplicate'
    ? t.errors.duplicateToken(problem.tokens.join(', '))
    : t.errors.missingCore(problem.tokens.join(', '))
}

const validateToken: TextFieldSingleValidation = (value) =>
  (typeof value === 'string' && TOKEN_PATTERN.test(value.trim())) || t.errors.invalidToken

const validateHex: TextFieldSingleValidation = (value) => isValidHex(value) || t.errors.invalidHex

// Stored as text (not a Postgres enum) so adding a font to DESIGN_FONT_OPTIONS needs no migration.
const validateFont: TextFieldSingleValidation = (value) =>
  isDesignFont(value) || t.errors.invalidFont

const fontSelect = (role: FontRole): Field => ({
  ...text(role, t.fonts[role], true),
  defaultValue: DEFAULT_FONTS[role],
  validate: validateFont,
  admin: {
    description: t.fonts.description,
    components: { Field: '@/components/admin/design/FontSelectField#FontSelectField' },
  },
})

const lockSelect = (key: (typeof LOCK_KEYS)[number]): Field =>
  select(
    key,
    t.lock[key],
    [
      ['locked', t.lock.locked],
      ['open', t.lock.open],
    ],
    {
      required: true,
      defaultValue: 'locked',
      admin: { description: t.lock[`${key}Desc`], isClearable: false },
    },
  )

const spacingNumber = (key: 'sm' | 'md' | 'lg'): Field =>
  number(key, t.spacing[key], DEFAULT_DESIGN_SYSTEM.spacing[key], {
    min: 0,
    max: 96,
    required: true,
    admin: { description: '0 – 96' },
  })

/**
 * EB-01: site-wide design tokens + brand lock switches. One per installation (each customer
 * runs its own deployment, decision 31/10). Rendering reads it from EB-02 onwards.
 */
export const DesignSystem: GlobalConfig = {
  slug: 'designSystem',
  label: t.global.label,
  admin: {
    group: vi.cms.nav.website,
    description: t.global.description,
  },
  access: {
    // REVIEW-REQUIRED: public read – the site renders its colours / fonts from this global (EB-02).
    // Only tokens and switches live here, no personal or payment data.
    read: () => true,
    // REVIEW-REQUIRED: only the owner may change site-wide styling and the brand lock switches.
    update: isOwner,
  },
  fields: [
    {
      name: 'colors',
      type: 'array',
      label: t.colors.label,
      minRows: 1,
      maxRows: MAX_COLORS,
      labels: { singular: 'Màu', plural: 'Bảng màu' },
      defaultValue: DEFAULT_COLORS.map((color) => ({ ...color })),
      admin: {
        description: t.colors.description,
        initCollapsed: true,
        components: {
          RowLabel: '@/components/admin/design/ColorRowLabel#ColorRowLabel',
        },
      },
      validate: validateColorList,
      fields: [
        {
          type: 'row',
          fields: [
            {
              ...text('token', t.colors.token, true),
              admin: { description: t.colors.tokenDesc, width: '30%' },
              validate: validateToken,
            },
            {
              ...text('label', t.colors.labelField),
              admin: { width: '40%' },
            },
            {
              ...text('hex', t.colors.hex, true),
              admin: {
                width: '30%',
                components: { Field: '@/components/admin/design/ColorField#ColorField' },
              },
              validate: validateHex,
            },
          ],
        },
      ],
    },
    {
      name: 'fonts',
      type: 'group',
      label: t.fonts.label,
      admin: { description: t.fonts.description },
      fields: [
        {
          type: 'row',
          fields: (['heading', 'ui', 'quote', 'body'] as const).map(fontSelect),
        },
      ],
    },
    number('radiusCard', t.radiusCard, DEFAULT_DESIGN_SYSTEM.radiusCard, {
      min: 0,
      max: 48,
      required: true,
      admin: { description: '0 – 48' },
    }),
    {
      name: 'spacing',
      type: 'group',
      label: t.spacing.label,
      fields: [{ type: 'row', fields: (['sm', 'md', 'lg'] as const).map(spacingNumber) }],
    },
    {
      name: 'lock',
      type: 'group',
      label: t.lock.label,
      admin: { description: t.lock.description },
      fields: [
        {
          name: 'openWarning',
          type: 'ui',
          admin: { components: { Field: '@/components/admin/design/LockWarning#LockWarning' } },
        },
        ...LOCK_KEYS.map(lockSelect),
        {
          name: 'contrastCheck',
          type: 'checkbox',
          label: t.lock.contrastCheck,
          defaultValue: true,
        },
      ],
    },
  ],
}
