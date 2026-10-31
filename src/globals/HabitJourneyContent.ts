import type { Field, GlobalConfig, SelectFieldSingleValidation, Validate } from 'payload'
import {
  checkbox,
  number,
  richText,
  select,
  stageOptions,
  text,
  textarea,
  url,
} from '../fields/content'
import { authenticated } from '../lib/auth/access'
import { CAPTION_MAX_LENGTH, unknownCaptionPlaceholders } from '../lib/habit/flow-content'
import { vi } from '../lib/i18n/vi'

const hasText = (value: unknown): boolean => typeof value === 'string' && value.trim().length > 0

const requiredText = (value: string | null | undefined): string | true =>
  hasText(value) || vi.hb24.errors.requiredValue

/** Rows of the array that holds this field: path = [...arrayPath, rowIndex, fieldName]. */
function siblingRows(data: unknown, path: (number | string)[]): unknown[] {
  let node: unknown = data
  for (const key of path.slice(0, -2)) {
    if (node === null || typeof node !== 'object') return []
    node = (node as Record<string | number, unknown>)[key]
  }
  return Array.isArray(node) ? node : []
}

// HB-24: one row per habit stage (results of step 1, explanations of step 5).
const validateUniqueStage: SelectFieldSingleValidation = (value, { data, path }) => {
  if (!hasText(value)) return vi.hb24.errors.requiredStage
  const sameStage = siblingRows(data, path).filter(
    (row) => row !== null && typeof row === 'object' && 'stage' in row && row.stage === value,
  )
  return sameStage.length <= 1 || vi.hb24.errors.duplicateStage
}

// HB-24: one row per habit stage (results of step 1, explanations of step 5).
const uniqueStageField = (label: string): Field => ({
  name: 'stage',
  label,
  type: 'select',
  hasMany: false,
  required: true,
  options: stageOptions.map(([value, optionLabel]) => ({ value, label: optionLabel })),
  validate: validateUniqueStage,
})

const validateCaption: Validate<string> = (value) => {
  if (!hasText(value)) return true
  const caption = value as string
  if (caption.length > CAPTION_MAX_LENGTH) return vi.hb24.errors.captionTooLong(CAPTION_MAX_LENGTH)
  const unknown = unknownCaptionPlaceholders(caption)
  return unknown.length === 0 || vi.hb24.errors.unknownPlaceholder(unknown.join(', '))
}

export const HabitJourneyContent: GlobalConfig = {
  slug: 'habitJourneyContent',
  label: vi.hb07.global.label,
  admin: {
    group: vi.cms.nav.habit,
    description: vi.hb07.global.description,
  },
  access: {
    read: () => true,
    update: authenticated,
  },
  fields: [
    {
      name: 'stations',
      type: 'array',
      label: vi.hb07.stations.label,
      minRows: 1,
      maxRows: 6,
      labels: {
        singular: 'Trạm',
        plural: 'Các trạm',
      },
      admin: {
        description: vi.hb07.stations.description,
      },
      fields: [
        {
          ...text('name', vi.hb07.stations.name, true),
          validate: (value: string | null | undefined) =>
            (typeof value === 'string' && value.trim().length > 0) ||
            vi.hb07.errors.requiredStationName,
        },
        text('tagline', vi.hb07.stations.tagline),
        {
          name: 'reflectionQuestions',
          type: 'array',
          label: vi.hb07.stations.reflectionQuestions,
          maxRows: 5,
          labels: {
            singular: 'Câu hỏi',
            plural: 'Câu hỏi suy ngẫm',
          },
          fields: [
            {
              ...textarea('question', vi.hb07.stations.question),
              required: true,
              validate: (value: string | null | undefined) =>
                (typeof value === 'string' && value.trim().length > 0) ||
                vi.hb07.errors.requiredQuestion,
            },
          ],
        },
      ],
    },
    {
      name: 'quotes',
      type: 'array',
      label: vi.hb07.quotes.label,
      labels: {
        singular: 'Câu trích dẫn',
        plural: 'Các câu trích dẫn',
      },
      fields: [
        {
          ...textarea('text', vi.hb07.quotes.text),
          required: true,
          validate: (value: string | null | undefined) =>
            (typeof value === 'string' && value.trim().length > 0) ||
            vi.hb07.errors.requiredQuoteText,
        },
        {
          ...text('author', vi.hb07.quotes.author, true),
          validate: (value: string | null | undefined) =>
            (typeof value === 'string' && value.trim().length > 0) ||
            vi.hb07.errors.requiredQuoteAuthor,
        },
        {
          ...text('source', vi.hb07.quotes.source, true),
          admin: {
            description: vi.hb07.quotes.sourceDesc,
          },
          validate: (value: string | null | undefined) =>
            (typeof value === 'string' && value.trim().length > 0) ||
            vi.hb07.errors.requiredQuoteSource,
        },
        url('sourceUrl', vi.hb07.quotes.sourceUrl),
        checkbox('isActive', vi.hb07.quotes.isActive, true),
      ],
    },
    {
      name: 'onePercent',
      type: 'group',
      label: vi.hb07.onePercent.label,
      fields: [
        text('title', vi.hb07.onePercent.title),
        richText('intro', vi.hb07.onePercent.intro),
        {
          ...number('dailyPercent', vi.hb07.onePercent.dailyPercent, 1),
          min: 0.1,
          max: 10,
          admin: {
            description: vi.hb07.onePercent.dailyPercentDesc,
          },
          validate: (value: unknown) => {
            if (value === undefined || value === null || value === '') return true
            const num = Number(value)
            if (isNaN(num) || num < 0.1 || num > 10) {
              return vi.hb07.errors.invalidDailyPercent
            }
            return true
          },
        },
        {
          ...number('maxDays', vi.hb07.onePercent.maxDays, 365),
          min: 7,
          max: 1000,
          admin: {
            description: vi.hb07.onePercent.maxDaysDesc,
          },
          validate: (value: unknown) => {
            if (value === undefined || value === null || value === '') return true
            const num = Number(value)
            if (isNaN(num) || num < 7 || num > 1000) {
              return vi.hb07.errors.invalidMaxDays
            }
            return true
          },
        },
        {
          name: 'facts',
          type: 'array',
          label: vi.hb07.onePercent.facts,
          labels: {
            singular: 'Dẫn chứng',
            plural: 'Các số liệu dẫn chứng',
          },
          fields: [
            {
              ...textarea('statement', vi.hb07.onePercent.statement),
              required: true,
              validate: (value: string | null | undefined) =>
                (typeof value === 'string' && value.trim().length > 0) ||
                vi.hb07.errors.requiredFactStatement,
            },
            {
              ...text('sourceLabel', vi.hb07.onePercent.sourceLabel, true),
              admin: {
                description: vi.hb07.onePercent.sourceLabelDesc,
              },
              validate: (value: string | null | undefined) =>
                (typeof value === 'string' && value.trim().length > 0) ||
                vi.hb07.errors.requiredFactSource,
            },
            url('sourceUrl', vi.hb07.onePercent.sourceUrl),
          ],
        },
        {
          name: 'unknowns',
          type: 'array',
          label: vi.hb24.onePercent.unknowns,
          maxRows: 3,
          labels: { singular: 'Điều', plural: 'Các điều chưa biết' },
          admin: { description: vi.hb24.onePercent.unknownsDesc },
          fields: [
            { ...text('title', vi.hb24.onePercent.unknownTitle, true), validate: requiredText },
            textarea('body', vi.hb24.onePercent.unknownBody),
          ],
        },
      ],
    },
    {
      name: 'diagnose',
      type: 'group',
      label: vi.hb24.diagnose.label,
      admin: { description: vi.hb24.diagnose.description },
      fields: [
        text('title', vi.hb24.diagnose.title),
        richText('intro', vi.hb24.diagnose.intro),
        {
          name: 'quote',
          type: 'group',
          label: vi.hb24.diagnose.quote,
          fields: [
            textarea('text', vi.hb24.diagnose.quoteText),
            {
              ...text('author', vi.hb24.diagnose.quoteAuthor),
              validate: ((value, { siblingData }) =>
                !hasText(siblingData?.text) ||
                hasText(value) ||
                vi.hb24.errors.requiredQuoteAuthor) satisfies Validate<
                string,
                unknown,
                { text?: string }
              >,
            },
            {
              ...text('source', vi.hb24.diagnose.quoteSource),
              admin: { description: vi.hb24.diagnose.quoteSourceDesc },
              validate: ((value, { siblingData }) =>
                !hasText(siblingData?.text) ||
                hasText(value) ||
                vi.hb24.errors.requiredQuoteSource) satisfies Validate<
                string,
                unknown,
                { text?: string }
              >,
            },
            url('sourceUrl', vi.hb24.diagnose.quoteSourceUrl),
          ],
        },
        {
          name: 'stats',
          type: 'array',
          label: vi.hb24.diagnose.stats,
          maxRows: 6,
          labels: { singular: 'Con số', plural: 'Các con số' },
          admin: { description: vi.hb24.diagnose.statsDesc },
          fields: [
            { ...text('value', vi.hb24.diagnose.statValue, true), validate: requiredText },
            {
              ...textarea('label', vi.hb24.diagnose.statLabel),
              required: true,
              validate: requiredText,
            },
            {
              ...text('sourceLabel', vi.hb24.diagnose.statSourceLabel, true),
              validate: (value: string | null | undefined) =>
                hasText(value) || vi.hb24.errors.requiredStatSource,
            },
            url('sourceUrl', vi.hb24.diagnose.statSourceUrl),
          ],
        },
        {
          name: 'questions',
          type: 'array',
          label: vi.hb24.diagnose.questions,
          maxRows: 12,
          labels: { singular: 'Câu hỏi', plural: 'Câu hỏi khảo sát' },
          admin: { description: vi.hb24.diagnose.questionsDesc },
          fields: [
            {
              ...textarea('statement', vi.hb24.diagnose.statement),
              required: true,
              validate: requiredText,
            },
            select('stage', vi.hb24.diagnose.stage, stageOptions, { required: true }),
          ],
        },
        text('scaleMinLabel', vi.hb24.diagnose.scaleMinLabel),
        text('scaleMaxLabel', vi.hb24.diagnose.scaleMaxLabel),
        {
          name: 'results',
          type: 'array',
          label: vi.hb24.diagnose.results,
          maxRows: 4,
          labels: { singular: 'Gợi ý', plural: 'Gợi ý theo nút thắt' },
          admin: { description: vi.hb24.diagnose.resultsDesc },
          fields: [
            uniqueStageField(vi.hb24.diagnose.stage),
            { ...text('title', vi.hb24.diagnose.resultTitle, true), validate: requiredText },
            {
              ...textarea('suggestion', vi.hb24.diagnose.resultSuggestion),
              required: true,
              validate: requiredText,
            },
          ],
        },
      ],
    },
    {
      name: 'loop',
      type: 'group',
      label: vi.hb24.loop.label,
      fields: [
        richText('intro', vi.hb24.loop.intro),
        {
          name: 'stages',
          type: 'array',
          label: vi.hb24.loop.stages,
          maxRows: 4,
          labels: { singular: 'Giai đoạn', plural: 'Các giai đoạn' },
          admin: { description: vi.hb24.loop.stagesDesc },
          fields: [
            uniqueStageField(vi.hb24.loop.stage),
            { ...text('title', vi.hb24.loop.stageTitle, true), validate: requiredText },
            {
              ...textarea('explanation', vi.hb24.loop.stageExplanation),
              required: true,
              validate: requiredText,
            },
          ],
        },
        {
          name: 'rules',
          type: 'array',
          label: vi.hb24.loop.rules,
          maxRows: 4,
          labels: { singular: 'Quy tắc', plural: 'Các quy tắc' },
          fields: [
            { ...text('title', vi.hb24.loop.ruleTitle, true), validate: requiredText },
            textarea('body', vi.hb24.loop.ruleBody),
          ],
        },
      ],
    },
    {
      name: 'boardingPass',
      type: 'group',
      label: vi.hb24.boardingPass.label,
      fields: [
        {
          ...textarea('captionTemplate', vi.hb24.boardingPass.captionTemplate),
          admin: { description: vi.hb24.boardingPass.captionTemplateDesc },
          validate: validateCaption,
        },
      ],
    },
    {
      ...textarea('privacyNote', vi.hb24.privacyNote),
      admin: { description: vi.hb24.privacyNoteDesc },
    },
  ],
}
