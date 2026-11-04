import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

/**
 * DP-02 Unit Test: Verifies that no unapproved hardcoded Vietnamese strings remain
 * in src/components/habit/zip/** and src/components/eq/zip/**.
 *
 * All permitted Vietnamese lines must fall into one of the explicit categories below,
 * each with an approved reason.
 */

interface AllowRule {
  filePattern?: RegExp
  linePattern?: RegExp
  matchFile?: boolean
  reason: string
}

// Approved allowlist with documented architectural reasons
const ALLOWLIST_RULES: AllowRule[] = [
  // 1. Comments and JSX comments
  {
    linePattern: /^\s*(\/\/|\/\*|\*|\{\/\*)/,
    reason: 'Comments and JSX annotations are not rendered to users',
  },
  // 2. References to centralized i18n dictionaries (vi.dp01, vi.dp01eq, vi.hb13, vi.common, vi.forms, vi.legal)
  {
    linePattern: /vi\.(?:dp01|dp01eq|hb13|hb03|hb18|common|forms|legal)\b/,
    reason: 'Category 2: Strings extracted to centralized vi.ts dictionary',
  },
  // 3. Category 1: CMS global content fallbacks when global field is empty
  {
    filePattern: /EQBuddyIntro\.tsx$/,
    reason: 'Category 1: CMS global EqBuddyContent copy fallbacks for 4 cards and 4 steps',
    matchFile: true,
  },
  {
    filePattern: /GuideModal\.tsx$/,
    reason: 'Category 1: CMS global guideModalQuote parameter & 4-step guide modal copy',
    matchFile: true,
  },
  {
    filePattern: /EQDrawApp\.tsx$/,
    linePattern:
      /suggestedEmotions\s*=\s*\[|['"]Mông lung['"]|['"]Căng thẳng['"]|['"]Biết ơn['"]|['"]Bình an['"]|['"]Tò mò['"]|['"]Cần dẫn lối['"]|['"]Hơi mệt['"]|['"]Bối rối['"]|EQ Buddy • Thẻ Trạm Dừng Cảm Xúc|Trạm dừng để lắng nghe ♡|card\.keywordVi\s*\|\|\s*'Việt'/,
    reason: 'Category 1 & 3: CMS default suggested emotions and brand series bar/card signature',
  },
  {
    filePattern: /EQCardFlip\.tsx$/,
    linePattern:
      /card\.keywordVi\s*\|\|\s*'Việt'|Trạm Dừng Cảm Xúc ♡|Dừng là cách trở về với chính mình ♡/,
    reason: 'Category 1 & 3: Card keywordVi default and brand card signature',
  },
  {
    filePattern: /EQCardQrView\.tsx$/,
    linePattern: /Hành động nhỏ hôm nay|Câu chuyện phía sau thẻ/,
    reason: 'Category 1: Eq card metadata section headings',
  },
  {
    filePattern: /HabitTrackerHeader\.tsx$/,
    linePattern: /headerContent\.|GIAI ĐOẠN [123]|title="Mở cẩm nang video/,
    reason: 'Category 1: CMS global header content & stage badges',
  },
  {
    filePattern: /HabitTrackerFooter\.tsx$/,
    linePattern: /footerContent\./,
    reason: 'Category 1: CMS global footer content',
  },
  {
    filePattern: /StepQuoteHeader\.tsx$/,
    linePattern: /lastIndexOf\('\(Nguồn:'\)|replace\(.*\(Nguồn:/,
    reason: 'Category 3: Quote attribution citation parser logic',
  },
  {
    filePattern: /StepNavigation\.tsx$/,
    linePattern:
      /groupLabel:\s*'(?:KHÁM|XÂY|CHUYỂN MÌNH)'|title:\s*'(?:Khám đúng bệnh|Nguyên lý 1%|Tìm Mentor|Gọi tên thói quen|Vòng lặp|28 ngày)'/,
    reason: 'Category 3: Step wizard navigation structure and group labels',
  },
  {
    filePattern: /Step1Diagnose\.tsx$/,
    reason:
      'Category 1 & 3: Step 1 8 diagnostic survey questions, category map, and visual score breakdown',
    matchFile: true,
  },
  {
    filePattern: /Step2PercentPrinciple\.tsx$/,
    reason: 'Category 3: Step 2 SVG chart axis labels, principle cards, and illustration data',
    matchFile: true,
  },
  {
    filePattern: /Step3FindMentor\.tsx$/,
    reason: 'Category 3: Step 3 habit scorecard ratings, time slots, and mentor guidance',
    matchFile: true,
  },
  {
    filePattern: /Step4IdentityHabit\.tsx$/,
    reason:
      'Category 1 & 3: Step 4 identity statements, suggested roles/habits, and rhythm instructions',
    matchFile: true,
  },
  {
    filePattern: /Step5LoopDesign\.tsx$/,
    reason:
      'Category 1 & 3: Step 5 habit loop SVG quadrant labels, theory breakdown, and technique cards',
    matchFile: true,
  },
  {
    filePattern: /BoardingPassCard\.tsx$/,
    linePattern:
      /identityStatement:|Tôi sẽ|để trở thành|Chưa chọn nhịp|Mỗi ngày \(cả tuần\)|lần một tuần|Mình vừa lên chuyến 28 ngày|Đều đặn một điều — mọi điều đều đặn|GIAI ĐOẠN 2|Chúng ta là kết quả của những hành động|Trạm Dừng Cảm Xúc|TUYÊN NGÔN VỀ THÓI QUEN|NHỊP ĐIỆU|THÓI QUEN HẠT NHÂN|MENTOR|BẠN ĐỒNG HÀNH|Theo kế hoạch cam kết|Chưa chọn ngày|Phiên bản dưới 2 phút|Thói quen neo đã vững|Người soi chiếu & cổ vũ|4 Quy luật đã chọn|1 · CUE · TÍN HIỆU|2 · CRAVING · KHAO KHÁT|3 · RESPONSE · PHẢN HỒI|4 · REWARD · PHẦN THƯỞNG|chưa chọn|Dừng lại • Lắng nghe • Sống trọn vẹn hơn|Lên chuyến · Bắt đầu 28 ngày|Đang lên chuyến|ngày/,
    reason:
      'Category 1 & 3: Boarding pass ticket layout, caption generation template, and card sections',
  },
  {
    filePattern: /Dashboard28Days\.tsx$/,
    linePattern:
      /TIẾN TRÌNH 28 NGÀY|Căn tính:|Thói quen hạt nhân:|Nhịp điệu:|Lá phiếu đã bỏ:|Chuỗi liên tiếp:|Đúng nhịp tới hôm nay:|Trạm hiện tại:|Đều đặn một điều|Điều gì đã diễn ra tốt trong trạm này|Nút thắt hoặc lực cản lớn nhất bạn gặp phải|Chặng tới bạn chỉnh quy tắc nào|Một lời ghi nhận cho chính mình|Khởi hành|Tạo đà|Vượt dốc|Về đích|Trạm \d+:|Trạm|range:\s*'Ngày|Tôi sẽ .* để trở thành|Sau khi .* lúc|Ngày \d+:|cảm xúc:|Dữ liệu hành trình của bạn được lưu an toàn|Đồng hành cùng Trạm Dừng|Nếu cần một Habit Coach|Đặt lịch với Habit Coach|Thấy công cụ này hữu ích|28 ngày thành|Bạn có chắc chắn muốn bắt đầu lại|Khôi phục thành công|Không thể tạo bản sao lưu|Không thể xuất file CSV/,
    reason:
      'Category 1 & 4: Dashboard coach summary clipboard format, station defaults, dynamic day counters, and fallback notes',
  },
  {
    filePattern: /DayCheckInModal\.tsx$/,
    linePattern: /Ngày \{dayItem\.dayNumber\}|· tới trạm|Thói quen hạt nhân/,
    reason: 'Category 4: Check-in modal day title interpolation',
  },
  {
    filePattern: /TimelineProgress\.tsx$/,
    linePattern:
      /Trạm \d+:|Đã hoàn thành \d+\/28 lá phiếu|Khởi hành|Tạo đà|Vượt dốc|Về đích|Bắt đầu|Về đích/,
    reason: 'Category 4: Timeline progress dynamic counter text and station step labels',
  },
]

const VIETNAMESE_CHAR_REGEX =
  /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i

function getFilesRecursively(dir: string): string[] {
  const result: string[] = []
  if (!fs.existsSync(dir)) return result

  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      result.push(...getFilesRecursively(fullPath))
    } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts'))) {
      result.push(fullPath)
    }
  }
  return result
}

describe('DP-02: No Unapproved Hardcoded Vietnamese Copy in Zip Components', () => {
  const scanDirs = [
    path.resolve(process.cwd(), 'src/components/habit/zip'),
    path.resolve(process.cwd(), 'src/components/eq/zip'),
  ]

  const allFiles = scanDirs.flatMap((d) => getFilesRecursively(d))

  it('scanned zip component files exist', () => {
    expect(allFiles.length).toBeGreaterThan(15)
  })

  it('all lines with Vietnamese characters match an explicit allowlist rule with justification', () => {
    const unapproved: Array<{ file: string; line: number; text: string }> = []

    for (const filePath of allFiles) {
      const normalizedPath = filePath.replace(/\\/g, '/')
      const content = fs.readFileSync(filePath, 'utf8')
      const lines = content.split('\n')

      lines.forEach((lineText, idx) => {
        const trimmed = lineText.trim()
        if (!trimmed) return

        // Skip plain single-line or multi-line comment markers
        if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
          return
        }

        if (VIETNAMESE_CHAR_REGEX.test(trimmed)) {
          // Check against allowlist rules
          const isAllowed = ALLOWLIST_RULES.some((rule) => {
            if (rule.filePattern && !rule.filePattern.test(normalizedPath)) {
              return false
            }
            if (rule.matchFile) {
              return true
            }
            return rule.linePattern ? rule.linePattern.test(trimmed) : false
          })

          if (!isAllowed) {
            unapproved.push({
              file: path.relative(process.cwd(), filePath),
              line: idx + 1,
              text: trimmed,
            })
          }
        }
      })
    }

    if (unapproved.length > 0) {
      const report = unapproved.map((u) => `${u.file}:${u.line} -> ${u.text}`).join('\n')
      expect.fail(
        `Found ${unapproved.length} unapproved lines with inline Vietnamese copy:\n${report}\n\nMove fixed UI text to vi.ts, CMS copy to global with defaults, or add to ALLOWLIST_RULES with clear justification.`,
      )
    }

    expect(unapproved).toEqual([])
  })
})
