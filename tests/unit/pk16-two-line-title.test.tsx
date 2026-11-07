import React from 'react'
import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { TwoToneTitle } from '@/components/ui/TwoToneTitle'
import { TEXT_TARGET_ATTR } from '@/puck/style/text-target'

// 12 blocks
import { HeroTwoEntries } from '@/components/site/HeroTwoEntries'
import { HeroImage } from '@/components/site/HeroImage'
import { ImageText } from '@/components/site/ImageText'
import { CTASection } from '@/components/site/CTASection'
import { TwoPathCards } from '@/components/site/TwoPathCards'
import { VisionMission } from '@/components/site/VisionMission'
import { PackageCards } from '@/components/site/PackageCards'
import { JourneySteps } from '@/components/site/JourneySteps'
import { ServiceCards } from '@/components/site/ServiceCards'
import { FAQ } from '@/components/site/FAQ'
import { SolutionEcosystem } from '@/components/site/SolutionEcosystem'
import { ContactInfo } from '@/components/site/ContactInfo'

describe('PK-16: TwoToneTitle and Two-Line Headings', () => {
  describe('1. TwoToneTitle core component behavior', () => {
    it('renders both spans with class "block" and keeps a space in parent textContent', () => {
      const { container } = render(
        <h1>
          <TwoToneTitle line1="DÒNG 1" line2="DÒNG 2" />
        </h1>,
      )

      const h1 = container.querySelector('h1')
      expect(h1).not.toBeNull()
      expect(h1?.textContent).toBe('DÒNG 1 DÒNG 2')

      const spans = h1?.querySelectorAll('span')
      expect(spans?.length).toBe(2)
      expect(spans?.[0].classList.contains('block')).toBe(true)
      expect(spans?.[0].textContent).toBe('DÒNG 1')
      expect(spans?.[1].classList.contains('block')).toBe(true)
      expect(spans?.[1].textContent).toBe('DÒNG 2')
    })

    it('renders only 1 span when line2 is empty or undefined', () => {
      const { container: c1 } = render(
        <h1>
          <TwoToneTitle line1="DÒNG 1" line2="" />
        </h1>,
      )
      const spans1 = c1.querySelectorAll('h1 span')
      expect(spans1.length).toBe(1)
      expect(spans1[0].textContent).toBe('DÒNG 1')
      expect(spans1[0].classList.contains('block')).toBe(true)

      const { container: c2 } = render(
        <h1>
          <TwoToneTitle line1="DÒNG 1" />
        </h1>,
      )
      const spans2 = c2.querySelectorAll('h1 span')
      expect(spans2.length).toBe(1)
      expect(spans2[0].textContent).toBe('DÒNG 1')
    })

    it('attaches data-eb-text attributes of textTarget when id is provided', () => {
      const { container } = render(
        <h1>
          <TwoToneTitle id="test-block" line1="DÒNG 1" line2="DÒNG 2" />
        </h1>,
      )

      const spans = container.querySelectorAll('h1 span')
      expect(spans.length).toBe(2)
      expect(spans[0].getAttribute(TEXT_TARGET_ATTR)).toBe('test-block:titleLine1')
      expect(spans[1].getAttribute(TEXT_TARGET_ATTR)).toBe('test-block:titleLine2')
    })

    it('applies custom line1ClassName and line2ClassName alongside block', () => {
      const { container } = render(
        <h1>
          <TwoToneTitle
            line1="DÒNG 1"
            line2="DÒNG 2"
            line1ClassName="text-white"
            line2ClassName="text-soft-pink"
          />
        </h1>,
      )

      const spans = container.querySelectorAll('h1 span')
      expect(spans[0].className).toContain('block')
      expect(spans[0].className).toContain('text-white')
      expect(spans[1].className).toContain('block')
      expect(spans[1].className).toContain('text-soft-pink')
    })
  })

  describe('2. Renders each of the 12 blocks with titleLine1 and titleLine2', () => {
    const l1 = '[MẪU] DÒNG 1'
    const l2 = '[MẪU] DÒNG 2'
    const expectedName = `${l1} ${l2}`

    function checkHeading(container: HTMLElement) {
      const heading = container.querySelector('h1, h2, h3') as HTMLElement | null
      expect(heading).not.toBeNull()
      expect(heading?.textContent?.trim()).toBe(expectedName)

      // The span containing line 2 must have class 'block'
      const line2Span = Array.from(heading?.querySelectorAll('span') ?? []).find(
        (s) => s.textContent?.trim() === l2,
      )
      expect(line2Span).toBeDefined()
      expect(line2Span?.classList.contains('block')).toBe(true)

      // The span containing line 1 must also have class 'block'
      const line1Span = Array.from(heading?.querySelectorAll('span') ?? []).find(
        (s) => s.textContent?.trim() === l1,
      )
      expect(line1Span).toBeDefined()
      expect(line1Span?.classList.contains('block')).toBe(true)
    }

    it('1a. HeroTwoEntries - normal columns layout', () => {
      const { container } = render(
        <HeroTwoEntries titleLine1={l1} titleLine2={l2} entriesLayout="columns" />,
      )
      checkHeading(container)
    })

    it('1b. HeroTwoEntries - row layout', () => {
      const { container } = render(
        <HeroTwoEntries titleLine1={l1} titleLine2={l2} entriesLayout="rows" />,
      )
      checkHeading(container)
    })

    it('1c. HeroTwoEntries - backdrop layout', () => {
      const { container } = render(
        <HeroTwoEntries
          titleLine1={l1}
          titleLine2={l2}
          layout="backdrop"
          imageUrl="/brand/hero.png"
        />,
      )
      checkHeading(container)
    })

    it('2a. HeroImage - normal layout', () => {
      const { container } = render(<HeroImage titleLine1={l1} titleLine2={l2} layout="split" />)
      checkHeading(container)
    })

    it('2b. HeroImage - backdrop layout', () => {
      const { container } = render(
        <HeroImage titleLine1={l1} titleLine2={l2} layout="backdrop" imageUrl="/brand/hero.png" />,
      )
      checkHeading(container)
    })

    it('3. ImageText', () => {
      const { container } = render(
        <ImageText titleLine1={l1} titleLine2={l2} content="Nội dung mô tả" />,
      )
      checkHeading(container)
    })

    it('4. CTASection', () => {
      const { container } = render(<CTASection titleLine1={l1} titleLine2={l2} />)
      checkHeading(container)
    })

    it('5. TwoPathCards', () => {
      const { container } = render(<TwoPathCards titleLine1={l1} titleLine2={l2} />)
      checkHeading(container)
    })

    it('6. VisionMission', () => {
      const { container } = render(<VisionMission titleLine1={l1} titleLine2={l2} />)
      checkHeading(container)
    })

    it('7. PackageCards', () => {
      const { container } = render(<PackageCards titleLine1={l1} titleLine2={l2} cards={<div />} />)
      checkHeading(container)
    })

    it('8. JourneySteps', () => {
      const { container } = render(<JourneySteps titleLine1={l1} titleLine2={l2} />)
      checkHeading(container)
    })

    it('9. ServiceCards', () => {
      const { container } = render(<ServiceCards titleLine1={l1} titleLine2={l2} cards={<div />} />)
      checkHeading(container)
    })

    it('10. FAQ', () => {
      const { container } = render(
        <FAQ
          titleLine1={l1}
          titleLine2={l2}
          items={[{ question: 'Câu hỏi test', answer: 'Câu trả lời test' }]}
        />,
      )
      checkHeading(container)
    })

    it('11. SolutionEcosystem', () => {
      const { container } = render(
        <SolutionEcosystem
          titleLine1={l1}
          titleLine2={l2}
          _resolved={{
            products: [
              { id: 1, name: 'Sản phẩm mẫu', slug: 'sp-mau', type: 'digital_tool' } as never,
            ],
          }}
        />,
      )
      checkHeading(container)
    })

    it('12. ContactInfo', () => {
      const { container } = render(
        <ContactInfo
          titleLine1={l1}
          titleLine2={l2}
          _resolved={{ contact: { email: 'contact@example.com' } }}
        />,
      )
      checkHeading(container)
    })
  })
})
