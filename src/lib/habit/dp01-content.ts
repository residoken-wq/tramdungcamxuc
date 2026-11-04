/**
 * DP-01d: Central defaults and helper for habit journey copy from DIGITAL PRODUCT.zip.
 * All default text strings live here in one place and can be overridden by CMS content.
 */

export interface Dp01HeaderContent {
  badgeText: string
  titleLine1: string
  titleLine2: string
  seriesBadge: string
  tagline: string
  introText: string
  stage1Title: string
  stage1Desc: string
  stage2Title: string
  stage2Desc: string
  stage3Title: string
  stage3Desc: string
}

export interface Dp01Step1Content {
  leadIn: string
  cueDiagnosis: string
  cravingDiagnosis: string
  responseDiagnosis: string
  rewardDiagnosis: string
}

export interface Dp01Step2Content {
  leadIn: string
  chartTitle: string
  chartSubtitle: string
}

export interface Dp01Step3Content {
  leadIn: string
  scorecardTitle: string
  scorecardDesc: string
  mentorTitle: string
  mentorDesc: string
  emptyMentorHint: string
  mentorTimeLabel: string
  mentorSuccessHint: string
}

export interface Dp01Step4Content {
  leadIn: string
  leadInEmphasis: string
  statementTitle: string
  statementDesc: string
  suggestedRoles: string[]
  rhythmTitle: string
  rhythmDesc: string
  rhythmNote: string
  atomicHabitTitle: string
  atomicHabitDesc: string
  suggestedAtomicHabits: string[]
  commitmentTitle: string
  whyImportantLabel: string
  whyImportantPlaceholder: string
  whyImportantNote: string
}

export interface Dp01Step5Content {
  leadIn: string
  theoryTitle: string
  theoryDesc: string
  customActionPlaceholder: string
}

export interface Dp01TrackerContent {
  myDataTitle: string
  myDataDesc: string
}

export interface Dp01Step6Content {
  leadIn: string
  passTitle: string
  passSubtitle: string
  termsText: string
}

export interface Dp01CheckInContent {
  postDayHint: string
  restDayHint: string
  notePlaceholder: string
}

export interface Dp01FooterContent {
  slogan: string
  authorInfo: string
  bookCredits: string
}

export interface Dp01AllContent {
  header: Dp01HeaderContent
  step1: Dp01Step1Content
  step2: Dp01Step2Content
  step3: Dp01Step3Content
  step4: Dp01Step4Content
  step5: Dp01Step5Content
  step6: Dp01Step6Content
  tracker: Dp01TrackerContent
  checkIn: Dp01CheckInContent
  footer: Dp01FooterContent
}

export const DEFAULT_DP01_CONTENT: Dp01AllContent = {
  header: {
    badgeText: 'CONTENT CREATOR HUB • TRẠM DỪNG CẢM XÚC',
    titleLine1: 'Xây Thói Quen',
    titleLine2: 'Dựng Thương Hiệu',
    seriesBadge: 'FORM HABIT · BUILD IDENTITY',
    tagline: 'Đều đặn một điều — mọi điều đều đặn',
    introText:
      'Đây không phải một hành động giúp bạn thành công chỉ sau một đêm, nhưng nó cũng không kéo dài từ năm này qua năm khác. Bạn chỉ cần đi theo từng hướng dẫn sau đây trong 28 ngày để có một bước chuyển rõ nét cho thói quen của mình, qua 3 giai đoạn:',
    stage1Title: 'Khám thói quen',
    stage1Desc: 'Khám đúng nút thắt · Hiểu nguyên lý',
    stage2Title: 'Xây thói quen',
    stage2Desc: 'Tìm Mentor · Gọi tên · Thiết kế vòng lặp',
    stage3Title: 'Chuyển mình',
    stage3Desc: '28 ngày theo dõi cùng thói quen',
  },
  step1: {
    leadIn: '',
    cueDiagnosis:
      'Thói quen của bạn chưa có tín hiệu rõ ràng. Nó đang chờ bạn tự nhớ ra — mà trí nhớ thì luôn bận.',
    cravingDiagnosis:
      'Việc này chưa đủ hấp dẫn với bạn, nên bạn né nó một cách rất tự nhiên — không phải vì lười.',
    responseDiagnosis:
      'Mỗi lần bắt đầu đang tốn quá nhiều công sức. Không ai duy trì nổi một việc nặng trong 28 ngày.',
    rewardDiagnosis:
      'Bạn chưa nhận được sự ghi nhận nào ngay sau khi làm, nên não chưa thấy việc này đáng để lặp lại.',
  },
  step2: {
    leadIn:
      'Hầu hết mọi người nghe câu “1% mỗi ngày” rồi gật đầu bỏ qua. Nhưng hiểu đúng nguyên lý này là thứ quyết định bạn có đi qua nổi tuần thứ ba hay không.',
    chartTitle: 'Biểu đồ: Vùng năng lực tiềm ẩn',
    chartSubtitle: 'Đường cong bứt phá (Thực tế vs Tôi nghĩ sẽ là)',
  },
  step3: {
    leadIn:
      'Một thói quen mới không tự đứng được. Nó cần một thói quen cũ đã vững dìu đi — và thói quen cũ đó đã nằm sẵn trong ngày của bạn. Việc của bạn chỉ là tìm ra nó.',
    scorecardTitle: 'Soi lại một ngày của bạn',
    scorecardDesc:
      'Liệt kê những việc bạn thật sự làm mỗi ngày, từ lúc mở mắt đến lúc đi ngủ. Đánh dấu có ích +, không có ích −, trung tính =.',
    mentorTitle: 'Chọn Mentor',
    mentorDesc:
      'Mentor là một việc bạn làm gần như mỗi ngày mà không cần nghĩ. Nó sẽ là tín hiệu kéo thói quen mới đi theo. Chọn một việc bạn đã đánh dấu +.',
    emptyMentorHint: 'Chưa có việc nào được đánh dấu + ở bảng trên.',
    mentorTimeLabel: 'Việc này thường diễn ra lúc mấy giờ? — không bắt buộc',
    mentorSuccessHint: 'Thói quen mới sẽ đi ngay sau việc này.',
  },
  step4: {
    leadIn: 'Bắt đầu từ con người bạn muốn trở thành, rồi mới đến hành động.',
    leadInEmphasis:
      'Thương hiệu cá nhân không phải việc làm thêm — nó là kết quả của hành động bạn lặp lại mỗi ngày.',
    statementTitle: 'Tuyên ngôn về thói quen',
    statementDesc: 'Điền câu khẳng định căn tính và hành động cốt lõi của bạn',
    suggestedRoles: [
      'người luôn học hỏi',
      'người giữ lời với chính mình',
      'người chia sẻ đều đặn',
      'người sống khỏe và đầy năng lượng',
    ],
    rhythmTitle: 'Nhịp điệu thói quen',
    rhythmDesc: 'Mỗi tuần bạn sẽ bỏ phiếu bao nhiêu lần? Chọn số lần, rồi chọn thứ.',
    rhythmNote: 'Ngày không nằm trong nhịp là ngày nghỉ có kế hoạch, không phải ngày bỏ lỡ.',
    atomicHabitTitle: 'Thói quen hạt nhân',
    atomicHabitDesc:
      'Để thực hiện được tuyên ngôn này, thói quen hạt nhân tôi sẽ làm là… — dưới 2 phút',
    suggestedAtomicHabits: [
      'đọc 1 trang sách',
      'ghi 1 ý tưởng vào sổ',
      'mặc đồ tập và ra khỏi cửa',
      'viết 3 dòng nháp',
    ],
    commitmentTitle: 'Vì sao điều này quan trọng & Cam kết',
    whyImportantLabel: 'Vì sao điều này quan trọng với bạn?',
    whyImportantPlaceholder: 'Lắng nghe bên trong một chút. Điều gì thật sự thôi thúc bạn?',
    whyImportantNote: 'Câu này chỉ mình bạn đọc. Nó sẽ hiện lại vào đúng ngày bạn muốn bỏ cuộc.',
  },
  step5: {
    // Empty: Step5LoopDesign falls back to the zip lead-in (with its inline emphasis).
    leadIn: '',
    theoryTitle: 'Vòng lặp thói quen · The Habit Loop',
    theoryDesc:
      'Mọi thói quen, tốt hay xấu, đều chạy qua bốn giai đoạn khép kín này — lặp đi lặp lại thành một vòng tròn.',
    customActionPlaceholder: '',
  },
  step6: {
    leadIn:
      'Tấm vé lên chuyến 28 ngày của bạn. Tải về làm hình nền điện thoại, hoặc đăng lên mạng xã hội — đó vừa là lời tuyên bố, vừa là cách khó quay đầu nhất.',
    passTitle: 'HABIT BOARDING PASS',
    passSubtitle: '',
    // Not in the zip: the repo's approved consent wording (vi.habit.wizard.step4.consentLabel).
    termsText: 'Tôi đồng ý lưu kế hoạch và nhận thông tin từ Trạm Dừng Cảm Xúc theo',
  },
  tracker: {
    myDataTitle: 'Dữ liệu của bạn',
    myDataDesc: 'Lưu trữ cục bộ trên trình duyệt này & đồng bộ về tài khoản khi đăng nhập.',
  },
  checkIn: {
    postDayHint:
      'Hôm nay là ngày bạn bỏ phiếu cho con người bạn muốn trở thành — bằng thói quen hạt nhân:',
    restDayHint: 'Hôm nay là ngày nghỉ theo nhịp bạn chọn. Nếu vẫn làm, ghi lại cũng được:',
    notePlaceholder: 'Ghi lại cảm xúc hoặc chiêm nghiệm nhỏ...',
  },
  footer: {
    slogan: 'Dừng lại • Lắng nghe • Sống trọn vẹn hơn',
    authorInfo: 'Hana Lương • Career Clarity Coach • Trạm Dừng Cảm Xúc',
    bookCredits:
      'Nội dung chia sẻ có vay mượn chất xám từ bốn cuốn sách nổi tiếng về thói quen — Atomic Habits, The Power of Habit, The 7 Habits of Highly Effective People, Hooked — kết hợp với hành trình “đập đi, xây lại” nhiều lần của chính mình.',
  },
}

function parseLines(val: unknown, fallback: string[]): string[] {
  if (Array.isArray(val)) {
    const list = val
      .map((x) =>
        typeof x === 'string'
          ? x.trim()
          : typeof x === 'object' && x && 'text' in x
            ? String((x as { text: unknown }).text).trim()
            : '',
      )
      .filter(Boolean)
    return list.length > 0 ? list : fallback
  }
  if (typeof val === 'string' && val.trim().length > 0) {
    const list = val
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
    return list.length > 0 ? list : fallback
  }
  return fallback
}

function pickString(val: unknown, fallback: string): string {
  return typeof val === 'string' && val.trim().length > 0 ? val.trim() : fallback
}

/**
 * Returns complete DP01 habit journey copy with defaults filled from DIGITAL PRODUCT.zip.
 * CMS values override defaults whenever they are non-empty.
 */
export function withDp01Defaults(
  cmsContent?: Partial<Dp01AllContent> | Record<string, unknown> | null,
): Dp01AllContent {
  const c = (cmsContent || {}) as Record<string, Record<string, unknown> | undefined>

  const header = c.header || {}
  const step1 = c.step1 || {}
  const step2 = c.step2 || {}
  const step3 = c.step3 || {}
  const step4 = c.step4 || {}
  const step5 = c.step5 || {}
  const step6 = c.step6 || {}
  const checkIn = c.checkIn || {}
  const footer = c.footer || {}
  const tracker = ((c as Record<string, unknown>).tracker as Record<string, unknown> | undefined) || {}

  return {
    header: {
      badgeText: pickString(header.badgeText, DEFAULT_DP01_CONTENT.header.badgeText),
      titleLine1: pickString(header.titleLine1, DEFAULT_DP01_CONTENT.header.titleLine1),
      titleLine2: pickString(header.titleLine2, DEFAULT_DP01_CONTENT.header.titleLine2),
      seriesBadge: pickString(header.seriesBadge, DEFAULT_DP01_CONTENT.header.seriesBadge),
      tagline: pickString(header.tagline, DEFAULT_DP01_CONTENT.header.tagline),
      introText: pickString(header.introText, DEFAULT_DP01_CONTENT.header.introText),
      stage1Title: pickString(header.stage1Title, DEFAULT_DP01_CONTENT.header.stage1Title),
      stage1Desc: pickString(header.stage1Desc, DEFAULT_DP01_CONTENT.header.stage1Desc),
      stage2Title: pickString(header.stage2Title, DEFAULT_DP01_CONTENT.header.stage2Title),
      stage2Desc: pickString(header.stage2Desc, DEFAULT_DP01_CONTENT.header.stage2Desc),
      stage3Title: pickString(header.stage3Title, DEFAULT_DP01_CONTENT.header.stage3Title),
      stage3Desc: pickString(header.stage3Desc, DEFAULT_DP01_CONTENT.header.stage3Desc),
    },
    step1: {
      leadIn: pickString(step1.leadIn, DEFAULT_DP01_CONTENT.step1.leadIn),
      cueDiagnosis: pickString(step1.cueDiagnosis, DEFAULT_DP01_CONTENT.step1.cueDiagnosis),
      cravingDiagnosis: pickString(
        step1.cravingDiagnosis,
        DEFAULT_DP01_CONTENT.step1.cravingDiagnosis,
      ),
      responseDiagnosis: pickString(
        step1.responseDiagnosis,
        DEFAULT_DP01_CONTENT.step1.responseDiagnosis,
      ),
      rewardDiagnosis: pickString(
        step1.rewardDiagnosis,
        DEFAULT_DP01_CONTENT.step1.rewardDiagnosis,
      ),
    },
    step2: {
      leadIn: pickString(step2.leadIn, DEFAULT_DP01_CONTENT.step2.leadIn),
      chartTitle: pickString(step2.chartTitle, DEFAULT_DP01_CONTENT.step2.chartTitle),
      chartSubtitle: pickString(step2.chartSubtitle, DEFAULT_DP01_CONTENT.step2.chartSubtitle),
    },
    step3: {
      leadIn: pickString(step3.leadIn, DEFAULT_DP01_CONTENT.step3.leadIn),
      scorecardTitle: pickString(step3.scorecardTitle, DEFAULT_DP01_CONTENT.step3.scorecardTitle),
      scorecardDesc: pickString(step3.scorecardDesc, DEFAULT_DP01_CONTENT.step3.scorecardDesc),
      mentorTitle: pickString(step3.mentorTitle, DEFAULT_DP01_CONTENT.step3.mentorTitle),
      mentorDesc: pickString(step3.mentorDesc, DEFAULT_DP01_CONTENT.step3.mentorDesc),
      emptyMentorHint: pickString(
        step3.emptyMentorHint,
        DEFAULT_DP01_CONTENT.step3.emptyMentorHint,
      ),
      mentorTimeLabel: pickString(
        step3.mentorTimeLabel,
        DEFAULT_DP01_CONTENT.step3.mentorTimeLabel,
      ),
      mentorSuccessHint: pickString(
        step3.mentorSuccessHint,
        DEFAULT_DP01_CONTENT.step3.mentorSuccessHint,
      ),
    },
    step4: {
      leadIn: pickString(step4.leadIn, DEFAULT_DP01_CONTENT.step4.leadIn),
      leadInEmphasis: pickString(
        step4.leadInEmphasis,
        DEFAULT_DP01_CONTENT.step4.leadInEmphasis,
      ),
      statementTitle: pickString(step4.statementTitle, DEFAULT_DP01_CONTENT.step4.statementTitle),
      statementDesc: pickString(step4.statementDesc, DEFAULT_DP01_CONTENT.step4.statementDesc),
      suggestedRoles: parseLines(step4.suggestedRoles, DEFAULT_DP01_CONTENT.step4.suggestedRoles),
      rhythmTitle: pickString(step4.rhythmTitle, DEFAULT_DP01_CONTENT.step4.rhythmTitle),
      rhythmDesc: pickString(step4.rhythmDesc, DEFAULT_DP01_CONTENT.step4.rhythmDesc),
      rhythmNote: pickString(step4.rhythmNote, DEFAULT_DP01_CONTENT.step4.rhythmNote),
      atomicHabitTitle: pickString(
        step4.atomicHabitTitle,
        DEFAULT_DP01_CONTENT.step4.atomicHabitTitle,
      ),
      atomicHabitDesc: pickString(
        step4.atomicHabitDesc,
        DEFAULT_DP01_CONTENT.step4.atomicHabitDesc,
      ),
      suggestedAtomicHabits: parseLines(
        step4.suggestedAtomicHabits,
        DEFAULT_DP01_CONTENT.step4.suggestedAtomicHabits,
      ),
      commitmentTitle: pickString(
        step4.commitmentTitle,
        DEFAULT_DP01_CONTENT.step4.commitmentTitle,
      ),
      whyImportantLabel: pickString(
        step4.whyImportantLabel,
        DEFAULT_DP01_CONTENT.step4.whyImportantLabel,
      ),
      whyImportantPlaceholder: pickString(
        step4.whyImportantPlaceholder,
        DEFAULT_DP01_CONTENT.step4.whyImportantPlaceholder,
      ),
      whyImportantNote: pickString(
        step4.whyImportantNote,
        DEFAULT_DP01_CONTENT.step4.whyImportantNote,
      ),
    },
    step5: {
      leadIn: pickString(step5.leadIn, DEFAULT_DP01_CONTENT.step5.leadIn),
      theoryTitle: pickString(step5.theoryTitle, DEFAULT_DP01_CONTENT.step5.theoryTitle),
      theoryDesc: pickString(step5.theoryDesc, DEFAULT_DP01_CONTENT.step5.theoryDesc),
      customActionPlaceholder: pickString(
        step5.customActionPlaceholder,
        DEFAULT_DP01_CONTENT.step5.customActionPlaceholder,
      ),
    },
    step6: {
      leadIn: pickString(step6.leadIn, DEFAULT_DP01_CONTENT.step6.leadIn),
      passTitle: pickString(step6.passTitle, DEFAULT_DP01_CONTENT.step6.passTitle),
      passSubtitle: pickString(step6.passSubtitle, DEFAULT_DP01_CONTENT.step6.passSubtitle),
      termsText: pickString(step6.termsText, DEFAULT_DP01_CONTENT.step6.termsText),
    },
    tracker: {
      myDataTitle: pickString(
        tracker.myDataTitle as string | undefined,
        DEFAULT_DP01_CONTENT.tracker.myDataTitle,
      ),
      myDataDesc: pickString(
        tracker.myDataDesc as string | undefined,
        DEFAULT_DP01_CONTENT.tracker.myDataDesc,
      ),
    },
    checkIn: {
      postDayHint: pickString(checkIn.postDayHint, DEFAULT_DP01_CONTENT.checkIn.postDayHint),
      restDayHint: pickString(checkIn.restDayHint, DEFAULT_DP01_CONTENT.checkIn.restDayHint),
      notePlaceholder: pickString(
        checkIn.notePlaceholder,
        DEFAULT_DP01_CONTENT.checkIn.notePlaceholder,
      ),
    },
    footer: {
      slogan: pickString(footer.slogan, DEFAULT_DP01_CONTENT.footer.slogan),
      authorInfo: pickString(footer.authorInfo, DEFAULT_DP01_CONTENT.footer.authorInfo),
      bookCredits: pickString(footer.bookCredits, DEFAULT_DP01_CONTENT.footer.bookCredits),
    },
  }
}
