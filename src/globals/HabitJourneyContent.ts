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

const stepQuoteSubGroup = (name: string, label: string): Field => ({
  name,
  type: 'group',
  label,
  fields: [
    textarea('text', vi.hb18.stepQuotes.text),
    {
      ...text('author', vi.hb18.stepQuotes.author),
      validate: ((value, { siblingData }) =>
        !hasText(siblingData?.text) ||
        hasText(value) ||
        vi.hb18.errors.requiredQuoteAuthor) satisfies Validate<string, unknown, { text?: string }>,
    },
    {
      ...text('source', vi.hb18.stepQuotes.source),
      admin: { description: vi.hb18.stepQuotes.sourceDesc },
      validate: ((value, { siblingData }) =>
        !hasText(siblingData?.text) ||
        hasText(value) ||
        vi.hb18.errors.requiredQuoteSource) satisfies Validate<string, unknown, { text?: string }>,
    },
    url('sourceUrl', vi.hb18.stepQuotes.sourceUrl),
  ],
})

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
      admin: {
        // HB-26: thay bằng stepQuotes / unknowns
        hidden: true,
      },
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
          admin: {
            // HB-26: thay bằng stepQuotes / unknowns
            hidden: true,
          },
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
        {
          ...text('closing', vi.hb18.onePercent.closing),
          admin: { description: vi.hb18.onePercent.closingDesc },
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
        {
          ...text('note', vi.hb18.loop.note),
          admin: { description: vi.hb18.loop.noteDesc },
        },
        {
          ...text('techniqueHint', vi.hb18.loop.techniqueHint),
          admin: { description: vi.hb18.loop.techniqueHintDesc },
        },
        {
          name: 'laws',
          type: 'array',
          label: '4 quy luật',
          maxRows: 4,
          labels: { singular: 'Quy luật', plural: '4 quy luật' },
          fields: [
            select('stage', 'Giai đoạn', stageOptions, { required: true }),
            text('lawChip', 'Nhãn luật (VD: 1 · MAKE IT OBVIOUS)'),
            text('title', 'Tiêu đề quy luật', true),
            text('subLabel', 'Nhãn phụ (VD: Cue · Tín hiệu)'),
            textarea('question', 'Câu hỏi gợi mở'),
            url('videoUrl', 'Link video bài giảng'),
          ],
        },
        {
          name: 'cueBox',
          type: 'group',
          label: 'Khối lưu ý riêng cho Quy luật 1 (Cue)',
          fields: [
            text('boldText', 'Chữ in đậm mở đầu'),
            textarea('text', 'Đoạn văn lưu ý'),
            text('buttonLabel', 'Nhãn nút xem lại'),
          ],
        },
      ],
    },
    {
      name: 'stepQuotes',
      type: 'group',
      label: vi.hb18.stepQuotes.label,
      admin: { description: vi.hb18.stepQuotes.description },
      fields: [
        stepQuoteSubGroup('onePercent', vi.hb18.stepQuotes.steps.onePercent),
        stepQuoteSubGroup('mentor', vi.hb18.stepQuotes.steps.mentor),
        stepQuoteSubGroup('name', vi.hb18.stepQuotes.steps.name),
        stepQuoteSubGroup('loop', vi.hb18.stepQuotes.steps.loop),
        stepQuoteSubGroup('boardingPass', vi.hb18.stepQuotes.steps.boardingPass),
        stepQuoteSubGroup('tracker', vi.hb18.stepQuotes.steps.tracker),
      ],
    },
    {
      name: 'tracker',
      type: 'group',
      label: vi.hb18.tracker.label,
      admin: { description: vi.hb18.tracker.description },
      fields: [
        text('afterJourneyTitle', vi.hb18.tracker.afterJourneyTitle),
        textarea('afterJourneyText', vi.hb18.tracker.afterJourneyText),
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
    // DP-01d: Copy từng màn vào CMS
    {
      name: 'header',
      type: 'group',
      label: 'Đầu trang (Header)',
      fields: [
        text('badgeText', 'Huy hiệu trên cùng (VD: CONTENT CREATOR HUB)'),
        text('titleLine1', 'Dòng tiêu đề 1 (Navy - VD: Xây Thói Quen)'),
        text('titleLine2', 'Dòng tiêu đề 2 (Magenta - VD: Dựng Thương Hiệu)'),
        text('seriesBadge', 'Huy hiệu chuỗi (VD: FORM HABIT · BUILD IDENTITY)'),
        text('tagline', 'Dòng cảm xúc / Khẩu hiệu'),
        textarea('introText', 'Đoạn văn dẫn nhập 3 giai đoạn'),
        text('stage1Title', 'Tiêu đề Giai đoạn 1'),
        text('stage1Desc', 'Mô tả Giai đoạn 1'),
        text('stage2Title', 'Tiêu đề Giai đoạn 2'),
        text('stage2Desc', 'Mô tả Giai đoạn 2'),
        text('stage3Title', 'Tiêu đề Giai đoạn 3'),
        text('stage3Desc', 'Mô tả Giai đoạn 3'),
      ],
    },
    {
      name: 'step1',
      type: 'group',
      label: 'Bước 1: Khám thói quen',
      fields: [textarea('leadIn', 'Lời dẫn mở đầu bước 1')],
    },
    {
      name: 'step2',
      type: 'group',
      label: 'Bước 2: Nguyên lý 1%',
      fields: [
        textarea('leadIn', 'Lời dẫn mở đầu bước 2'),
        text('chartTitle', 'Tiêu đề biểu đồ'),
        text('chartSubtitle', 'Mô tả dưới tiêu đề biểu đồ'),
      ],
    },
    {
      name: 'step3',
      type: 'group',
      label: 'Bước 3: Tìm Mentor',
      fields: [
        textarea('leadIn', 'Lời dẫn mở đầu bước 3'),
        text('scorecardTitle', 'Tiêu đề bảng soi một ngày'),
        textarea('scorecardDesc', 'Mô tả bảng soi một ngày'),
        text('mentorTitle', 'Tiêu đề chọn Mentor'),
        textarea('mentorDesc', 'Mô tả chọn Mentor'),
        textarea('emptyMentorHint', 'Gợi ý khi chưa đánh dấu việc có ích'),
        text('mentorTimeLabel', 'Nhãn câu hỏi thời gian'),
        text('mentorSuccessHint', 'Gợi ý xác nhận khi đã chọn Mentor'),
      ],
    },
    {
      name: 'step4',
      type: 'group',
      label: 'Bước 4: Gọi tên thói quen',
      fields: [
        textarea('leadIn', 'Lời dẫn mở đầu bước 4'),
        text('statementTitle', 'Tiêu đề tuyên ngôn'),
        text('statementDesc', 'Mô tả tuyên ngôn'),
        textarea('suggestedRoles', 'Gợi ý vai trò (mỗi dòng 1 gợi ý)'),
        text('rhythmTitle', 'Tiêu đề nhịp điệu thói quen'),
        text('rhythmDesc', 'Mô tả nhịp điệu'),
        textarea('rhythmNote', 'Lưu ý về ngày nghỉ theo nhịp'),
        text('atomicHabitTitle', 'Tiêu đề thói quen hạt nhân'),
        text('atomicHabitDesc', 'Mô tả thói quen hạt nhân'),
        textarea('suggestedAtomicHabits', 'Gợi ý thói quen hạt nhân (mỗi dòng 1 gợi ý)'),
        text('commitmentTitle', 'Tiêu đề phần lý do & cam kết'),
        text('whyImportantLabel', 'Câu hỏi vì sao điều này quan trọng'),
        textarea('whyImportantPlaceholder', 'Placeholder ô nhập lý do'),
        textarea('whyImportantNote', 'Lưu ý bên dưới ô nhập lý do'),
      ],
    },
    {
      name: 'step5',
      type: 'group',
      label: 'Bước 5: Thiết kế vòng lặp',
      fields: [
        textarea('leadIn', 'Lời dẫn mở đầu bước 5'),
        text('customActionPlaceholder', 'Placeholder khi ghi chú áp dụng'),
      ],
    },
    {
      name: 'step6',
      type: 'group',
      label: 'Bước 6: Thẻ lên tàu (Boarding Pass)',
      fields: [
        textarea('leadIn', 'Lời dẫn mở đầu bước 6'),
        text('passTitle', 'Tiêu đề lớn trên thẻ'),
        text('passSubtitle', 'Tiêu đề phụ trên thẻ'),
        textarea('termsText', 'Lời xác nhận cam kết / điều khoản'),
      ],
    },
    {
      name: 'checkIn',
      type: 'group',
      label: 'Hộp thoại Check-in ngày',
      fields: [
        textarea('postDayHint', 'Lời dẫn ngày cần check-in'),
        textarea('restDayHint', 'Lời dẫn ngày nghỉ theo nhịp'),
        textarea('notePlaceholder', 'Placeholder ô ghi chú cảm xúc'),
      ],
    },
    {
      name: 'footer',
      type: 'group',
      label: 'Chân trang Habit Tracker (Footer)',
      fields: [
        text('slogan', 'Khẩu hiệu thương hiệu'),
        text('authorInfo', 'Thông tin tác giả / Coach'),
        textarea('bookCredits', 'Đoạn ghi nhận nguồn sách tham khảo'),
      ],
    },
  ],
}
