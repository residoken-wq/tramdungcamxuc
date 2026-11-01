import React from 'react'
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ButtonWidgetBlock } from '@/puck/blocks/widgets/ButtonWidget'
import { HeadingWidgetBlock } from '@/puck/blocks/widgets/HeadingWidget'
import { IconListWidgetBlock } from '@/puck/blocks/widgets/IconListWidget'
import { IconWidgetBlock } from '@/puck/blocks/widgets/IconWidget'
import { ImageWidgetBlock } from '@/puck/blocks/widgets/ImageWidget'
import { TextWidgetBlock } from '@/puck/blocks/widgets/TextWidget'
import { HeadingWidget } from '@/components/site/widgets/HeadingWidget'
import { TextWidget } from '@/components/site/widgets/TextWidget'
import { ImageWidget } from '@/components/site/widgets/ImageWidget'
import { ButtonWidget } from '@/components/site/widgets/ButtonWidget'
import { IconWidget } from '@/components/site/widgets/IconWidget'
import { IconListWidget } from '@/components/site/widgets/IconListWidget'
import { puckConfig } from '@/puck/config'
import { getBlockIcon } from '@/puck/editor/block-icons'
import { filterBlockCategories } from '@/puck/editor/block-search'
import { fieldTab } from '@/puck/style/field-groups'

const WIDGET_BLOCKS = [
  { key: 'HeadingWidget', block: HeadingWidgetBlock, nameQuery: 'tieu de' },
  { key: 'TextWidget', block: TextWidgetBlock, nameQuery: 'van ban' },
  { key: 'ImageWidget', block: ImageWidgetBlock, nameQuery: 'anh' },
  { key: 'ButtonWidget', block: ButtonWidgetBlock, nameQuery: 'nut' },
  { key: 'IconWidget', block: IconWidgetBlock, nameQuery: 'bieu tuong' },
  { key: 'IconListWidget', block: IconListWidgetBlock, nameQuery: 'danh sach icon' },
] as const

describe('EB-06a: Basic Widgets Snapshots & Rendering', () => {
  it('renders HeadingWidget defaultProps matching snapshot', () => {
    const { container } = render(<HeadingWidget {...HeadingWidgetBlock.defaultProps} />)
    expect(container.innerHTML).toMatchSnapshot()
    expect(container.querySelector('h2')).not.toBeNull()
  })

  it('renders TextWidget defaultProps matching snapshot', () => {
    const { container } = render(<TextWidget {...TextWidgetBlock.defaultProps} />)
    expect(container.innerHTML).toMatchSnapshot()
    expect(container.textContent).toContain('Nhập đoạn văn bản của bạn tại đây')
  })

  it('renders ImageWidget in editor mode showing empty hint when no imageUrl', () => {
    const { container } = render(
      <ImageWidget {...ImageWidgetBlock.defaultProps} puck={{ isEditing: true }} />,
    )
    expect(container.querySelector('[data-eb-empty-image]')).not.toBeNull()
  })

  it('renders ImageWidget with imageUrl matching snapshot', () => {
    const { container } = render(
      <ImageWidget
        {...ImageWidgetBlock.defaultProps}
        imageUrl="https://images.unsplash.com/photo-test.jpg"
        imageAlt="Ảnh mẫu"
        caption="Chú thích ảnh"
      />,
    )
    expect(container.innerHTML).toMatchSnapshot()
    expect(container.querySelector('img')).not.toBeNull()
    expect(container.querySelector('figcaption')?.textContent).toBe('Chú thích ảnh')
  })

  it('renders ButtonWidget defaultProps matching snapshot', () => {
    const { container } = render(<ButtonWidget {...ButtonWidgetBlock.defaultProps} />)
    expect(container.innerHTML).toMatchSnapshot()
    expect(container.textContent).toContain('Bấm vào đây')
  })

  it('renders IconWidget defaultProps matching snapshot', () => {
    const { container } = render(<IconWidget {...IconWidgetBlock.defaultProps} />)
    expect(container.innerHTML).toMatchSnapshot()
    expect(container.querySelector('svg')).not.toBeNull()
  })

  it('renders IconListWidget defaultProps matching snapshot', () => {
    const { container } = render(<IconListWidget {...IconListWidgetBlock.defaultProps} />)
    expect(container.innerHTML).toMatchSnapshot()
    expect(container.querySelectorAll('li').length).toBe(3)
  })
})

describe('EB-06a: Widget Link Resolution & Security', () => {
  it('neutralizes javascript: in HeadingWidget', () => {
    const { container } = render(
      <HeadingWidget
        {...HeadingWidgetBlock.defaultProps}
        linkType="url"
        href="javascript:alert('xss')"
      />,
    )
    const anchor = container.querySelector('a')
    expect(anchor).toBeNull()
  })

  it('neutralizes data: in ButtonWidget', () => {
    const { container } = render(
      <ButtonWidget
        {...ButtonWidgetBlock.defaultProps}
        linkType="url"
        href="data:text/html,<script>alert(1)</script>"
      />,
    )
    const anchor = container.querySelector('a')
    expect(anchor).toBeNull()
  })

  it('renders external links with newTab having target="_blank" and rel="noopener noreferrer"', () => {
    const { container } = render(
      <ButtonWidget
        {...ButtonWidgetBlock.defaultProps}
        linkType="url"
        href="https://example.com"
        newTab={true}
      />,
    )
    const anchor = container.querySelector('a')
    expect(anchor).not.toBeNull()
    expect(anchor?.getAttribute('href')).toBe('https://example.com')
    expect(anchor?.getAttribute('target')).toBe('_blank')
    expect(anchor?.getAttribute('rel')).toBe('noopener noreferrer')
  })

  it('renders internal page links with resolved pageSlug', () => {
    const { container } = render(
      <HeadingWidget
        {...HeadingWidgetBlock.defaultProps}
        linkType="page"
        pageId="42"
        _resolved={{ pageSlug: 'gioi-thieu' }}
      />,
    )
    const anchor = container.querySelector('a')
    expect(anchor).not.toBeNull()
    expect(anchor?.getAttribute('href')).toBe('/gioi-thieu')
  })

  it('renders IconWidget accessibility aria-label when linked and aria-hidden when not linked', () => {
    const { container: linkedContainer } = render(
      <IconWidget
        {...IconWidgetBlock.defaultProps}
        linkType="url"
        href="https://example.com"
        ariaLabel="Biểu tượng ngôi sao"
      />,
    )
    const anchor = linkedContainer.querySelector('a')
    expect(anchor).not.toBeNull()
    expect(anchor?.getAttribute('aria-label')).toBe('Biểu tượng ngôi sao')

    const { container: unlinkedContainer } = render(
      <IconWidget {...IconWidgetBlock.defaultProps} linkType="none" />,
    )
    expect(unlinkedContainer.querySelector('a')).toBeNull()
    expect(unlinkedContainer.querySelector('[aria-hidden="true"]')).not.toBeNull()
  })
})

describe('EB-06a: Metadata, Searchability & Icons', () => {
  it('every widget has version 1 in defaultProps', () => {
    for (const { key, block } of WIDGET_BLOCKS) {
      expect(block.defaultProps?.version, `${key} must have version: 1`).toBe(1)
    }
  })

  it('every widget has a dedicated SVG icon in blockIconMap', () => {
    for (const { key } of WIDGET_BLOCKS) {
      const icon = getBlockIcon(key)
      expect(React.isValidElement(icon), `${key} must return a valid React icon`).toBe(true)
    }
  })

  it('every widget is searchable by non-accented Vietnamese query', () => {
    const categories = puckConfig.categories || {}
    const labels = Object.fromEntries(
      Object.entries(puckConfig.components).map(([k, c]) => [k, c.label || k]),
    )

    for (const { key, nameQuery } of WIDGET_BLOCKS) {
      const filtered = filterBlockCategories(categories, labels, nameQuery)
      const foundInComponents = filtered.some((cat) => cat.components.includes(key))
      expect(foundInComponents, `${key} should match query "${nameQuery}"`).toBe(true)
    }
  })
})

describe('EB-06a: Field Tab Sorting (fieldTab)', () => {
  it('sorts HeadingWidget fields to Content tab', () => {
    const fields = Object.keys(HeadingWidgetBlock.fields || {})
    for (const field of fields) {
      expect(fieldTab(field), `Field ${field} of HeadingWidget`).toBe('content')
    }
  })

  it('sorts TextWidget fields to Content tab', () => {
    const fields = Object.keys(TextWidgetBlock.fields || {})
    for (const field of fields) {
      expect(fieldTab(field), `Field ${field} of TextWidget`).toBe('content')
    }
  })

  it('sorts ImageWidget content fields to Content tab and imageSize to Style tab', () => {
    expect(fieldTab('mediaId')).toBe('content')
    expect(fieldTab('caption')).toBe('content')
    expect(fieldTab('linkType')).toBe('content')
    expect(fieldTab('pageId')).toBe('content')
    expect(fieldTab('href')).toBe('content')
    expect(fieldTab('newTab')).toBe('content')
    expect(fieldTab('imageSize')).toBe('style')
  })

  it('sorts ButtonWidget content fields to Content tab and format fields to Style tab', () => {
    expect(fieldTab('text')).toBe('content')
    expect(fieldTab('linkType')).toBe('content')
    expect(fieldTab('pageId')).toBe('content')
    expect(fieldTab('href')).toBe('content')
    expect(fieldTab('newTab')).toBe('content')
    expect(fieldTab('icon')).toBe('content')
    expect(fieldTab('iconPosition')).toBe('content')

    expect(fieldTab('variant')).toBe('style')
    expect(fieldTab('buttonSize')).toBe('style')
    expect(fieldTab('align')).toBe('style')
  })

  it('sorts IconWidget content fields to Content tab and styling fields to Style tab', () => {
    expect(fieldTab('icon')).toBe('content')
    expect(fieldTab('linkType')).toBe('content')
    expect(fieldTab('pageId')).toBe('content')
    expect(fieldTab('href')).toBe('content')
    expect(fieldTab('newTab')).toBe('content')
    expect(fieldTab('ariaLabel')).toBe('content')

    expect(fieldTab('iconColor')).toBe('style')
    expect(fieldTab('iconSize')).toBe('style')
    expect(fieldTab('iconStyle')).toBe('style')
  })

  it('sorts IconListWidget items and layout to Content tab and iconColor to Style tab', () => {
    expect(fieldTab('layout')).toBe('content')
    expect(fieldTab('defaultIcon')).toBe('content')
    expect(fieldTab('items')).toBe('content')

    expect(fieldTab('iconColor')).toBe('style')
  })
})
