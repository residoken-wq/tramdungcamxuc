import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Render } from '@puckeditor/core'
import { puckConfig } from '@/puck/config'

// New components
import { StoryLead } from '@/components/site/StoryLead'
import { ContextProfile } from '@/components/site/ContextProfile'
import { PillarCardGrid } from '@/components/site/PillarCardGrid'
import { ProgramWishes } from '@/components/site/ProgramWishes'
import { PhaseArchitecture } from '@/components/site/PhaseArchitecture'
import { ProgramOverview } from '@/components/site/ProgramOverview'
import { JourneyMilestones } from '@/components/site/JourneyMilestones'
import { ProgramStepFlow } from '@/components/site/ProgramStepFlow'
import { BrandFormula } from '@/components/site/BrandFormula'
import { NumberedStepsStrip } from '@/components/site/NumberedStepsStrip'

// Enhanced components
import { HeroImage } from '@/components/site/HeroImage'
import { LoopDiagram } from '@/components/site/LoopDiagram'
import { IconCardGrid } from '@/components/site/IconCardGrid'
import { MatrixTable } from '@/components/site/MatrixTable'

import { journeyTemplate } from '@/puck/templates/journey'

describe('PK-28: Chuyển mình không chênh vênh 100% precision', () => {
  describe('1. New Components Unit Tests', () => {
    it('StoryLead renders seriesLabel, title, emotionLine, content and accent bar', () => {
      const { container } = render(
        <StoryLead
          seriesLabel="01 · CÂU CHUYỆN KHÔNG CỦA RIÊNG AI"
          titleLine1="Chuyển mình là hành trình khó khăn"
          titleLine2="cần đi qua"
          emotionLine="KHÔNG CHÊNH VÊNH"
          content="Nội dung câu chuyện mở đầu đầy đủ."
          bgColor="lavender-mist"
        />,
      )
      expect(screen.getByText('01 · CÂU CHUYỆN KHÔNG CỦA RIÊNG AI')).toBeDefined()
      expect(screen.getByText('Chuyển mình là hành trình khó khăn')).toBeDefined()
      expect(screen.getByText('cần đi qua')).toBeDefined()
      expect(screen.getByText('KHÔNG CHÊNH VÊNH')).toBeDefined()
      expect(screen.getByText('Nội dung câu chuyện mở đầu đầy đủ.')).toBeDefined()
      expect(container.querySelector('.bg-lavender-mist')).toBeDefined()
      expect(container.querySelector('.bg-accent-pink')).toBeDefined()
    })

    it('ContextProfile renders stats with bold text, profile card, quote, and source', () => {
      render(
        <ContextProfile
          seriesLabel="02 · BỐI CẢNH"
          title="Bối cảnh chuyển mình"
          showAccentBar={true}
          statCards={[
            { stat: '39%', text: 'kỹ năng **thay đổi**' },
            { stat: '3X', text: 'nguy cơ cao hơn' },
          ]}
          italicQuoteLeft="Luật chơi đang đổi"
          profileCard={{
            eyebrow: 'CÔ ẤY LÀ AI',
            quote: '“Mình có năng lực”',
            items: ['30–45 tuổi', 'Quản lý tầm trung'],
          }}
          sourceNote="Nguồn: WEF 2025"
        />,
      )
      expect(screen.getByText('02 · BỐI CẢNH')).toBeDefined()
      expect(screen.getByText('Bối cảnh chuyển mình')).toBeDefined()
      expect(screen.getByText('39%')).toBeDefined()
      expect(screen.getByText('thay đổi')).toBeDefined()
      expect(screen.getByText('Luật chơi đang đổi')).toBeDefined()
      expect(screen.getByText('CÔ ẤY LÀ AI')).toBeDefined()
      expect(screen.getByText('“Mình có năng lực”')).toBeDefined()
      expect(screen.getByText('30–45 tuổi')).toBeDefined()
      expect(screen.getByText('Nguồn: WEF 2025')).toBeDefined()
    })

    it('PillarCardGrid renders 3 tone cards with sub-items and bottom quote', () => {
      render(
        <PillarCardGrid
          seriesLabel="03 · NỖI ĐAU"
          title="Ba nỗi đau lớn"
          showAccentBar={true}
          cards={[
            {
              tone: 'butter-cream',
              label: '01 · HÀNH ĐỘNG',
              hasAccentBar: true,
              items: [{ title: 'Trì hoãn', text: 'Mở ra là chùn bước' }],
            },
            {
              tone: 'soft-pink',
              label: '02 · CẢM XÚC',
              hasAccentBar: true,
              items: [{ title: 'Cạn kiệt', text: 'Ngày nào cũng mệt' }],
            },
            {
              tone: 'mint-haze',
              label: '03 · GIAO TIẾP',
              hasAccentBar: true,
              items: [{ title: 'Ngại nói', text: 'Im lặng trong họp' }],
            },
          ]}
          bottomQuote="Gốc rễ không nằm ở năng lực"
        />,
      )
      expect(screen.getByText('03 · NỖI ĐAU')).toBeDefined()
      expect(screen.getByText('Ba nỗi đau lớn')).toBeDefined()
      expect(screen.getByText('01 · HÀNH ĐỘNG')).toBeDefined()
      expect(screen.getByText('Trì hoãn')).toBeDefined()
      expect(screen.getByText('Mở ra là chùn bước')).toBeDefined()
      expect(screen.getByText('02 · CẢM XÚC')).toBeDefined()
      expect(screen.getByText('03 · GIAO TIẾP')).toBeDefined()
      expect(screen.getByText('Gốc rễ không nằm ở năng lực')).toBeDefined()
    })

    it('ProgramWishes renders 4 wish cards including deep-navy and callout strip', () => {
      const { container } = render(
        <ProgramWishes
          seriesLabel="04 · MONG MUỐN"
          title="Điều tìm kiếm"
          topQuote="Không phải một khóa học"
          cards={[
            { tone: 'butter-cream', label: '01', title: 'Hành động nhỏ', text: 'Bền bỉ' },
            { tone: 'soft-pink', label: '02', title: 'Nội tâm', text: 'Vững vàng' },
            { tone: 'mint-haze', label: '03', title: 'Giao tiếp', text: 'Ảnh hưởng' },
            { tone: 'deep-navy', label: 'PHASE 2', title: 'Sự nghiệp', text: 'Thông suốt' },
          ]}
          calloutTitle="ĐIỂM CHẠM:"
          calloutText="Phase 1 xây nền vững"
        />,
      )
      expect(screen.getByText('04 · MONG MUỐN')).toBeDefined()
      expect(screen.getByText('Không phải một khóa học')).toBeDefined()
      expect(screen.getByText('Hành động nhỏ')).toBeDefined()
      expect(screen.getByText('Thông suốt')).toBeDefined()
      expect(screen.getByText('ĐIỂM CHẠM:')).toBeDefined()
      expect(screen.getByText('Phase 1 xây nền vững')).toBeDefined()
      expect(container.querySelector('.bg-deep-navy')).toBeDefined()
    })

    it('PhaseArchitecture renders phase 1 colored strips and phase 2 navy card', () => {
      const { container } = render(
        <PhaseArchitecture
          seriesLabel="05 · KIẾN TRÚC"
          title="Hai giai đoạn"
          phase1Label="PHASE 1"
          phase1Title="Nền tảng"
          phase1Items={[
            { tone: 'butter-cream', title: 'Thói quen', text: 'Bền bỉ' },
            { tone: 'soft-pink', title: 'Cảm xúc', text: 'Vững vàng' },
            { tone: 'mint-haze', title: 'Giao tiếp', text: 'Hài hòa' },
          ]}
          phase2Label="PHASE 2"
          phase2Title="Career Clarity"
          phase2Subtitle="Thông suốt"
          phase2Text="Khai vấn 1:1"
          phase2Chip="Khai vấn chuyên sâu"
          noteBoxLabel="LƯU Ý"
          noteBoxText="Phase 1 tiên quyết"
        />,
      )
      expect(screen.getByText('05 · KIẾN TRÚC')).toBeDefined()
      expect(screen.getByText('PHASE 1')).toBeDefined()
      expect(screen.getByText('Thói quen')).toBeDefined()
      expect(screen.getByText('PHASE 2')).toBeDefined()
      expect(screen.getByText('Career Clarity')).toBeDefined()
      expect(screen.getByText('Khai vấn chuyên sâu')).toBeDefined()
      expect(screen.getByText('Phase 1 tiên quyết')).toBeDefined()
      // Phase 2 navy block
      expect(container.querySelector('.bg-deep-navy')).toBeDefined()
    })

    it('ProgramOverview renders top strip, 3 pillar cards, middle and bottom strips', () => {
      render(
        <ProgramOverview
          seriesLabel="08 · TỔNG THỂ"
          title="Mô hình tổng thể"
          topStripLabel="KHUNG NỀN TẢNG"
          topStripText="3 năng lực lõi"
          pillars={[
            {
              tone: 'butter-cream',
              pillarNumber: '01',
              title: 'HÀNH ĐỘNG',
              subtitleItalic: 'Bền bỉ',
              stepsText: 'BƯỚC 1 · BƯỚC 2',
            },
            {
              tone: 'soft-pink',
              pillarNumber: '02',
              title: 'CẢM XÚC',
              subtitleItalic: 'Vững chãi',
              stepsText: 'BƯỚC 1 · BƯỚC 2',
            },
            {
              tone: 'mint-haze',
              pillarNumber: '03',
              title: 'GIAO TIẾP',
              subtitleItalic: 'Hài hòa',
              stepsText: 'BƯỚC 1 · BƯỚC 2',
            },
          ]}
          middleStripLabel="SỢI CHỈ"
          middleStripText="4 buổi Reflection"
          bottomStripLabel="ĐÍCH ĐẾN"
          bottomStripText="Nền tảng vững"
        />,
      )
      expect(screen.getByText('08 · TỔNG THỂ')).toBeDefined()
      expect(screen.getByText('KHUNG NỀN TẢNG')).toBeDefined()
      expect(screen.getByText('HÀNH ĐỘNG')).toBeDefined()
      expect(screen.getByText('CẢM XÚC')).toBeDefined()
      expect(screen.getByText('GIAO TIẾP')).toBeDefined()
      expect(screen.getByText('4 buổi Reflection')).toBeDefined()
      expect(screen.getByText('Nền tảng vững')).toBeDefined()
    })

    it('JourneyMilestones renders big stat numbers and 2 group cards', () => {
      render(
        <JourneyMilestones
          seriesLabel="09 · TRIỂN KHAI"
          title="Hành trình chuyển hóa"
          topStats={[
            { number: '2', title: 'TUẦN CHUẨN BỊ', description: 'Làm quen' },
            { number: '28', title: 'NGÀY THỰC HÀNH', description: 'Đồng hành' },
            { number: '4', title: 'BUỔI REFLECTION', description: 'Nhìn lại' },
          ]}
          group1Title="TRƯỚC NGÀY 1"
          group1Cards={[{ title: 'Workshop định hướng', subtitle: 'Bản đồ', tone: 'lavender-mist' }]}
          group2Title="28 NGÀY THỰC HÀNH"
          group2Cards={[{ title: 'Check-in mỗi ngày', subtitle: 'Ghi nhận', tone: 'white' }]}
        />,
      )
      expect(screen.getByText('09 · TRIỂN KHAI')).toBeDefined()
      expect(screen.getByText('2')).toBeDefined()
      expect(screen.getByText('TUẦN CHUẨN BỊ')).toBeDefined()
      expect(screen.getByText('28')).toBeDefined()
      expect(screen.getByText('4')).toBeDefined()
      expect(screen.getByText('TRƯỚC NGÀY 1')).toBeDefined()
      expect(screen.getByText('Workshop định hướng')).toBeDefined()
      expect(screen.getByText('28 NGÀY THỰC HÀNH')).toBeDefined()
      expect(screen.getByText('Check-in mỗi ngày')).toBeDefined()
    })

    it('ProgramStepFlow renders steps with takeaway card, subColumns, and bottom strips', () => {
      render(
        <ProgramStepFlow
          seriesLabel="CHƯƠNG TRÌNH 03 · COMMUNICATION"
          title="Giao tiếp hài hòa"
          emotionLine="Sức mạnh thấu cảm"
          takeawayTone="mint-haze"
          steps={[
            {
              eyebrow: 'BƯỚC 1',
              title: 'Cân bằng hai năng lượng',
              chip: 'Workshop 1',
              subColumns: {
                left: { title: 'NAM TÍNH', items: ['Rõ ràng', 'Quyết đoán'] },
                right: { title: 'NỮ TÍNH', items: ['Lắng nghe', 'Đồng cảm'] },
              },
              takeawayTitle: 'MANG VỀ',
              takeawayText: 'Bản đồ thiên hướng',
            },
            {
              eyebrow: 'BƯỚC 2',
              title: 'Ứng dụng',
              bullets: ['Từ chối', 'Đàm phán'],
              takeawayText: '5 kịch bản',
            },
          ]}
          bottomStripLeftLabel="SỐNG CÙNG GIAO TIẾP"
          bottomStripLeftText="Thực hành lên tiếng"
          bottomStripRightText="Rõ ràng mà không thô bạo"
        />,
      )
      expect(screen.getByText('CHƯƠNG TRÌNH 03 · COMMUNICATION')).toBeDefined()
      expect(screen.getByText('Giao tiếp hài hòa')).toBeDefined()
      expect(screen.getByText('BƯỚC 1')).toBeDefined()
      expect(screen.getByText('NAM TÍNH')).toBeDefined()
      expect(screen.getByText('NỮ TÍNH')).toBeDefined()
      expect(screen.getByText('Bản đồ thiên hướng')).toBeDefined()
      expect(screen.getByText('SỐNG CÙNG GIAO TIẾP')).toBeDefined()
      expect(screen.getByText('Thực hành lên tiếng')).toBeDefined()
      expect(screen.getByText('Rõ ràng mà không thô bạo')).toBeDefined()
    })

    it('BrandFormula renders formula steps and habit plan card', () => {
      render(
        <BrandFormula
          seriesLabel="CHƯƠNG TRÌNH 01"
          title="Công thức chuyển hóa"
          steps={[
            { number: '1', title: 'NHẤT QUÁN', description: 'Lặp lại nhỏ' },
            { number: '2', title: 'BẰNG CHỨNG', description: 'Dữ liệu thật' },
            { number: '3', title: 'LAN TỎA', description: 'Chia sẻ' },
          ]}
          bottomQuoteLeft="Thương hiệu là kết quả nội tại"
          planCardEyebrow="HABIT PLAN MINH HỌA"
          planCardSubtitle="Dành cho người bận rộn"
          planCardQuote="“Tôi xuất hiện mỗi ngày”"
          planItem1Title="HÀNH ĐỘNG VI MÔ"
          planItem1Text="Viết 3 dòng đúc kết"
        />,
      )
      expect(screen.getByText('CHƯƠNG TRÌNH 01')).toBeDefined()
      expect(screen.getByText('Công thức chuyển hóa')).toBeDefined()
      expect(screen.getByText('NHẤT QUÁN')).toBeDefined()
      expect(screen.getByText('BẰNG CHỨNG')).toBeDefined()
      expect(screen.getByText('LAN TỎA')).toBeDefined()
      expect(screen.getByText('Thương hiệu là kết quả nội tại')).toBeDefined()
      expect(screen.getByText('HABIT PLAN MINH HỌA')).toBeDefined()
      expect(screen.getByText('“Tôi xuất hiện mỗi ngày”')).toBeDefined()
      expect(screen.getByText('Viết 3 dòng đúc kết')).toBeDefined()
    })

    it('NumberedStepsStrip renders 5 numbered cards, output strip, and subLines', () => {
      render(
        <NumberedStepsStrip
          seriesLabel="CHƯƠNG TRÌNH 02"
          title="Năm bước điều hòa"
          steps={[
            { number: '01', title: 'PAUSE', text: 'Dừng lại' },
            {
              number: '02',
              title: 'FEEL',
              subLines: [{ label: 'Nam tính', text: 'Nhận diện' }],
            },
          ]}
          outputStripLabel="ĐẦU RA"
          outputStripText="Phản ứng điềm tĩnh"
          bottomQuote="Khoảng trống tự do"
        />,
      )
      expect(screen.getByText('CHƯƠNG TRÌNH 02')).toBeDefined()
      expect(screen.getByText('Năm bước điều hòa')).toBeDefined()
      expect(screen.getByText('01')).toBeDefined()
      expect(screen.getByText('PAUSE')).toBeDefined()
      expect(screen.getByText('02')).toBeDefined()
      expect(screen.getByText('FEEL')).toBeDefined()
      expect(screen.getByText('Nam tính')).toBeDefined()
      expect(screen.getByText('ĐẦU RA')).toBeDefined()
      expect(screen.getByText('Phản ứng điềm tĩnh')).toBeDefined()
      expect(screen.getByText('Khoảng trống tự do')).toBeDefined()
    })
  })

  describe('2. Enhanced Existing Components Tests', () => {
    it('HeroImage renders titleCase: none, showAccentBar, and ArchGraphic SVG illustration', () => {
      const { container } = render(
        <HeroImage
          id="hero-test"
          titleLine1="Chuyển mình"
          titleLine2="không chênh vênh"
          titleCase="none"
          showAccentBar={true}
          showArchGraphic={true}
          bgColor="deep-navy"
        />,
      )
      const h1 = container.querySelector('h1')
      expect(h1).toBeDefined()
      expect(h1?.className).not.toContain('uppercase')
      // Accent bar rendered
      expect(container.querySelector('.bg-accent-pink')).toBeDefined()
      // Arch graphic SVG rendered
      expect(container.querySelector('svg circle')).toBeDefined()
    })

    it('LoopDiagram renders 2-column layout with rightTitle, pills, and bottomQuote', () => {
      render(
        <LoopDiagram
          titleLine1="Vòng lặp chuyển hóa"
          titleCase="none"
          showAccentBar={true}
          nodes={[{ label: '01 · NHẬN DIỆN' }]}
          rightTitle="3 TẦNG TRẢI NGHIỆM"
          rightItems={[
            { pill: 'Workshop', pillStyle: 'solid', text: 'Hiểu nguyên lý' },
            { pill: '28 ngày', pillStyle: 'outline', text: 'Thực hành' },
          ]}
          bottomQuote="Chu trình khép kín"
        />,
      )
      expect(screen.getByText('Vòng lặp chuyển hóa')).toBeDefined()
      expect(screen.getAllByText('01 · NHẬN DIỆN').length).toBeGreaterThan(0)
      expect(screen.getByText('3 TẦNG TRẢI NGHIỆM')).toBeDefined()
      expect(screen.getByText('Workshop')).toBeDefined()
      expect(screen.getByText('28 ngày')).toBeDefined()
      expect(screen.getByText('Chu trình khép kín')).toBeDefined()
    })

    it('MatrixTable renders titleCase: none, showAccentBar, and footerNote in list variant', () => {
      render(
        <MatrixTable
          variant="list"
          titleLine1="Reflection giữ thay đổi"
          titleCase="none"
          showAccentBar={true}
          chips={[{ label: 'Ngày 7' }]}
          rows={[{ label: 'NHÌN LẠI', text: 'Dữ liệu tracker' }]}
          footerNote="Xem lại dữ liệu thật trước mỗi buổi"
        />,
      )
      expect(screen.getByText('Reflection giữ thay đổi')).toBeDefined()
      expect(screen.getByText('Ngày 7')).toBeDefined()
      expect(screen.getByText('NHÌN LẠI')).toBeDefined()
      expect(screen.getByText('Xem lại dữ liệu thật trước mỗi buổi')).toBeDefined()
    })
  })

  describe('3. Journey Template 100% Precision Verification', () => {
    it('has root.props.title Trang lộ trình and empty zones', () => {
      expect(journeyTemplate.root.props?.title).toBe('Trang lộ trình')
      expect(journeyTemplate.zones).toEqual({})
    })

    it('all component types in journeyTemplate exist in puckConfig', () => {
      const componentTypes = new Set(Object.keys(puckConfig.components))
      for (const item of journeyTemplate.content) {
        expect(
          componentTypes.has(item.type),
          `Component ${item.type} not found in puckConfig`,
        ).toBe(true)
      }
    })

    it('contains all 13 numbered section labels (01 to 13)', () => {
      const json = JSON.stringify(journeyTemplate)
      const expectedLabels = [
        '01 · CÂU CHUYỆN KHÔNG CỦA RIÊNG AI',
        '02 · BỐI CẢNH & CHÂN DUNG',
        '03 · NỖI ĐAU',
        '04 · MONG MUỐN THẬT SỰ',
        '05 · KIẾN TRÚC CHƯƠNG TRÌNH',
        '06 · NGUYÊN LÝ THIẾT KẾ',
        '07 · NỀN TẢNG PHƯƠNG PHÁP',
        '08 · MÔ HÌNH TỔNG THỂ',
        '09 · CÁCH TRIỂN KHAI',
        '10 · SỢI CHỈ XUYÊN SUỐT',
        '11 · BẢN ĐỒ 28 NGÀY',
        '12 · ĐIỀU MANG VỀ',
        '13 · PHASE 2',
      ]

      for (const label of expectedLabels) {
        expect(json.includes(label), `Missing label: ${label}`).toBe(true)
      }
    })

    it('has hero title with titleCase none', () => {
      const hero = journeyTemplate.content.find((i) => i.type === 'HeroImage')
      expect(hero).toBeDefined()
      expect(hero?.props?.titleLine1).toBe('Chuyển mình')
      expect(hero?.props?.titleLine2).toBe('không chênh vênh')
      expect(hero?.props?.titleCase).toBe('none')
    })

    it('does not contain forbidden strings', () => {
      const json = JSON.stringify(journeyTemplate)
      expect(json.toLowerCase().includes('hoàn tiền')).toBe(false)
      expect(json.toLowerCase().includes('atm/visa')).toBe(false)
      expect(json.includes('http://')).toBe(false)
    })

    it('renders the complete journey template through Puck Render without throwing', () => {
      expect(() => {
        render(<Render config={puckConfig} data={journeyTemplate} />)
      }).not.toThrow()
    })
  })
})
