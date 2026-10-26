import type { GlobalConfig } from 'payload'
import { checkbox, number, richText, text, textarea, url } from '../fields/content'
import { authenticated } from '../lib/auth/access'
import { vi } from '../lib/i18n/vi'

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
  ],
}
