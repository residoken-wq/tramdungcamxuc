import React from 'react'
import type { Config } from '@puckeditor/core'
import { HeroTwoEntries, type HeroTwoEntriesProps } from '@/components/site/HeroTwoEntries'
import { ImageText, type ImageTextProps } from '@/components/site/ImageText'
import { RichText, type RichTextProps } from '@/components/site/RichText'
import { SectionHeader, type SectionHeaderProps } from '@/components/ui/SectionHeader'
import { Button, type ButtonVariant, type ButtonSize } from '@/components/ui/Button'
import { safeHref } from '@/lib/safe-href'

export const SECTION_BG_COLOR_OPTIONS = [
  { label: 'Ngà ấm (Warm Ivory)', value: 'warm-ivory' },
  { label: 'Hồng phấn (Soft Pink)', value: 'soft-pink' },
  { label: 'Tím sương (Lavender Mist)', value: 'lavender-mist' },
  { label: 'Bạc hà (Mint Haze)', value: 'mint-haze' },
  { label: 'Kem bơ (Butter Cream)', value: 'butter-cream' },
  { label: 'Xanh thẫm (Deep Navy)', value: 'deep-navy' },
] as const

export const BRAND_COLOR_OPTIONS = SECTION_BG_COLOR_OPTIONS

export const PADDING_OPTIONS = [
  { label: 'Nhỏ (S - 24px)', value: 'sm' },
  { label: 'Vừa (M - 48px)', value: 'md' },
  { label: 'Lớn (L - 72px)', value: 'lg' },
] as const

export type CTAButtonBlockProps = {
  version?: number
  label: string
  href: string
  variant?: ButtonVariant
  size?: ButtonSize
  align?: 'left' | 'center' | 'right'
}

export type PageComponentsProps = {
  HeroTwoEntries: HeroTwoEntriesProps
  SectionHeader: SectionHeaderProps
  RichText: RichTextProps
  ImageText: ImageTextProps
  CTAButton: CTAButtonBlockProps
}

export const puckConfig: Config<PageComponentsProps> = {
  categories: {
    intro: {
      title: 'Mở đầu',
      components: ['HeroTwoEntries', 'SectionHeader'],
    },
    content: {
      title: 'Nội dung',
      components: ['RichText', 'ImageText'],
    },
    conversion: {
      title: 'Chuyển đổi',
      components: ['CTAButton'],
    },
  },
  root: {
    render: ({ children }) => (
      <div className="min-h-screen bg-warm-ivory font-sans text-deep-navy antialiased">
        {children}
      </div>
    ),
  },
  components: {
    HeroTwoEntries: {
      label: 'Hero 2 Lối vào (Cá nhân & Tổ chức)',
      fields: {
        seriesLabel: { type: 'text', label: 'Nhãn series (trên cùng)' },
        titleLine1: { type: 'text', label: 'Tiêu đề dòng 1 (Xanh thẫm / Deep Navy)' },
        titleLine2: { type: 'text', label: 'Tiêu đề dòng 2 (Hồng sen / Bright Magenta)' },
        emotionLine: { type: 'textarea', label: 'Dòng cảm xúc (Playfair Display Italic)' },
        entry1: {
          type: 'object',
          label: 'Lối vào 1 (Cá nhân)',
          objectFields: {
            label: { type: 'text', label: 'Nhãn lối vào' },
            description: { type: 'textarea', label: 'Mô tả ngắn' },
            buttonText: { type: 'text', label: 'Chữ trên nút' },
            buttonLink: { type: 'text', label: 'Đường dẫn liên kết' },
          },
        },
        entry2: {
          type: 'object',
          label: 'Lối vào 2 (Tổ chức / Doanh nghiệp)',
          objectFields: {
            label: { type: 'text', label: 'Nhãn lối vào' },
            description: { type: 'textarea', label: 'Mô tả ngắn' },
            buttonText: { type: 'text', label: 'Chữ trên nút' },
            buttonLink: { type: 'text', label: 'Đường dẫn liên kết' },
          },
        },
        bgColor: {
          type: 'select',
          label: 'Màu nền',
          options: [...BRAND_COLOR_OPTIONS],
        },
        padding: {
          type: 'select',
          label: 'Khoảng đệm (Padding)',
          options: [...PADDING_OPTIONS],
        },
      },
      defaultProps: {
        version: 1,
        seriesLabel: '[MẪU] Series nhãn',
        titleLine1: '[MẪU] DÒNG TIÊU ĐỀ 1',
        titleLine2: '[MẪU] DÒNG TIÊU ĐỀ 2',
        emotionLine: '[MẪU] Dòng cảm xúc trích dẫn ấm áp và chân thành',
        bgColor: 'warm-ivory',
        padding: 'md',
        entry1: {
          label: '[MẪU] Lối vào 1',
          description: '[MẪU] Mô tả ngắn gọn về lối vào dành cho cá nhân',
          buttonText: '[MẪU] Khám phá ngay',
          buttonLink: '#',
        },
        entry2: {
          label: '[MẪU] Lối vào 2',
          description: '[MẪU] Mô tả ngắn gọn về lối vào dành cho tổ chức',
          buttonText: '[MẪU] Tìm hiểu thêm',
          buttonLink: '#',
        },
      },
      render: (props) => <HeroTwoEntries {...props} />,
    },

    SectionHeader: {
      label: 'Tiêu đề mục (Hai tầng màu)',
      fields: {
        seriesLabel: { type: 'text', label: 'Nhãn series (trên cùng)' },
        titleLine1: { type: 'text', label: 'Tiêu đề dòng 1 (Xanh thẫm)' },
        titleLine2: { type: 'text', label: 'Tiêu đề dòng 2 (Hồng sen)' },
        emotionLine: { type: 'textarea', label: 'Dòng cảm xúc (Playfair Display)' },
        align: {
          type: 'select',
          label: 'Căn lề',
          options: [
            { label: 'Căn giữa', value: 'center' },
            { label: 'Căn trái', value: 'left' },
          ],
        },
        as: {
          type: 'select',
          label: 'Thẻ ngữ nghĩa (Heading Level)',
          options: [
            { label: 'H1 (Tiêu đề chính trang)', value: 'h1' },
            { label: 'H2 (Tiêu đề mục)', value: 'h2' },
            { label: 'H3 (Tiêu đề con)', value: 'h3' },
          ],
        },
      },
      defaultProps: {
        version: 1,
        seriesLabel: '[MẪU] Series',
        titleLine1: '[MẪU] TIÊU ĐỀ DÒNG 1',
        titleLine2: '[MẪU] TIÊU ĐỀ DÒNG 2',
        emotionLine: '[MẪU] Dòng cảm xúc trích dẫn nhẹ nhàng',
        align: 'center',
        as: 'h2',
      },
      render: ({ seriesLabel, titleLine1, titleLine2, emotionLine, align, as }) => (
        <div className="py-6 px-4">
          <div className="mx-auto max-w-5xl">
            <SectionHeader
              seriesLabel={seriesLabel}
              titleLine1={titleLine1}
              titleLine2={titleLine2}
              emotionLine={emotionLine}
              align={align}
              as={as}
            />
          </div>
        </div>
      ),
    },

    RichText: {
      label: 'Đoạn văn bản (Rich Text phân đoạn)',
      fields: {
        content: {
          type: 'textarea',
          label: 'Nội dung văn bản (các đoạn phân tách bằng 2 lần xuống dòng)',
        },
        bgColor: {
          type: 'select',
          label: 'Màu nền',
          options: [...BRAND_COLOR_OPTIONS],
        },
        padding: {
          type: 'select',
          label: 'Khoảng đệm (Padding)',
          options: [...PADDING_OPTIONS],
        },
      },
      defaultProps: {
        version: 1,
        content:
          '[MẪU] Đoạn văn bản thứ nhất chia sẻ những chiêm nghiệm sâu sắc.\n\n[MẪU] Đoạn văn bản thứ hai tiếp nối câu chuyện một cách tự nhiên và ấm áp.',
        bgColor: 'warm-ivory',
        padding: 'md',
      },
      render: (props) => <RichText {...props} />,
    },

    ImageText: {
      label: 'Ảnh & Chữ (Song hành)',
      fields: {
        layout: {
          type: 'select',
          label: 'Bố cục hiển thị',
          options: [
            { label: 'Ảnh bên trái, chữ bên phải', value: 'image-left' },
            { label: 'Ảnh bên phải, chữ bên trái', value: 'image-right' },
          ],
        },
        seriesLabel: { type: 'text', label: 'Nhãn series' },
        titleLine1: { type: 'text', label: 'Tiêu đề dòng 1' },
        titleLine2: { type: 'text', label: 'Tiêu đề dòng 2' },
        content: {
          type: 'textarea',
          label: 'Nội dung văn bản (các đoạn phân tách bằng 2 lần xuống dòng)',
        },
        mediaId: {
          type: 'external',
          label: 'Ảnh minh họa (Thư viện media)',
          placeholder: 'Chọn ảnh từ thư viện media...',
          showSearch: true,
          fetchList: async ({ query }) => {
            try {
              const searchParam = query ? `&where[alt][like]=${encodeURIComponent(query)}` : ''
              const res = await fetch(`/api/media?limit=50&depth=0${searchParam}`, {
                credentials: 'include',
              })
              if (!res.ok) return []
              const data = await res.json()
              const docs = (data.docs || []).filter(
                (doc: { alt?: string }) =>
                  doc.alt && typeof doc.alt === 'string' && doc.alt.trim().length > 0,
              )
              return docs
            } catch {
              return []
            }
          },
          mapProp: (item: { id?: string }) => item?.id || '',
          mapRow: (item: { url?: string; thumbnailURL?: string; alt?: string; filename?: string }) => ({
            'Hình ảnh': (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.url || item.thumbnailURL || ''}
                alt={item.alt || ''}
                style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 4 }}
              />
            ),
            'Mô tả (alt)': item.alt || '',
            'Tên file': item.filename || '',
          }),
          getItemSummary: (id: string) => (id ? `Media ID: ${id}` : 'Chưa chọn ảnh'),
        },
        buttonText: { type: 'text', label: 'Chữ trên nút (tùy chọn)' },
        buttonLink: { type: 'text', label: 'Đường dẫn liên kết (tùy chọn)' },
        bgColor: {
          type: 'select',
          label: 'Màu nền',
          options: [...BRAND_COLOR_OPTIONS],
        },
        padding: {
          type: 'select',
          label: 'Khoảng đệm (Padding)',
          options: [...PADDING_OPTIONS],
        },
      },
      defaultProps: {
        version: 1,
        layout: 'image-left',
        seriesLabel: '[MẪU] Câu chuyện',
        titleLine1: '[MẪU] DÒNG TIÊU ĐỀ 1',
        titleLine2: '[MẪU] DÒNG TIÊU ĐỀ 2',
        content:
          '[MẪU] Nội dung đoạn thứ nhất kể về hành trình và cảm xúc.\n\n[MẪU] Nội dung đoạn thứ hai làm rõ hơn giá trị mang lại.',
        mediaId: '',
        imageUrl: '',
        imageAlt: '',
        buttonText: '[MẪU] Đọc tiếp câu chuyện',
        buttonLink: '#',
        bgColor: 'warm-ivory',
        padding: 'md',
      },
      resolveData: async (data) => {
        const { mediaId } = data.props
        if (!mediaId) {
          return { props: { ...data.props, imageUrl: '', imageAlt: '' } }
        }

        try {
          if (typeof window !== 'undefined') {
            const res = await fetch(`/api/media/${encodeURIComponent(mediaId)}`, {
              credentials: 'include',
            })
            if (res.ok) {
              const json = await res.json()
              if (json && json.alt && typeof json.alt === 'string' && json.alt.trim().length > 0) {
                return {
                  props: {
                    ...data.props,
                    imageUrl: json.url || '',
                    imageAlt: json.alt.trim(),
                  },
                }
              }
            }
          }
        } catch {
          // If media resolution fails, preserve props without throwing
        }

        return { props: { ...data.props, imageUrl: '', imageAlt: '' } }
      },
      render: (props) => <ImageText {...props} />,
    },

    CTAButton: {
      label: 'Nút Kêu gọi hành động (CTA Button)',
      fields: {
        label: { type: 'text', label: 'Chữ hiển thị trên nút' },
        href: { type: 'text', label: 'Đường dẫn liên kết' },
        variant: {
          type: 'select',
          label: 'Kiểu dáng nút',
          options: [
            { label: 'Chính (Hồng nhấn - Primary)', value: 'primary' },
            { label: 'Phụ (Xanh thẫm - Secondary)', value: 'secondary' },
            { label: 'Viền mảnh (Ghost)', value: 'ghost' },
          ],
        },
        size: {
          type: 'select',
          label: 'Kích thước',
          options: [
            { label: 'Nhỏ (S - 44px)', value: 'sm' },
            { label: 'Vừa (M - 48px)', value: 'md' },
            { label: 'Lớn (L - 56px)', value: 'lg' },
          ],
        },
        align: {
          type: 'select',
          label: 'Căn lề',
          options: [
            { label: 'Căn giữa', value: 'center' },
            { label: 'Căn trái', value: 'left' },
            { label: 'Căn phải', value: 'right' },
          ],
        },
      },
      defaultProps: {
        version: 1,
        label: '[MẪU] Kêu gọi hành động',
        href: '#',
        variant: 'primary',
        size: 'md',
        align: 'center',
      },
      render: ({ label, href, variant = 'primary', size = 'md', align = 'center' }) => {
        const safeLink = safeHref(href)
        if (!safeLink || !label) {
          return <></>
        }

        const alignClasses = {
          left: 'justify-start',
          center: 'justify-center',
          right: 'justify-end',
        }[align]

        return (
          <div className="py-4 px-4">
            <div className={`mx-auto max-w-5xl flex ${alignClasses}`}>
              <Button href={safeLink} variant={variant} size={size}>
                {label}
              </Button>
            </div>
          </div>
        )
      },
    },
  },
}

export default puckConfig
