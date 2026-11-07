'use client'

import React from 'react'
import { MatrixTable } from '@/components/site/MatrixTable'
import { LoopDiagram } from '@/components/site/LoopDiagram'
import { IconCard as Card } from '@/components/site/IconCard'
import { IconCardGrid } from '@/components/site/IconCardGrid'
import { Callout } from '@/components/site/Callout'
import { HeroImage } from '@/components/site/HeroImage'

export function Pk26Demo() {
  return (
    <div data-testid="pk26-demo-root" className="space-y-12">
      {/* 1. MatrixTable Grid & List */}
      <div>
        <h3 className="font-ui text-lg font-bold text-deep-navy mb-4">
          1. Khối Bảng lưới (MatrixTable) - Dạng Lưới (Grid) &amp; Danh sách (List)
        </h3>
        <div className="space-y-6">
          <MatrixTable
            variant="grid"
            seriesLabel="[MẪU] 11 · BẢN ĐỒ 28 NGÀY"
            titleLine1="[MẪU] NHỊP THỰC HÀNH"
            emotionLine="[MẪU] Mỗi bước đi đều là một nhịp chuyển mình đáng quý."
            columns={[
              { label: '[MẪU] 01 · Thói quen', color: 'butter-cream' },
              { label: '[MẪU] 02 · Cảm xúc', color: 'soft-pink' },
              { label: '[MẪU] 03 · Giao tiếp', color: 'mint-haze' },
            ]}
            rows={[
              {
                label: '[MẪU] Tuần 1',
                cells: [
                  { title: '[MẪU] Bắt đầu, quan sát', text: '[MẪU] Điều gì khác với dự tính?' },
                  { title: '[MẪU] Quan sát tín hiệu', text: '[MẪU] Cơ thể báo hiệu cảm xúc ra sao?' },
                  { title: '[MẪU] Quan sát cách nói', text: '[MẪU] Mình nghiêng về năng lượng nào?' },
                ],
              },
              {
                label: '[MẪU] Tuần 2',
                cells: [
                  { title: '[MẪU] Chỉnh cho hợp mình', text: '[MẪU] Thay đổi nào giúp dễ làm hơn?' },
                  { title: '[MẪU] Gọi tên, biểu đạt', text: '[MẪU] Cách nào giúp diễn đạt tốt hơn?' },
                  { title: '[MẪU] Lắng nghe, hỏi rõ', text: '[MẪU] Mình nghe để hiểu hay để đáp?' },
                ],
              },
            ]}
          />

          <MatrixTable
            variant="list"
            bgColor="deep-navy"
            seriesLabel="[MẪU] 10 · SỢI CHỈ XUYÊN SUỐT"
            titleLine1="[MẪU] REFLECTION GIỮ THAY ĐỔI Ở LẠI"
            chipsTitle="[MẪU] 4 MỐC NHÌN LẠI"
            chips={[
              { label: '[MẪU] Ngày 7' },
              { label: '[MẪU] Ngày 14' },
              { label: '[MẪU] Ngày 21' },
              { label: '[MẪU] Ngày 28 · tổng kết' },
            ]}
            rows={[
              { label: '[MẪU] NHÌN LẠI', text: '[MẪU] Điều gì thực sự đã diễn ra?', hasAccentBar: true },
              { label: '[MẪU] HIỂU', text: '[MẪU] Điều gì giúp mình bắt đầu, hoặc khiến mình dừng lại?', hasAccentBar: true },
              { label: '[MẪU] ĐIỀU CHỈNH', text: '[MẪU] Mình muốn giữ, giảm hoặc thay đổi điều gì?', hasAccentBar: true },
              { label: '[MẪU] TIẾP NỐI', text: '[MẪU] Bước tiếp theo vừa sức với mình là gì?', hasAccentBar: true },
            ]}
          />
        </div>
      </div>

      {/* 2. LoopDiagram */}
      <div>
        <h3 className="font-ui text-lg font-bold text-deep-navy mb-4">
          2. Khối Sơ đồ vòng lặp (LoopDiagram)
        </h3>
        <LoopDiagram
          seriesLabel="[MẪU] 06 · NGUYÊN LÝ THIẾT KẾ"
          titleLine1="[MẪU] MỘT VÒNG LẶP CHO MỌI KỸ NĂNG"
          centerText="[MẪU] Hiểu mình và tự tin hơn qua từng trải nghiệm"
          nodes={[
            { label: '[MẪU] 01 · Nhận diện vấn đề' },
            { label: '[MẪU] 02 · Hiểu rõ phương pháp' },
            { label: '[MẪU] 03 · Hướng dẫn' },
            { label: '[MẪU] 04 · Thử nghiệm' },
            { label: '[MẪU] 05 · Nhìn lại' },
            { label: '[MẪU] 06 · Đúc kết' },
          ]}
        />
      </div>

      {/* 3. Card enhancements */}
      <div>
        <h3 className="font-ui text-lg font-bold text-deep-navy mb-4">
          3. Thẻ Card nâng cao (cardBg, eyebrowBar, subtitle, chip, bullet, items, note)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card
            id="demo-card-p1"
            cardBg="butter-cream"
            eyebrow="[MẪU] CHẶNG 1 · HIỂU"
            eyebrowBar={true}
            title="[MẪU] Workshop 1 · 90 phút"
            subtitle="[MẪU] Habit Loop & bốn quy luật"
            text={'- [MẪU] Tín hiệu → làm cho rõ ràng\n- [MẪU] Khao khát → làm cho hấp dẫn\n- [MẪU] Hành động → làm cho dễ dàng'}
            note={{
              title: '[MẪU] Mang về',
              text: '[MẪU] Hiểu cách thói quen vận hành trong thực tế',
              tone: 'butter-cream',
            }}
          />

          <Card
            id="demo-card-p2"
            cardBg="soft-pink"
            eyebrow="[MẪU] BƯỚC 1 · HIỂU"
            eyebrowBar={true}
            title="[MẪU] Emotional Literacy"
            chip="[MẪU] Workshop 1"
            itemsColumns={1}
            items={[
              { title: '[MẪU] Tín hiệu cơ thể', text: '[MẪU] Tim đập nhanh, cơ căng thẳng' },
              { title: '[MẪU] Nhu cầu cốt lõi', text: '[MẪU] Cần được lắng nghe và an toàn' },
            ]}
            note={{
              title: '[MẪU] Mang về',
              text: '[MẪU] Bản đồ cảm xúc cá nhân',
              tone: 'soft-pink',
            }}
          />

          <Card
            id="demo-card-p3"
            cardBg="deep-navy"
            eyebrow="[MẪU] PHASE 2"
            eyebrowBar={true}
            title="[MẪU] Career Clarity"
            subtitle="[MẪU] Thông suốt sự nghiệp"
            text="[MẪU] Hiểu mình rõ hơn, nhận ra thế mạnh và định hướng rõ bước tiếp theo trong sự nghiệp."
            chip="[MẪU] Khai vấn 1:1"
          />
        </div>
      </div>

      {/* 4. IconCardGrid with 5 columns and connector */}
      <div>
        <h3 className="font-ui text-lg font-bold text-deep-navy mb-4">
          4. Lưới 5 cột có mũi tên liên kết (IconCardGrid columns: 5, connector: &apos;arrow&apos;)
        </h3>
        <IconCardGrid
          id="demo-grid-5"
          columns={5}
          connector="arrow"
          cards={[
            { id: 'step-1', type: 'Card', props: { eyebrow: '01', title: '[MẪU] DỪNG' } },
            { id: 'step-2', type: 'Card', props: { eyebrow: '02', title: '[MẪU] NHẬN DIỆN' } },
            { id: 'step-3', type: 'Card', props: { eyebrow: '03', title: '[MẪU] ĐIỀU HÒA' } },
            { id: 'step-4', type: 'Card', props: { eyebrow: '04', title: '[MẪU] LỰA CHỌN' } },
            { id: 'step-5', type: 'Card', props: { eyebrow: '05', title: '[MẪU] QUAY LẠI' } },
          ]}
        />
      </div>

      {/* 5. Callout strip tones */}
      <div>
        <h3 className="font-ui text-lg font-bold text-deep-navy mb-4">
          5. Dải ghi chú mảnh với các tông màu (Callout stripTone)
        </h3>
        <div className="space-y-3">
          <Callout
            variant="strip"
            stripTone="soft-pink"
            title="[MẪU] HỒNG PHẤN"
            description="[MẪU] Tông màu mặc định, ấm áp và thanh lịch."
          />
          <Callout
            variant="strip"
            stripTone="lavender-mist"
            title="[MẪU] TÍM SƯƠNG"
            description="[MẪU] Dành cho phần nền tảng chung hoặc lưu ý trung tính."
          />
          <Callout
            variant="strip"
            stripTone="white"
            title="[MẪU] TRẮNG VIỀN MẢNH"
            description="[MẪU] Tinh tế, tạo điểm nhấn nhẹ nhàng trên nền màu."
          />
          <Callout
            variant="strip"
            stripTone="dashed"
            title="[MẪU] VIỀN ĐỨT HỒNG"
            description="[MẪU] Nền trong suốt, viền đứt hồng sen nổi bật."
          />
          <Callout
            variant="strip"
            stripTone="deep-navy"
            title="[MẪU] XANH THẪM CHỮ TRẮNG"
            description="[MẪU] Sẵn sàng cho giai đoạn tiếp theo với độ tương phản cao."
          />
        </div>
      </div>

      {/* 6. HeroImage with listTitle & listItems */}
      <div>
        <h3 className="font-ui text-lg font-bold text-deep-navy mb-4">
          6. Hero Image có danh sách giai đoạn (HeroImage listTitle &amp; listItems)
        </h3>
        <HeroImage
          id="demo-hero-list"
          layout="side"
          bgColor="deep-navy"
          titleLine1="[MẪU] Chuyển mình"
          titleLine2="[MẪU] không chênh vênh"
          emotionLine="[MẪU] Lộ trình vững vàng từ bên trong cho phụ nữ công sở."
          listTitle="[MẪU] PHASE 1"
          listItems={[
            { text: '[MẪU] 01 · Xây thói quen – Dựng thương hiệu' },
            { text: '[MẪU] 02 · Tập thương cảm xúc' },
            { text: '[MẪU] 03 · Giao tiếp hài hòa nam tính – nữ tính' },
            { text: '[MẪU] Phase 2 · Career Clarity – Thông suốt sự nghiệp', muted: true },
          ]}
        />
      </div>
    </div>
  )
}

