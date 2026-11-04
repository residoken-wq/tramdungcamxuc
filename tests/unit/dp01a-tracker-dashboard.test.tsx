import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import {
  ALL_CHECKIN_EMOTIONS,
  CONFIDENCE_EMOTIONS,
  EMOTIONS,
  getEmotion,
} from '@/lib/emotions'

describe('DP-01 Khối 5: Tracker & Dashboard28Days', () => {
  it('enforces brand tokens in created zip tracker components', () => {
    const dir = path.join(process.cwd(), 'src/components/habit/zip')
    const files = [
      'Timeline/TimelineProgress.tsx',
      'Result/DayCheckInModal.tsx',
      'Result/Dashboard28Days.tsx',
    ]

    const forbiddenPatterns = [
      /(?<![\w-])text-navy(?![\w-])/,
      /(?<![\w-])bg-navy(?![\w-])/,
      /(?<![\w-])border-navy(?![\w-])/,
      /(?<![\w-])text-magenta(?![\w-])/,
      /(?<![\w-])bg-magenta(?![\w-])/,
      /(?<![\w-])border-magenta(?![\w-])/,
      /(?<![\w-])bg-lavender(?![\w-])/,
      /(?<![\w-])border-lavender(?![\w-])/,
      /(?<![\w-])bg-mint(?![\w-])/,
      /(?<![\w-])bg-butter(?![\w-])/,
      /(?<![\w-])bg-ivory(?![\w-])/,
      /(?<![\w-])text-slate-500(?![\w-])/,
    ]

    for (const relPath of files) {
      const fullPath = path.join(dir, relPath)
      expect(fs.existsSync(fullPath)).toBe(true)
      const content = fs.readFileSync(fullPath, 'utf8')

      for (const pattern of forbiddenPatterns) {
        const match = content.match(pattern)
        if (match) {
          throw new Error(
            `File ${relPath} contains forbidden token "${match[0]}" matching ${pattern}`,
          )
        }
      }
    }
  })

  it('preserves 10 legacy emotions and includes 5 confidence emotions for H5', () => {
    expect(EMOTIONS).toHaveLength(10)
    expect(CONFIDENCE_EMOTIONS).toHaveLength(5)
    expect(ALL_CHECKIN_EMOTIONS).toHaveLength(15)

    // Check 5 confidence moods from zip
    const moodLabels = CONFIDENCE_EMOTIONS.map((m) => m.label)
    expect(moodLabels).toEqual(['Tự ti', 'Chưa tự tin', 'Hơi tự tin', 'Rất tự tin', 'Tuyệt vời'])

    const moodEmojis = CONFIDENCE_EMOTIONS.map((m) => m.emoji)
    expect(moodEmojis).toEqual(['😫', '😣', '😊', '🥰', '😍'])

    // Verify getEmotion finds both legacy and confidence emotions
    expect(getEmotion('joyful')?.label).toBe('Vui vẻ')
    expect(getEmotion('insecure')?.label).toBe('Tự ti')
    expect(getEmotion('somewhat_confident')?.label).toBe('Hơi tự tin')
    expect(getEmotion('wonderful')?.label).toBe('Tuyệt vời')
  })

  it('does not contain donate modal or coffee buttons in zip components per H8', () => {
    const dashboardFile = path.join(
      process.cwd(),
      'src/components/habit/zip/Result/Dashboard28Days.tsx',
    )
    const content = fs.readFileSync(dashboardFile, 'utf8')

    expect(content).not.toContain('DonateModal')
    expect(content).not.toContain('Ủng hộ Trạm Dừng')
    expect(content).not.toContain('Mời một ly cà phê')
    expect(content).toContain('Đặt lịch với Habit Coach')
  })
})
