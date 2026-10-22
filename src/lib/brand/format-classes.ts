import {
  TEXT_COLOR_OPTIONS,
  type FontSizeOption,
  type TextColorOption,
  type AlignOption,
} from '@/puck/constants'
import type { SectionHeadingLevel } from '@/components/ui/SectionHeader'

export type { FontSizeOption, TextColorOption, AlignOption }
export type BrandRole = 'title' | 'body' | 'quote' | 'card-title' | 'card-text'

/**
 * Xác định màu nền thật của thẻ dựa trên cấu hình parent (IconCardGrid).
 *
 * Quy tắc:
 * - Nền section deep-navy: mọi cardStyle đều có nền tính tương phản là deep-navy.
 * - Nền section pastel:
 *   + cardStyle 'soft' -> nền thẻ là soft-pink.
 *   + cardStyle 'outline' -> nền thẻ cùng màu với nền section.
 *   + cardStyle 'white' (hoặc mặc định) -> nền thẻ là white.
 * - Không có parent (đang kéo, hoặc khối ở ngoài) -> coi như warm-ivory.
 */
export function getCardRealBg(
  parent?: { type?: string; props?: Record<string, unknown> } | null,
): string {
  if (!parent || !parent.props) {
    return 'warm-ivory'
  }
  const parentBg = (parent.props.bgColor as string) || 'warm-ivory'
  if (parentBg === 'deep-navy') {
    return 'deep-navy'
  }
  const cardStyle = (parent.props.cardStyle as string) || 'white'
  if (cardStyle === 'soft') {
    return 'soft-pink'
  }
  if (cardStyle === 'outline') {
    return parentBg
  }
  return 'white'
}

/**
 * Danh sách màu chữ đạt chuẩn WCAG AA theo màu nền và kích thước chữ.
 *
 * Tiêu chuẩn WCAG AA:
 * - Chữ thường (< 24px hoặc < 18.66px đậm): tương phản >= 4.5:1
 * - Chữ lớn (>= 24px hoặc >= 18.66px đậm): tương phản >= 3.0:1
 *
 * Quy tắc Brand Book 2026:
 * - Nền pastel / warm-ivory / white: deep-navy luôn được (>= 12:1).
 *   bright-magenta được (>= 4.7:1), riêng trên lavender-mist (4.44:1) chỉ cho chữ lớn.
 *   accent-pink (3.07..3.50:1 trên pastel, 4.08:1 trên white) chỉ cho chữ lớn.
 * - Nền deep-navy: white (16.12:1), soft-pink (13.69:1).
 */
export function allowedTextColors(
  bg: string = 'warm-ivory',
  size: FontSizeOption | 'normal' | 'large' | boolean = 'md',
): Array<{ label: string; value: TextColorOption }> {
  const isLarge = size === 'lg' || size === 'large' || size === true

  if (bg === 'deep-navy') {
    return TEXT_COLOR_OPTIONS.filter((opt) => opt.value === 'white' || opt.value === 'soft-pink')
  }

  if (bg === 'lavender-mist') {
    if (isLarge) {
      return TEXT_COLOR_OPTIONS.filter(
        (opt) => opt.value === 'deep-navy' || opt.value === 'bright-magenta',
      )
    }
    return TEXT_COLOR_OPTIONS.filter((opt) => opt.value === 'deep-navy')
  }

  // warm-ivory, soft-pink, mint-haze, butter-cream, white (hoặc mặc định)
  if (isLarge) {
    return TEXT_COLOR_OPTIONS.filter(
      (opt) =>
        opt.value === 'deep-navy' || opt.value === 'bright-magenta' || opt.value === 'accent-pink',
    )
  }

  return TEXT_COLOR_OPTIONS.filter(
    (opt) => opt.value === 'deep-navy' || opt.value === 'bright-magenta',
  )
}

/**
 * Trả về class Tailwind chuỗi tĩnh cho màu chữ.
 * Chuỗi tĩnh giúp bộ quét Tailwind JIT và test kiểm tra tĩnh nhận diện chính xác.
 */
export function textColorClass(color: TextColorOption | string = 'deep-navy'): string {
  switch (color) {
    case 'deep-navy':
      return 'text-deep-navy'
    case 'bright-magenta':
      return 'text-bright-magenta'
    case 'accent-pink':
      return 'text-accent-pink'
    case 'white':
      return 'text-white'
    case 'soft-pink':
      return 'text-soft-pink'
    default:
      return 'text-deep-navy'
  }
}

/**
 * Trả về class Tailwind chuỗi tĩnh cho dòng cảm xúc.
 * deep-navy giữ text-deep-navy/85 đúng chuẩn Brand Book & snapshot ban đầu.
 */
export function emotionColorClass(color: TextColorOption | string = 'deep-navy'): string {
  switch (color) {
    case 'deep-navy':
      return 'text-deep-navy/85'
    case 'white':
      return 'text-white/90'
    case 'soft-pink':
      return 'text-soft-pink'
    case 'bright-magenta':
      return 'text-bright-magenta'
    case 'accent-pink':
      return 'text-accent-pink'
    default:
      return 'text-deep-navy/85'
  }
}

/**
 * Trả về class Tailwind chuỗi tĩnh cho kích thước chữ theo vai trò.
 *
 * - title: Anton, thang kích thước theo thẻ Heading level (h1 / h2 / h3):
 *   md giữ đúng cỡ hiện nay; sm lùi 1 bậc, lg tiến 1 bậc.
 * - body: Montserrat
 * - quote: Playfair Display Italic
 */
export function fontSizeClass(
  role: BrandRole,
  size: FontSizeOption = 'md',
  as: SectionHeadingLevel = 'h2',
): string {
  if (role === 'title') {
    if (as === 'h1') {
      switch (size) {
        case 'sm':
          return 'text-3xl sm:text-4xl lg:text-5xl'
        case 'lg':
          return 'text-5xl sm:text-6xl lg:text-7xl'
        case 'md':
        default:
          return 'text-4xl sm:text-5xl lg:text-6xl'
      }
    }

    if (as === 'h3') {
      switch (size) {
        case 'sm':
          return 'text-xl sm:text-2xl lg:text-3xl'
        case 'lg':
          return 'text-3xl sm:text-4xl lg:text-5xl'
        case 'md':
        default:
          return 'text-2xl sm:text-3xl lg:text-4xl'
      }
    }

    // Default: h2
    switch (size) {
      case 'sm':
        return 'text-2xl sm:text-3xl lg:text-4xl'
      case 'lg':
        return 'text-4xl sm:text-5xl lg:text-6xl'
      case 'md':
      default:
        return 'text-3xl sm:text-4xl lg:text-5xl'
    }
  }

  if (role === 'quote') {
    switch (size) {
      case 'sm':
        return 'text-base sm:text-lg'
      case 'lg':
        return 'text-xl sm:text-2xl'
      case 'md':
      default:
        return 'text-lg sm:text-xl'
    }
  }

  if (role === 'card-title') {
    switch (size) {
      case 'sm':
        return 'text-base sm:text-lg'
      case 'lg':
        return 'text-xl sm:text-2xl'
      case 'md':
      default:
        return 'text-lg sm:text-xl'
    }
  }

  if (role === 'card-text') {
    switch (size) {
      case 'sm':
        return 'text-xs sm:text-sm'
      case 'lg':
        return 'text-base sm:text-lg'
      case 'md':
      default:
        return 'text-sm sm:text-base'
    }
  }

  // body
  switch (size) {
    case 'sm':
      return 'text-sm sm:text-base'
    case 'lg':
      return 'text-lg sm:text-xl'
    case 'md':
    default:
      return 'text-base sm:text-lg'
  }
}
