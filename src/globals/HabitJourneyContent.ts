import type { Field, GlobalConfig } from 'payload'
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
import { vi } from '../lib/i18n/vi'

function hasNonEmptyString(val: unknown): boolean {
  return typeof val === 'string' && val.trim().length > 0
}

function hasAnyQuoteField(siblingData?: Record<string, unknown>): boolean {
  if (!siblingData) return false
  return (
    hasNonEmptyString(siblingData.text) ||
    hasNonEmptyString(siblingData.author) ||
    hasNonEmptyString(siblingData.source)
  )
}

function buildStageResultGroup(
  stageKey: 'cue' | 'craving' | 'response' | 'reward',
  stageLabel: string,
): Field {
  return {
    name: stageKey,
    type: 'group',
    label: stageLabel,
    fields: [
      text('title', vi.hb17.diagnose.stageResults.title),
      richText('suggestion', vi.hb17.diagnose.stageResults.suggestion),
      text('nextStepHint', vi.hb17.diagnose.stageResults.nextStepHint, false, {
        admin: {
          description: vi.hb17.diagnose.stageResults.nextStepHintDesc,
        },
      }),
    ],
  }
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
      ],
    },
    {
      name: 'diagnose',
      type: 'group',
      label: vi.hb17.diagnose.label,
      admin: {
        description: vi.hb17.diagnose.description,
      },
      fields: [
        text('title', vi.hb17.diagnose.title, false, {
          admin: {
            description: vi.hb17.diagnose.titleDesc,
          },
        }),
        richText('intro', vi.hb17.diagnose.intro),
        {
          name: 'quote',
          type: 'group',
          label: vi.hb17.diagnose.quote.label,
          admin: {
            description: vi.hb17.diagnose.quote.description,
          },
          fields: [
            {
              ...textarea('text', vi.hb17.diagnose.quote.text),
              validate: (
                value: string | null | undefined,
                { siblingData }: { siblingData?: Record<string, unknown> },
              ) => {
                if (!hasAnyQuoteField(siblingData) && !hasNonEmptyString(value)) return true
                return hasNonEmptyString(value) || vi.hb17.errors.requiredQuoteText
              },
            },
            {
              ...text('author', vi.hb17.diagnose.quote.author),
              validate: (
                value: string | null | undefined,
                { siblingData }: { siblingData?: Record<string, unknown> },
              ) => {
                if (!hasAnyQuoteField(siblingData) && !hasNonEmptyString(value)) return true
                return hasNonEmptyString(value) || vi.hb17.errors.requiredQuoteAuthor
              },
            },
            {
              ...text('source', vi.hb17.diagnose.quote.source),
              admin: {
                description: vi.hb17.diagnose.quote.sourceDesc,
              },
              validate: (
                value: string | null | undefined,
                { siblingData }: { siblingData?: Record<string, unknown> },
              ) => {
                if (!hasAnyQuoteField(siblingData) && !hasNonEmptyString(value)) return true
                return hasNonEmptyString(value) || vi.hb17.errors.requiredQuoteSource
              },
            },
            url('sourceUrl', vi.hb17.diagnose.quote.sourceUrl),
          ],
        },
        {
          name: 'stats',
          type: 'array',
          dbName: 'hjc_diag_stats',
          label: vi.hb17.diagnose.stats.label,
          maxRows: 4,
          labels: {
            singular: vi.hb17.diagnose.stats.singular,
            plural: vi.hb17.diagnose.stats.plural,
          },
          admin: {
            description: vi.hb17.diagnose.stats.description,
          },
          fields: [
            {
              ...text('value', vi.hb17.diagnose.stats.value, true),
              validate: (value: string | null | undefined) =>
                hasNonEmptyString(value) || vi.hb17.errors.requiredStatValue,
            },
            {
              ...text('label', vi.hb17.diagnose.stats.labelField, true),
              validate: (value: string | null | undefined) =>
                hasNonEmptyString(value) || vi.hb17.errors.requiredStatLabel,
            },
            {
              ...text('source', vi.hb17.diagnose.stats.source, true),
              admin: {
                description: vi.hb17.diagnose.stats.sourceDesc,
              },
              validate: (value: string | null | undefined) =>
                hasNonEmptyString(value) || vi.hb17.errors.requiredStatSource,
            },
            url('sourceUrl', vi.hb17.diagnose.stats.sourceUrl),
          ],
        },
        {
          name: 'questions',
          type: 'array',
          dbName: 'hjc_diag_questions',
          label: vi.hb17.diagnose.questions.label,
          minRows: 4,
          maxRows: 12,
          labels: {
            singular: vi.hb17.diagnose.questions.singular,
            plural: vi.hb17.diagnose.questions.plural,
          },
          admin: {
            description: vi.hb17.diagnose.questions.description,
          },
          fields: [
            {
              ...text('statement', vi.hb17.diagnose.questions.statement, true),
              validate: (value: string | null | undefined) =>
                hasNonEmptyString(value) || vi.hb17.errors.requiredQuestionStatement,
            },
            select('stage', vi.hb17.diagnose.questions.stage, stageOptions, {
              required: true,
              dbName: 'hjc_diag_stage',
              validate: (value: unknown) =>
                (typeof value === 'string' &&
                  ['cue', 'craving', 'response', 'reward'].includes(value)) ||
                vi.hb17.errors.requiredQuestionStage,
            }),
            checkbox('isActive', vi.hb17.diagnose.questions.isActive, true),
          ],
        },
        {
          name: 'stageResults',
          type: 'group',
          label: vi.hb17.diagnose.stageResults.label,
          admin: {
            description: vi.hb17.diagnose.stageResults.description,
          },
          fields: [
            buildStageResultGroup('cue', vi.hb17.diagnose.stageResults.stages.cue),
            buildStageResultGroup('craving', vi.hb17.diagnose.stageResults.stages.craving),
            buildStageResultGroup('response', vi.hb17.diagnose.stageResults.stages.response),
            buildStageResultGroup('reward', vi.hb17.diagnose.stageResults.stages.reward),
          ],
        },
      ],
    },
  ],
}
