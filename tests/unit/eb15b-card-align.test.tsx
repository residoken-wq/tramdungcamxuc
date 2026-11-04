import React from 'react'
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { IconCard } from '@/components/site/IconCard'
import { IconCardGrid } from '@/components/site/IconCardGrid'
import { PackageCardItem } from '@/components/site/PackageCardItem'
import { PackageCards } from '@/components/site/PackageCards'
import { ServiceCardItem } from '@/components/site/ServiceCardItem'
import { ServiceCards } from '@/components/site/ServiceCards'
import { PathCard } from '@/components/site/PathCard'
import { TwoPathCards } from '@/components/site/TwoPathCards'
import { VisionCardItem } from '@/components/site/VisionCardItem'
import { VisionMission } from '@/components/site/VisionMission'
import { JourneyStep } from '@/components/site/JourneyStep'
import { JourneySteps } from '@/components/site/JourneySteps'
import { StatItem } from '@/components/site/StatItem'
import { HeroEntryCard } from '@/components/site/HeroEntryCard'
import { Callout } from '@/components/site/Callout'
import { CardBlock } from '@/puck/blocks/Card'
import { PackageCardBlock } from '@/puck/blocks/PackageCard'
import { ServiceCardBlock } from '@/puck/blocks/ServiceCard'
import { PathCardBlock } from '@/puck/blocks/PathCard'
import { VisionCardBlock } from '@/puck/blocks/VisionCard'
import { StepBlock } from '@/puck/blocks/Step'
import { StatBlock } from '@/puck/blocks/Stat'
import { EntryCardBlock } from '@/puck/blocks/EntryCard'
import { PC_TEXT_TARGETS } from '@/puck/style/text-targets/pc'
import { TEXT_TARGET_ATTR } from '@/puck/style/text-target'
import { CARD_ATTR } from '@/puck/style/css-shared'
import { blockStyleCss } from '@/puck/style/style-css'

describe('EB-15b: Card alignment and text targets', () => {
  describe('1. Decorative elements self-stretch and inline-flex/inline-block markup', () => {
    it('IconCard aligns icon properly with self-stretch row and inline-flex container', () => {
      const { container, rerender } = render(
        <IconCard id="c1" title="Tiêu đề thẻ" text="Mô tả thẻ" align="center" />,
      )
      const iconRow = container.querySelector('.self-stretch')
      expect(iconRow).not.toBeNull()
      expect(iconRow?.className).toContain('w-full')
      expect(iconRow?.className).toContain('self-stretch')

      // Check inner element is inline-flex
      const innerIcon = iconRow?.querySelector('.inline-flex')
      expect(innerIcon).not.toBeNull()

      // Card has alignment classes and responsive group-data
      const card = container.firstElementChild as HTMLElement
      expect(card.className).toContain('text-center')
      expect(card.className).toContain('group-data-[card-align=center]/grid:text-center')
      expect(card.className).toContain('group-data-[card-align=left]/grid:text-left')

      // Check textTarget attributes
      const titleEl = container.querySelector(`[${TEXT_TARGET_ATTR}="c1:title"]`)
      const textEl = container.querySelector(`[${TEXT_TARGET_ATTR}="c1:text"]`)
      expect(titleEl).not.toBeNull()
      expect(textEl).not.toBeNull()

      // When align="left", card defaults to text-left
      rerender(<IconCard id="c1" title="Tiêu đề thẻ" align="left" />)
      expect((container.firstElementChild as HTMLElement).className).toContain('text-left')
    })

    it('PackageCardItem markup wraps icon/counter in self-stretch row and has group-data alignment', () => {
      const { container } = render(
        <PackageCardItem
          id="pkg1"
          _resolved={{
            package: { id: 1, name: 'Gói CLEAR', shortDescription: 'Mô tả gói' } as never,
          }}
          align="center"
        />,
      )
      const card = container.firstElementChild as HTMLElement
      expect(card.className).toContain('group-data-[card-align=center]/grid:text-center')
      expect(card.className).toContain('group-data-[card-align=left]/grid:text-left')

      const iconRow = container.querySelector('.self-stretch')
      expect(iconRow).not.toBeNull()
      expect(iconRow?.className).toContain('w-full')
      expect(iconRow?.className).toContain('self-stretch')
    })

    it('ServiceCardItem has self-stretch on badge and CTA button', () => {
      const { container } = render(
        <ServiceCardItem
          id="srv1"
          _resolved={{
            service: { id: 1, name: 'Coaching 1:1', slug: 'coaching-1-1', badge: 'Mới' } as never,
          }}
          align="center"
        />,
      )
      const card = container.firstElementChild as HTMLElement
      expect(card.className).toContain('group-data-[card-align=center]/grid:text-center')

      const badgeRow = container.querySelector('.px-6.pt-6')
      expect(badgeRow?.className).toContain('self-stretch')
      expect(badgeRow?.querySelector('.inline-block')).not.toBeNull()

      const ctaRow = container.querySelector('.pt-0.w-full')
      expect(ctaRow?.className).toContain('self-stretch')
    })

    it('PathCard wraps groupLabel in inline-block and button in self-stretch', () => {
      const { container } = render(
        <PathCard
          id="path1"
          groupLabel="CÁ NHÂN"
          title="Lộ trình"
          description="Mô tả"
          buttonLabel="Khám phá"
        />,
      )
      const groupLabel = container.querySelector(`[${TEXT_TARGET_ATTR}="path1:groupLabel"]`)
      expect(groupLabel).not.toBeNull()
      expect(groupLabel?.className).toContain('inline-block')

      const buttonContainer = container.querySelector('.pt-2')
      expect(buttonContainer?.className).toContain('self-stretch')

      const titleEl = container.querySelector(`[${TEXT_TARGET_ATTR}="path1:title"]`)
      expect(titleEl).not.toBeNull()
    })

    it('VisionCardItem wraps icon in self-stretch and inline-flex container', () => {
      const { container } = render(
        <VisionCardItem id="vis1" title="Tầm nhìn" content="Nội dung" align="center" />,
      )
      const card = container.querySelector('.flex.flex-col')
      expect(card?.className).toContain('group-data-[card-align=center]/grid:text-center')

      const iconRow = container.querySelector('.self-stretch')
      expect(iconRow).not.toBeNull()
      expect(iconRow?.querySelector('.inline-flex')).not.toBeNull()

      const titleEl = container.querySelector(`[${TEXT_TARGET_ATTR}="vis1:title"]`)
      expect(titleEl).not.toBeNull()
    })

    it('JourneyStep wraps step number and badge in self-stretch row', () => {
      const { container } = render(
        <JourneyStep
          id="st1"
          name="Pause"
          subname="Dừng lại"
          description="Mô tả"
          align="center"
          variant="cards"
        />,
      )
      const topRow = container.querySelector('.self-stretch')
      expect(topRow).not.toBeNull()

      const nameEl = container.querySelector(`[${TEXT_TARGET_ATTR}="st1:name"]`)
      expect(nameEl).not.toBeNull()
      const subnameEl = container.querySelector(`[${TEXT_TARGET_ATTR}="st1:subname"]`)
      expect(subnameEl).not.toBeNull()
    })

    it('StatItem wraps icon in self-stretch and inline-flex container', () => {
      const { container } = render(
        <StatItem
          id="stat1"
          icon="star"
          label="Khách hàng"
          description="500+ khách"
          align="center"
        />,
      )
      const iconRow = container.querySelector('.self-stretch')
      expect(iconRow).not.toBeNull()
      expect(iconRow?.querySelector('.inline-flex')).not.toBeNull()

      const labelEl = container.querySelector(`[${TEXT_TARGET_ATTR}="stat1:label"]`)
      expect(labelEl).not.toBeNull()
    })

    it('HeroEntryCard wraps label in self-stretch row with inline-block and button in self-stretch', () => {
      const { container } = render(
        <HeroEntryCard
          id="entry1"
          label="Dành cho bạn"
          description="Mô tả"
          buttonText="Khám phá"
          buttonLink="#"
        />,
      )
      const labelRow = container.querySelector('.self-stretch')
      expect(labelRow).not.toBeNull()
      expect(labelRow?.querySelector('.inline-block')).not.toBeNull()

      const btnWrapper = container.querySelector(
        '.group-data-\\[entries-layout\\=rows\\]\\/entries\\:sm\\:w-auto',
      )
      expect(btnWrapper?.className).toContain('self-stretch')

      const labelEl = container.querySelector(`[${TEXT_TARGET_ATTR}="entry1:label"]`)
      expect(labelEl).not.toBeNull()
    })

    it('Callout wraps button in self-stretch container', () => {
      const { container } = render(
        <Callout
          id="call1"
          title="Khối điểm nhấn"
          description="Mô tả"
          buttonText="Đăng ký ngay"
          buttonLink="/lien-he"
        />,
      )
      const btnRow = container.querySelector('.mt-8')
      expect(btnRow?.className).toContain('self-stretch')
      expect(btnRow?.querySelector('.inline-block')).not.toBeNull()

      const titleEl = container.querySelector(`[${TEXT_TARGET_ATTR}="call1:title"]`)
      expect(titleEl).not.toBeNull()
    })
  })

  describe('2. Grid containers data-card-align attribute', () => {
    it('IconCardGrid sets data-card-align attribute correctly', () => {
      const { container, rerender } = render(
        <IconCardGrid id="grid1" titleLine1="Tiêu đề" cardAlign="center" />,
      )
      const grid = container.querySelector('[data-card-align="center"]')
      expect(grid).not.toBeNull()

      rerender(<IconCardGrid id="grid1" cardAlign="inherit" />)
      expect(container.querySelector('[data-card-align="inherit"]')).not.toBeNull()
    })

    it('PackageCards sets data-card-align attribute correctly', () => {
      const { container } = render(
        <PackageCards
          id="pkgGrid"
          titleLine1="Gói đồng hành"
          cardAlign="center"
          puck={{ isEditing: true }}
        />,
      )
      expect(container.querySelector('[data-card-align="center"]')).not.toBeNull()
    })

    it('ServiceCards sets data-card-align attribute correctly', () => {
      const { container } = render(
        <ServiceCards
          id="srvGrid"
          titleLine1="Dịch vụ"
          cardAlign="left"
          puck={{ isEditing: true }}
        />,
      )
      expect(container.querySelector('[data-card-align="left"]')).not.toBeNull()
    })

    it('TwoPathCards sets data-card-align attribute correctly', () => {
      const { container } = render(
        <TwoPathCards id="twoPaths" titleLine1="Hai lối đi" cardAlign="center" />,
      )
      expect(container.querySelector('[data-card-align="center"]')).not.toBeNull()
    })

    it('VisionMission sets data-card-align attribute correctly', () => {
      const { container } = render(
        <VisionMission id="vmGrid" titleLine1="Tầm nhìn" cardAlign="center" />,
      )
      expect(container.querySelector('[data-card-align="center"]')).not.toBeNull()
    })

    it('JourneySteps sets data-card-align attribute correctly', () => {
      const { container } = render(
        <JourneySteps id="jGrid" titleLine1="5 Bước" cardAlign="center" />,
      )
      expect(container.querySelector('[data-card-align="center"]')).not.toBeNull()
    })
  })

  describe('3. resolveFields shows "Đang theo khung" when parent grid cardAlign is set', () => {
    const parentGridCenter = { type: 'IconCardGrid', props: { cardAlign: 'center' } }
    const parentGridInherit = { type: 'IconCardGrid', props: { cardAlign: 'inherit' } }

    it('CardBlock updates align label when parent has cardAlign="center"', () => {
      if (typeof CardBlock.resolveFields === 'function') {
        const fieldsCenter = CardBlock.resolveFields(
          { props: { id: 'test', titleSize: 'md' } as never },
          { parent: parentGridCenter, fields: CardBlock.fields, changed: {} } as never,
        ) as unknown as { align: { label: string } }
        expect(fieldsCenter.align.label).toContain('Đang theo khung')

        const fieldsInherit = CardBlock.resolveFields(
          { props: { id: 'test', titleSize: 'md' } as never },
          { parent: parentGridInherit, fields: CardBlock.fields, changed: {} } as never,
        ) as unknown as { align: { label: string } }
        expect(fieldsInherit.align.label).not.toContain('Đang theo khung')
      }
    })

    it('PackageCardBlock updates align label when parent has cardAlign="center"', () => {
      if (typeof PackageCardBlock.resolveFields === 'function') {
        const fields = PackageCardBlock.resolveFields(
          { props: { id: 'test', nameSize: 'md' } as never },
          { parent: parentGridCenter, fields: PackageCardBlock.fields, changed: {} } as never,
        ) as unknown as { align: { label: string } }
        expect(fields.align.label).toContain('Đang theo khung')
      }
    })

    it('ServiceCardBlock updates align label when parent has cardAlign="center"', () => {
      if (typeof ServiceCardBlock.resolveFields === 'function') {
        const fields = ServiceCardBlock.resolveFields(
          { props: { id: 'test', nameSize: 'md' } as never },
          { parent: parentGridCenter, fields: ServiceCardBlock.fields, changed: {} } as never,
        ) as unknown as { align: { label: string } }
        expect(fields.align.label).toContain('Đang theo khung')
      }
    })

    it('PathCardBlock updates align label when parent has cardAlign="center"', () => {
      if (typeof PathCardBlock.resolveFields === 'function') {
        const fields = PathCardBlock.resolveFields(
          { props: { id: 'test', titleSize: 'md' } as never },
          { parent: parentGridCenter, fields: PathCardBlock.fields, changed: {} } as never,
        ) as unknown as { align: { label: string } }
        expect(fields.align.label).toContain('Đang theo khung')
      }
    })

    it('VisionCardBlock updates align label when parent has cardAlign="center"', () => {
      if (typeof VisionCardBlock.resolveFields === 'function') {
        const fields = VisionCardBlock.resolveFields(
          { props: { id: 'test', titleSize: 'md' } as never },
          { parent: parentGridCenter, fields: VisionCardBlock.fields, changed: {} } as never,
        ) as unknown as { align: { label: string } }
        expect(fields.align.label).toContain('Đang theo khung')
      }
    })

    it('StepBlock updates align label when parent has cardAlign="center"', () => {
      if (typeof StepBlock.resolveFields === 'function') {
        const fields = StepBlock.resolveFields({ props: { id: 'test', nameSize: 'md' } as never }, {
          parent: parentGridCenter,
          fields: StepBlock.fields,
          changed: {},
        } as never) as unknown as { align: { label: string } }
        expect(fields.align.label).toContain('Đang theo khung')
      }
    })

    it('StatBlock updates align label when parent has cardAlign="center"', () => {
      if (typeof StatBlock.resolveFields === 'function') {
        const fields = StatBlock.resolveFields(
          { props: { id: 'test', valueSize: 'md' } as never },
          { parent: parentGridCenter, fields: StatBlock.fields, changed: {} } as never,
        ) as unknown as { align: { label: string } }
        expect(fields.align.label).toContain('Đang theo khung')
      }
    })

    it('EntryCardBlock updates align label when parent has cardAlign="center"', () => {
      if (typeof EntryCardBlock.resolveFields === 'function') {
        const fields = EntryCardBlock.resolveFields(
          { props: { id: 'test', labelSize: 'md' } as never },
          { parent: parentGridCenter, fields: EntryCardBlock.fields, changed: {} } as never,
        ) as unknown as { align: { label: string } }
        expect(fields.align.label).toContain('Đang theo khung')
      }
    })
  })

  describe('4. PC_TEXT_TARGETS contract registry verification', () => {
    it('defines text target fields for all required card groups', () => {
      const keys = Object.keys(PC_TEXT_TARGETS)
      expect(keys).toContain('IconCardGrid')
      expect(keys).toContain('Card')
      expect(keys).toContain('PackageCards')
      expect(keys).toContain('ServiceCards')
      expect(keys).toContain('TwoPathCards')
      expect(keys).toContain('PathCard')
      expect(keys).toContain('VisionMission')
      expect(keys).toContain('VisionCard')
      expect(keys).toContain('JourneySteps')
      expect(keys).toContain('Step')
      expect(keys).toContain('Stat')
      expect(keys).toContain('EntryCard')
      expect(keys).toContain('Callout')

      expect(PC_TEXT_TARGETS.Card.map((t) => t.key)).toEqual(['title', 'text'])
      expect(PC_TEXT_TARGETS.Callout.map((t) => t.key)).toEqual([
        'title',
        'description',
        'buttonText',
      ])
    })
  })

  describe('5. EB-15bc: tab Kiểu "Căn chữ" reaches the cards', () => {
    it('every card root carries data-eb-card', () => {
      const cards: Array<[string, React.ReactElement]> = [
        ['IconCard', <IconCard key="a" id="c1" title="Thẻ" text="Mô tả" />],
        [
          'PackageCardItem',
          <PackageCardItem
            key="b"
            id="p1"
            _resolved={{ package: { id: 1, name: 'Gói', shortDescription: 'Mô tả' } as never }}
          />,
        ],
        [
          'ServiceCardItem',
          <ServiceCardItem
            key="c"
            id="s1"
            _resolved={{ service: { id: 1, name: 'Dịch vụ', slug: 'dv' } as never }}
          />,
        ],
        ['PathCard', <PathCard key="d" id="pa1" title="Lối đi" buttonLabel="Đi" />],
        ['VisionCardItem', <VisionCardItem key="e" id="v1" title="Tầm nhìn" content="Nội dung" />],
        ['JourneyStep', <JourneyStep key="f" id="st1" name="Pause" variant="cards" />],
        ['StatItem', <StatItem key="g" id="sa1" icon="star" label="Khách" />],
        ['HeroEntryCard', <HeroEntryCard key="h" id="en1" label="Cá nhân" description="Mô tả" />],
        ['Callout', <Callout key="i" id="ca1" title="Điểm nhấn" description="Mô tả" />],
      ]
      for (const [name, element] of cards) {
        const { container, unmount } = render(element)
        expect(container.querySelector(`[${CARD_ATTR}]`), name).not.toBeNull()
        unmount()
      }
    })

    it('Step marks its number + badge row so it can be centred', () => {
      const { container } = render(
        <JourneyStep id="st2" name="Pause" subname="Dừng lại" variant="cards" />,
      )
      expect(container.querySelector(`[${CARD_ATTR}-row]`)).not.toBeNull()
    })

    it('textAlign per device also aligns the cards inside, after the block rule', () => {
      const css = blockStyleCss('grid-1', { textAlign: { desktop: 'center', mobile: 'left' } })
      expect(css).toContain(
        '[data-eb-id="grid-1"] [data-eb-card]{text-align:center;align-items:center}',
      )
      expect(css).toContain('[data-eb-id="grid-1"] [data-eb-card-row]{justify-content:center')
      expect(css).toContain(
        '@media (max-width: 767px){[data-eb-id="grid-1"]{text-align:left}[data-eb-id="grid-1"] [data-eb-card]{text-align:left;align-items:flex-start}[data-eb-id="grid-1"] [data-eb-card-row]{justify-content:space-between}}',
      )
    })

    it('no card rule without textAlign', () => {
      expect(blockStyleCss('grid-2', { background: 'mint-haze' })).not.toContain(CARD_ATTR)
    })
  })
})
