/**
 * HB-26: Pure logic for patching Habit Journey Content from docs/content/habit-v2-ban-moi.md
 * Idempotent, safe dry-run diffing, preserves untouched fields (stations, diagnose.questions, stats, rules, etc.).
 */

export function createLexicalParagraph(text: string) {
  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      direction: 'ltr' as const,
      children: [
        {
          type: 'paragraph',
          format: '',
          indent: 0,
          version: 1,
          direction: 'ltr' as const,
          textFormat: 0,
          children: [
            {
              type: 'text',
              text,
              format: 0,
              detail: 0,
              mode: 'normal',
              style: '',
              version: 1,
            },
          ],
        },
      ],
    },
  }
}

export function extractLexicalText(node: unknown): string {
  if (!node) return ''
  if (typeof node === 'string') return node
  if (typeof node === 'object') {
    const obj = node as Record<string, unknown>
    if (typeof obj.text === 'string') return obj.text
    if (Array.isArray(obj.children)) {
      return obj.children.map(extractLexicalText).join('')
    }
    if (obj.root) return extractLexicalText(obj.root)
  }
  return ''
}

export const TARGET_HABIT_CONTENT = {
  diagnose: {
    title: 'Khám đúng “bệnh” — Kê đúng “toa”',
    introText:
      'Bạn đã đọc sách, đã lập kế hoạch, đã bắt đầu vài lần. Vấn đề không nằm ở việc bạn thiếu kỷ luật.',
    quote: {
      text: 'Chúng ta chỉ đang thay đổi thói quen bằng hành động đơn lẻ. Trong khi thứ chúng ta cần là một hệ thống — một vòng lặp — cho thói quen.',
      author: 'James Clear',
      source: 'Atomic Habits',
      sourceUrl: null as string | null,
    },
  },
  onePercent: {
    title: 'Nguyên lý 1% tốt hơn mỗi ngày',
    introText:
      'Hầu hết mọi người nghe câu “1% mỗi ngày” rồi gật đầu bỏ qua. Nhưng hiểu đúng nguyên lý này là thứ quyết định bạn có đi qua nổi tuần thứ ba hay không.',
    unknowns: [
      {
        title: 'Giai đoạn thất vọng',
        body: 'Bạn chỉ phát huy được tiềm năng của mình sau khi đi qua giai đoạn thất vọng — quãng mà kết quả thấp hơn hẳn công sức bỏ ra.',
      },
      {
        title: 'Tiến trình',
        body: 'Bí quyết đi qua giai đoạn đó là tin vào tiến trình thay vì kết quả. Tiến trình là số lần bạn đã làm, không phải kết quả bạn đã thấy.',
      },
      {
        title: 'Tư duy và phương pháp hợp với mình',
        body: 'Tiến trình dễ hơn rất nhiều khi bạn có tư duy và phương pháp hợp với mình — chứ không phải phương pháp hợp với người bạn đang ngưỡng mộ.',
      },
    ],
    closing:
      'Lời giải không nằm ở cố gắng nhiều hơn, mà ở một hệ thống tốt hơn. Ở giai đoạn 2, bạn sẽ tự tay xây hệ thống đó cho thói quen của mình.',
    facts: [] as unknown[],
  },
  stepQuotes: {
    onePercent: {
      text: 'Thay đổi thói quen thực ra là thay đổi tư duy.',
      author: 'Robert Kiyosaki',
      source: 'Cha giàu Cha nghèo',
      sourceUrl: null as string | null,
    },
    mentor: {
      text: 'Môi trường là bàn tay vô hình định hình hành vi của con người.',
      author: 'James Clear',
      source: 'Atomic Habits',
      sourceUrl: null as string | null,
    },
    name: {
      text: 'Mỗi hành động bạn thực hiện là một lá phiếu cho con người mà bạn muốn trở thành.',
      author: 'James Clear',
      source: 'Atomic Habits',
      sourceUrl: null as string | null,
    },
    loop: {
      text: 'Bạn không vươn tới tầm mục tiêu của mình. Bạn rơi xuống tầm hệ thống của mình.',
      author: 'James Clear',
      source: 'Atomic Habits',
      sourceUrl: null as string | null,
    },
    tracker: {
      text: 'Thói quen là lãi kép của sự tự hoàn thiện.',
      author: 'James Clear',
      source: 'Atomic Habits',
      sourceUrl: null as string | null,
    },
  },
  loop: {
    stages: [
      {
        stage: 'cue',
        title: 'Tín hiệu',
        explanation: 'Tín hiệu kích hoạt khao khát.',
      },
      {
        stage: 'craving',
        title: 'Khao khát',
        explanation: 'Khao khát thúc đẩy phản hồi.',
      },
      {
        stage: 'response',
        title: 'Phản hồi',
        explanation: 'Phản hồi đưa đến phần thưởng.',
      },
      {
        stage: 'reward',
        title: 'Phần thưởng',
        explanation:
          'Phần thưởng thỏa mãn khao khát — và gắn ngược lại với tín hiệu, để lần sau não tự đoán trước cách phản hồi.',
      },
    ],
    note: 'Hai giai đoạn đầu là vấn đề, hai giai đoạn sau là giải pháp. Bốn quy tắc dưới đây là cách bạn thiết kế lại từng mắt xích.',
    techniqueHint:
      'Đánh dấu kỹ thuật bạn sẽ dùng — chỉ những kỹ thuật được đánh dấu mới hiện trên Habit Boarding Pass.',
  },
  tracker: {
    afterJourneyTitle: 'Đồng hành sau 28 ngày',
    afterJourneyText:
      'Nếu cần một Habit Coach đồng hành cùng bạn sau hành trình 28 ngày này, đặt một buổi trò chuyện với Hana.',
  },
  quotes: [] as unknown[],
}

export type HabitContentPatchResult = Record<string, unknown> | null

/**
 * Checks whether current value matches target value for all HB-26 fields.
 * If all fields already match target, returns null (idempotent, no changes).
 * Otherwise returns the patch object to be applied to global habitJourneyContent.
 */
export function buildHabitContentPatch(
  current: Record<string, any> | null | undefined,
): HabitContentPatchResult {
  const cur = current || {}

  // 1. Check if diagnose needs update
  const curDiagTitle = cur.diagnose?.title?.trim() || ''
  const curDiagIntro = extractLexicalText(cur.diagnose?.intro).trim()
  const curDiagQuoteText = cur.diagnose?.quote?.text?.trim() || ''
  const curDiagQuoteAuthor = cur.diagnose?.quote?.author?.trim() || ''
  const curDiagQuoteSource = cur.diagnose?.quote?.source?.trim() || ''

  const isDiagChanged =
    curDiagTitle !== TARGET_HABIT_CONTENT.diagnose.title ||
    curDiagIntro !== TARGET_HABIT_CONTENT.diagnose.introText ||
    curDiagQuoteText !== TARGET_HABIT_CONTENT.diagnose.quote.text ||
    curDiagQuoteAuthor !== TARGET_HABIT_CONTENT.diagnose.quote.author ||
    curDiagQuoteSource !== TARGET_HABIT_CONTENT.diagnose.quote.source

  // 2. Check if onePercent needs update
  const curOpTitle = cur.onePercent?.title?.trim() || ''
  const curOpIntro = extractLexicalText(cur.onePercent?.intro).trim()
  const curOpClosing = cur.onePercent?.closing?.trim() || ''
  const curOpFactsCount = Array.isArray(cur.onePercent?.facts) ? cur.onePercent.facts.length : 0
  const curOpUnknowns = Array.isArray(cur.onePercent?.unknowns) ? cur.onePercent.unknowns : []
  const isUnknownsChanged =
    curOpUnknowns.length !== TARGET_HABIT_CONTENT.onePercent.unknowns.length ||
    curOpUnknowns.some(
      (u: any, idx: number) =>
        u?.title?.trim() !== TARGET_HABIT_CONTENT.onePercent.unknowns[idx].title ||
        u?.body?.trim() !== TARGET_HABIT_CONTENT.onePercent.unknowns[idx].body,
    )

  const isOnePercentChanged =
    curOpTitle !== TARGET_HABIT_CONTENT.onePercent.title ||
    curOpIntro !== TARGET_HABIT_CONTENT.onePercent.introText ||
    curOpClosing !== TARGET_HABIT_CONTENT.onePercent.closing ||
    curOpFactsCount > 0 ||
    isUnknownsChanged

  // 3. Check if stepQuotes needs update
  const checkQuote = (key: keyof typeof TARGET_HABIT_CONTENT.stepQuotes) => {
    const curQ = cur.stepQuotes?.[key]
    const targetQ = TARGET_HABIT_CONTENT.stepQuotes[key]
    return (
      (curQ?.text?.trim() || '') !== targetQ.text ||
      (curQ?.author?.trim() || '') !== targetQ.author ||
      (curQ?.source?.trim() || '') !== targetQ.source
    )
  }

  const isStepQuotesChanged =
    checkQuote('onePercent') ||
    checkQuote('mentor') ||
    checkQuote('name') ||
    checkQuote('loop') ||
    checkQuote('tracker')

  // 4. Check if loop needs update
  const curLoopStages = Array.isArray(cur.loop?.stages) ? cur.loop.stages : []
  const isLoopStagesChanged =
    curLoopStages.length !== TARGET_HABIT_CONTENT.loop.stages.length ||
    curLoopStages.some(
      (s: any, idx: number) =>
        s?.stage !== TARGET_HABIT_CONTENT.loop.stages[idx].stage ||
        s?.title?.trim() !== TARGET_HABIT_CONTENT.loop.stages[idx].title ||
        s?.explanation?.trim() !== TARGET_HABIT_CONTENT.loop.stages[idx].explanation,
    )
  const isLoopNoteChanged =
    (cur.loop?.note?.trim() || '') !== TARGET_HABIT_CONTENT.loop.note ||
    (cur.loop?.techniqueHint?.trim() || '') !== TARGET_HABIT_CONTENT.loop.techniqueHint

  const isLoopChanged = isLoopStagesChanged || isLoopNoteChanged

  // 5. Check tracker content
  const isTrackerChanged =
    (cur.tracker?.afterJourneyTitle?.trim() || '') !==
      TARGET_HABIT_CONTENT.tracker.afterJourneyTitle ||
    (cur.tracker?.afterJourneyText?.trim() || '') !== TARGET_HABIT_CONTENT.tracker.afterJourneyText

  // 6. privacyNote is NOT patched (HB-26c): the new copy says data stays in the browser, which is
  // false here (the tracker is saved on the server per account). Hana writes the sentence herself.

  // 7. Check quotes (legacy)
  const isQuotesChanged = Array.isArray(cur.quotes) && cur.quotes.length > 0

  const hasAnyChanges =
    isDiagChanged ||
    isOnePercentChanged ||
    isStepQuotesChanged ||
    isLoopChanged ||
    isTrackerChanged ||
    isQuotesChanged

  if (!hasAnyChanges) {
    return null
  }

  const patch: Record<string, unknown> = {}

  if (isDiagChanged) {
    patch.diagnose = {
      ...cur.diagnose,
      title: TARGET_HABIT_CONTENT.diagnose.title,
      intro: createLexicalParagraph(TARGET_HABIT_CONTENT.diagnose.introText),
      quote: {
        text: TARGET_HABIT_CONTENT.diagnose.quote.text,
        author: TARGET_HABIT_CONTENT.diagnose.quote.author,
        source: TARGET_HABIT_CONTENT.diagnose.quote.source,
        sourceUrl: TARGET_HABIT_CONTENT.diagnose.quote.sourceUrl,
      },
    }
  }

  if (isOnePercentChanged) {
    patch.onePercent = {
      ...cur.onePercent,
      title: TARGET_HABIT_CONTENT.onePercent.title,
      intro: createLexicalParagraph(TARGET_HABIT_CONTENT.onePercent.introText),
      unknowns: TARGET_HABIT_CONTENT.onePercent.unknowns.map((u) => ({ ...u })),
      closing: TARGET_HABIT_CONTENT.onePercent.closing,
      facts: [],
    }
  }

  if (isStepQuotesChanged) {
    patch.stepQuotes = {
      ...cur.stepQuotes,
      onePercent: { ...TARGET_HABIT_CONTENT.stepQuotes.onePercent },
      mentor: { ...TARGET_HABIT_CONTENT.stepQuotes.mentor },
      name: { ...TARGET_HABIT_CONTENT.stepQuotes.name },
      loop: { ...TARGET_HABIT_CONTENT.stepQuotes.loop },
      tracker: { ...TARGET_HABIT_CONTENT.stepQuotes.tracker },
    }
  }

  if (isLoopChanged) {
    patch.loop = {
      ...cur.loop,
      stages: TARGET_HABIT_CONTENT.loop.stages.map((st) => ({ ...st })),
      note: TARGET_HABIT_CONTENT.loop.note,
      techniqueHint: TARGET_HABIT_CONTENT.loop.techniqueHint,
    }
  }

  if (isTrackerChanged) {
    patch.tracker = {
      ...cur.tracker,
      afterJourneyTitle: TARGET_HABIT_CONTENT.tracker.afterJourneyTitle,
      afterJourneyText: TARGET_HABIT_CONTENT.tracker.afterJourneyText,
    }
  }

  if (isQuotesChanged) {
    patch.quotes = []
  }

  return patch
}

export function formatHabitContentDiff(current: any, patch: Record<string, any> | null): string {
  if (!patch) {
    return 'Dữ liệu habitJourneyContent đã hoàn toàn khớp bản mới. Không có thay đổi nào (0 diff).'
  }

  const lines: string[] = []

  if (patch.diagnose) {
    if (patch.diagnose.title !== current?.diagnose?.title) {
      lines.push(
        `- diagnose.title:\n    Cũ: "${current?.diagnose?.title || ''}"\n    Mới: "${patch.diagnose.title}"`,
      )
    }
    const oldIntro = extractLexicalText(current?.diagnose?.intro).trim()
    const newIntro = TARGET_HABIT_CONTENT.diagnose.introText
    if (oldIntro !== newIntro) {
      lines.push(`- diagnose.intro:\n    Cũ: "${oldIntro}"\n    Mới: "${newIntro}"`)
    }
    if (patch.diagnose.quote?.text !== current?.diagnose?.quote?.text) {
      lines.push(
        `- diagnose.quote:\n    Cũ: "${current?.diagnose?.quote?.text || ''}" (${current?.diagnose?.quote?.author || ''}, ${current?.diagnose?.quote?.source || ''})\n    Mới: "${patch.diagnose.quote.text}" (${patch.diagnose.quote.author}, ${patch.diagnose.quote.source})`,
      )
    }
  }

  if (patch.onePercent) {
    if (patch.onePercent.title !== current?.onePercent?.title) {
      lines.push(
        `- onePercent.title:\n    Cũ: "${current?.onePercent?.title || ''}"\n    Mới: "${patch.onePercent.title}"`,
      )
    }
    const oldIntro = extractLexicalText(current?.onePercent?.intro).trim()
    const newIntro = TARGET_HABIT_CONTENT.onePercent.introText
    if (oldIntro !== newIntro) {
      lines.push(`- onePercent.intro:\n    Cũ: "${oldIntro}"\n    Mới: "${newIntro}"`)
    }
    if (patch.onePercent.closing !== current?.onePercent?.closing) {
      lines.push(
        `- onePercent.closing:\n    Cũ: "${current?.onePercent?.closing || ''}"\n    Mới: "${patch.onePercent.closing}"`,
      )
    }
    if (Array.isArray(current?.onePercent?.facts) && current.onePercent.facts.length > 0) {
      lines.push(
        `- onePercent.facts (ẩn & xóa rỗng):\n    Cũ: [${current.onePercent.facts.length} mục]\n    Mới: []`,
      )
    }
    if (patch.onePercent.unknowns) {
      const oldUnknowns = (current?.onePercent?.unknowns ?? [])
        .map((u: { title?: string }) => `"${u?.title ?? ''}"`)
        .join(', ')
      const newUnknowns = TARGET_HABIT_CONTENT.onePercent.unknowns
        .map((u) => `"${u.title}"`)
        .join(', ')
      lines.push(
        `- onePercent.unknowns (3 điều):\n    Cũ: [${oldUnknowns}]\n    Mới: [${newUnknowns}]`,
      )
    }
  }

  if (patch.stepQuotes) {
    // stepQuotes.boardingPass is left untouched (HB-26c): the new version has no source for it.
    const keys = ['onePercent', 'mentor', 'name', 'loop', 'tracker'] as const
    for (const k of keys) {
      const oldQ = current?.stepQuotes?.[k]
      const newQ = patch.stepQuotes[k]
      if (oldQ?.text !== newQ?.text || oldQ?.author !== newQ?.author) {
        lines.push(
          `- stepQuotes.${k}:\n    Cũ: "${oldQ?.text || ''}" (${oldQ?.author || ''})\n    Mới: "${newQ?.text || ''}" (${newQ?.author || ''})`,
        )
      }
    }
  }

  if (patch.loop) {
    if (patch.loop.stages) {
      const oldStages = (current?.loop?.stages ?? [])
        .map(
          (st: { title?: string; explanation?: string }) =>
            `"${st?.title ?? ''}: ${st?.explanation ?? ''}"`,
        )
        .join(' | ')
      const newStages = TARGET_HABIT_CONTENT.loop.stages
        .map((st) => `"${st.title}: ${st.explanation}"`)
        .join(' | ')
      lines.push(
        `- loop.stages (4 giai đoạn):\n    Cũ: ${oldStages || '(trống)'}\n    Mới: ${newStages}`,
      )
    }
    if (patch.loop.note !== current?.loop?.note) {
      lines.push(
        `- loop.note:\n    Cũ: "${current?.loop?.note || ''}"\n    Mới: "${patch.loop.note}"`,
      )
    }
    if (patch.loop.techniqueHint !== current?.loop?.techniqueHint) {
      lines.push(
        `- loop.techniqueHint:\n    Cũ: "${current?.loop?.techniqueHint || ''}"\n    Mới: "${patch.loop.techniqueHint}"`,
      )
    }
  }

  if (patch.tracker) {
    if (patch.tracker.afterJourneyTitle !== current?.tracker?.afterJourneyTitle) {
      lines.push(
        `- tracker.afterJourneyTitle:\n    Cũ: "${current?.tracker?.afterJourneyTitle || ''}"\n    Mới: "${patch.tracker.afterJourneyTitle}"`,
      )
    }
    if (patch.tracker.afterJourneyText !== current?.tracker?.afterJourneyText) {
      lines.push(
        `- tracker.afterJourneyText:\n    Cũ: "${current?.tracker?.afterJourneyText || ''}"\n    Mới: "${patch.tracker.afterJourneyText}"`,
      )
    }
  }

  if (Array.isArray(current?.quotes) && current.quotes.length > 0) {
    lines.push(`- quotes (ẩn & xóa rỗng):\n    Cũ: [${current.quotes.length} câu]\n    Mới: []`)
  }

  return lines.join('\n\n')
}
