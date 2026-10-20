'use client'

import React from 'react'
import { JourneySteps } from '@/components/site/JourneySteps'
import { StoryBlock } from '@/components/site'
import { ImageText } from '@/components/site/ImageText'
import { LogoStrip } from '@/components/site/LogoStrip'
import { VisionMission } from '@/components/site/VisionMission'
import { ServiceCards } from '@/components/site/ServiceCards'
import { TwoPathCards } from '@/components/site/TwoPathCards'
import { TeamGrid } from '@/components/site/TeamGrid'

export function Sm04BlocksDemo() {
  return (
    <div className="space-y-16">
      {/* 1. JourneySteps variants */}
      <div className="space-y-6">
        <div className="border-b border-deep-navy/10 pb-2">
          <h3 className="font-ui text-sm font-bold uppercase tracking-wider text-bright-magenta">
            Khối JourneySteps v2 – Biến thể thẻ (cards) &amp; Biến thể danh sách (list)
          </h3>
          <p className="mt-1 font-ui text-xs text-deep-navy/70">
            Hỗ trợ 3 biến thể: circles, cards, list với bước nổi bật (highlightStep) và subtitle
          </p>
        </div>

        <div className="rounded-card border border-deep-navy/10 bg-white p-6 shadow-soft">
          <p className="mb-4 font-ui text-xs font-bold uppercase tracking-wider text-deep-navy/70">
            Biến thể Thẻ (cards) – Bước 2 được làm nổi bật (highlightStep = 2)
          </p>
          <JourneySteps
            seriesLabel="[MẪU SM-04] LỘ TRÌNH CHUYỂN HÓA"
            titleLine1="5 BƯỚC THẤU HIỂU"
            titleLine2="VÀ ĐỒNG HÀNH"
            emotionLine="Hành trình dịu dàng đi qua từng nhịp cảm xúc tự nhiên"
            variant="cards"
            highlightStep={2}
            step1Subtitle="Tạo khoảng lặng"
            step1Description="Ngừng phản xạ tức thời, hít thở sâu để đưa tâm trí về hiện tại."
            step2Subtitle="Lắng nghe cơ thể"
            step2Description="Nhận biết tín hiệu cơ thể và vị trí của cảm xúc đang xuất hiện."
            step3Subtitle="Mở rộng vốn từ"
            step3Description="Định danh chính xác cảm xúc với bảng 26 sắc thái EQ Buddy."
            step4Subtitle="Lựa chọn phản hồi"
            step4Description="Chọn cách ứng xử phù hợp thay vì để cảm xúc dẫn dắt."
            step5Subtitle="Tích hợp thói quen"
            step5Description="Lặp lại đều đặn mỗi ngày trong chuỗi 21 ngày rèn luyện."
          />
        </div>

        <div className="rounded-card border border-deep-navy/10 bg-white p-6 shadow-soft">
          <p className="mb-4 font-ui text-xs font-bold uppercase tracking-wider text-deep-navy/70">
            Biến thể Danh sách (list)
          </p>
          <JourneySteps
            seriesLabel="[MẪU SM-04] CÁC BƯỚC ĐỒNG HÀNH"
            titleLine1="QUY TRÌNH PHIÊN"
            titleLine2="COACHING 1:1"
            emotionLine="Mỗi phiên đồng hành là một không gian an toàn để bạn giãi bày"
            variant="list"
            step1Subtitle="Khảo sát ban đầu"
            step1Description="Xác định mục tiêu và mong muốn chuyển hóa cảm xúc của bạn."
            step2Subtitle="Phiên chuyên sâu 60 phút"
            step2Description="Cùng coach bóc tách nguyên nhân gốc rễ và gọi tên cảm xúc."
            step3Subtitle="Kế hoạch 21 ngày"
            step3Description="Nhận bộ công cụ Habit Tracker và bài tập thực hành cụ thể."
          />
        </div>
      </div>

      {/* 2. Story variants */}
      <div className="space-y-6">
        <div className="border-b border-deep-navy/10 pb-2">
          <h3 className="font-ui text-sm font-bold uppercase tracking-wider text-bright-magenta">
            Khối Câu chuyện sáng lập – Tone tối (dark) &amp; Bố cục thư gửi (letter)
          </h3>
          <p className="mt-1 font-ui text-xs text-deep-navy/70">
            Hỗ trợ tone light/dark, layout story/letter kèm chữ ký cuối thư
          </p>
        </div>

        <div className="rounded-card border border-deep-navy/10 bg-white p-6 shadow-soft">
          <p className="mb-4 font-ui text-xs font-bold uppercase tracking-wider text-deep-navy/70">
            Biến thể Thư gửi có chữ ký ảnh (layout: letter, tone: light, greeting)
          </p>
          <StoryBlock
            seriesLabel="[MẪU SM-04] LỜI NGỎ TỪ COACH"
            titleLine1="GỬI BẠN,"
            titleLine2="NGƯỜI ĐANG DỪNG LẠI"
            greeting="[MẪU] Thân gửi bạn,"
            signatureName="[MẪU] Người sáng lập"
            quoteLine="Đôi dòng tâm tình gửi tới những trái tim đang tìm kiếm sự bình yên"
            tone="light"
            layout="letter"
            storyContent={
              'Tôi từng trải qua những năm tháng gồng mình để đáp ứng kỳ vọng của mọi người, cho đến khi nhận ra cảm xúc không phải là gánh nặng cần che giấu.\n\nTrạm Dừng Cảm Xúc ra đời như một chiếc trạm dừng nghỉ chân ấm áp, nơi bạn có thể tháo bỏ chiếc áo giáp và nhẹ nhàng ôm lấy chính mình.'
            }
            chips={[
              { text: '[MẪU] Chứng nhận chuyên môn' },
              { text: '[MẪU] Kinh nghiệm đồng hành' },
            ]}
            jobTitle="[MẪU] Người đồng hành"
            founderSignatureAlt="[MẪU] Chữ ký người đồng hành"
            _resolved={{
              founderSignatureUrl: '/brand/sample-avatar.svg',
              founderSignatureAlt: '[MẪU] Chữ ký người đồng hành',
            }}
          />
        </div>

        <div className="rounded-card border border-deep-navy/10 bg-white p-6 shadow-soft">
          <p className="mb-4 font-ui text-xs font-bold uppercase tracking-wider text-deep-navy/70">
            Biến thể Thư gửi có chữ ký dạng chữ (layout: letter, greeting + signatureName)
          </p>
          <StoryBlock
            seriesLabel="[MẪU SM-04] TÂM TÌNH ĐỒNG HÀNH"
            titleLine1="KHOẢNG LẶNG,"
            titleLine2="ĐỂ LẮNG NGHE"
            greeting="[MẪU] Thân gửi bạn,"
            signatureName="[MẪU] Người sáng lập"
            quoteLine="Đôi dòng tâm tình gửi tới những trái tim đang tìm kiếm sự bình yên"
            tone="light"
            layout="letter"
            storyContent={
              'Tôi từng trải qua những năm tháng gồng mình để đáp ứng kỳ vọng của mọi người, cho đến khi nhận ra cảm xúc không phải là gánh nặng cần che giấu.\n\nTrạm Dừng Cảm Xúc ra đời như một chiếc trạm dừng nghỉ chân ấm áp, nơi bạn có thể tháo bỏ chiếc áo giáp và nhẹ nhàng ôm lấy chính mình.'
            }
            chips={[{ text: '[MẪU] Lắng nghe bản thân' }, { text: '[MẪU] Thấu hiểu cảm xúc' }]}
            jobTitle="[MẪU] Người đồng hành"
          />
        </div>

        <div className="rounded-card border border-deep-navy/10 bg-white p-6 shadow-soft">
          <p className="mb-4 font-ui text-xs font-bold uppercase tracking-wider text-deep-navy/70">
            Biến thể Nền tối (tone: dark, layout: story)
          </p>
          <StoryBlock
            seriesLabel="[MẪU SM-04] CÂU CHUYỆN SÁNG LẬP"
            titleLine1="CHUYỂN HÓA NỘI TÂM"
            titleLine2="TỎA SÁNG TỰ NHIÊN"
            quoteLine="Một hành trình từ hoài nghi đến kiên định và bình an"
            tone="dark"
            layout="story"
            storyContent={
              'Hành trình của tôi không bắt đầu bằng những thành tựu rực rỡ, mà bắt đầu từ những ngày tháng mất kết nối với chính cảm xúc của mình.\n\nNhờ phương pháp chánh niệm và trí tuệ cảm xúc, tôi đã tìm lại sự cân bằng và muốn lan tỏa điều đó tới cộng đồng.'
            }
            chips={[{ text: '[MẪU] Khai vấn cá nhân' }, { text: '[MẪU] Đồng hành doanh nghiệp' }]}
            jobTitle="[MẪU] Chuyên gia khai vấn"
          />
        </div>
      </div>

      {/* 3. ImageText v2 */}
      <div className="space-y-6">
        <div className="border-b border-deep-navy/10 pb-2">
          <h3 className="font-ui text-sm font-bold uppercase tracking-wider text-bright-magenta">
            Khối ImageText v2 – Trích dẫn (quote) &amp; Nhãn ảnh (imageLabel)
          </h3>
          <p className="mt-1 font-ui text-xs text-deep-navy/70">
            Nâng cấp thêm trường quote (khối viền hồng sen) và imageLabel (caption ảnh)
          </p>
        </div>

        <div className="rounded-card border border-deep-navy/10 bg-white p-6 shadow-soft">
          <ImageText
            seriesLabel="[MẪU SM-04] KHÔNG GIAN ĐỒNG HÀNH"
            titleLine1="LẮNG NGHE KHÔNG PHÁN XÉT"
            titleLine2="HIỂU MÌNH ĐỂ THƯƠNG MÌNH"
            content="[MẪU] Mỗi phiên làm việc là một trải nghiệm sâu lắng, giúp bạn nhận diện những rào cản vô hình và tìm lại động lực nội tại."
            quote="[MẪU] Khi ta đủ can đảm để nhìn thẳng vào cảm xúc, vết thương bắt đầu lành lại."
            imageLabel="[MẪU] Phiên khai vấn thực tế"
            imageUrl="/brand/sample-cover.svg"
            imageAlt="[MẪU] Ảnh minh họa phiên khai vấn"
            layout="image-left"
            buttonText="Tìm hiểu quy trình"
            buttonLink="#quy-trinh"
          />
        </div>
      </div>

      {/* 4. LogoStrip v2 */}
      <div className="space-y-6">
        <div className="border-b border-deep-navy/10 pb-2">
          <h3 className="font-ui text-sm font-bold uppercase tracking-wider text-bright-magenta">
            Khối LogoStrip v2 – Phân nhóm logo (groups)
          </h3>
          <p className="mt-1 font-ui text-xs text-deep-navy/70">
            Hỗ trợ phân nhóm đối tác / chứng chỉ / trường đào tạo có tab hoặc tiêu đề nhóm
          </p>
        </div>

        <div className="rounded-card border border-deep-navy/10 bg-white p-6 shadow-soft">
          <LogoStrip
            title="[MẪU] ĐỐI TÁC VÀ CHỨNG NHẬN ĐỒNG HÀNH"
            groups={[
              {
                label: '[MẪU] Nhóm chứng nhận chuyên môn',
                logos: [{ alt: '[MẪU] Tổ chức Test 01' }, { alt: '[MẪU] Tổ chức Test 02' }],
              },
              {
                label: '[MẪU] Nhóm doanh nghiệp đồng hành',
                logos: [{ alt: '[MẪU] Tổ chức Test 03' }, { alt: '[MẪU] Tổ chức Test 04' }],
              },
            ]}
          />
        </div>
      </div>

      {/* 5. VisionMission */}
      <div className="space-y-6">
        <div className="border-b border-deep-navy/10 pb-2">
          <h3 className="font-ui text-sm font-bold uppercase tracking-wider text-bright-magenta">
            Khối VisionMission – Tầm nhìn &amp; Sứ mệnh 2 thẻ đối xứng
          </h3>
          <p className="mt-1 font-ui text-xs text-deep-navy/70">
            Thẻ Tầm nhìn (Lavender) và Thẻ Sứ mệnh (Mint) đối xứng kèm câu trích dẫn đúc kết
          </p>
        </div>

        <div className="rounded-card border border-deep-navy/10 bg-white p-6 shadow-soft">
          <VisionMission
            seriesLabel="[MẪU SM-04] GIÁ TRỊ CỐT LÕI"
            titleLine1="TẦM NHÌN VÀ SỨ MỆNH"
            titleLine2="TRẠM DỪNG CẢM XÚC"
            quote="Một cảm xúc được thấu hiểu là một bước tiến gần hơn tới sự tự do nội tâm."
            visionTitle="Tầm nhìn 2030"
            visionContent={
              'Trở thành hệ sinh thái giáo dục cảm xúc ứng dụng hàng đầu tại Việt Nam.\n\nNơi mỗi cá nhân đều có kỹ năng tự chăm sóc sức khỏe tinh thần và vững vàng chuyển mình.'
            }
            visionIcon="compass"
            missionTitle="Sứ mệnh của Trạm"
            missionContent={
              'Đồng hành cùng người Việt trẻ vượt qua khủng hoảng cảm xúc bằng các công cụ đơn giản.\n\nXây dựng thói quen tâm lý lành mạnh qua chuỗi trải nghiệm kiên trì và bền bỉ.'
            }
            missionIcon="heart"
          />
        </div>
      </div>

      {/* 6. ServiceCards */}
      <div className="space-y-6">
        <div className="border-b border-deep-navy/10 pb-2">
          <h3 className="font-ui text-sm font-bold uppercase tracking-wider text-bright-magenta">
            Khối ServiceCards – Danh sách dịch vụ từ collection services
          </h3>
          <p className="mt-1 font-ui text-xs text-deep-navy/70">
            Hiển thị các dịch vụ chuyên biệt (coaching, workshop), hỗ trợ gắn cờ nổi bật
            (highlighted)
          </p>
        </div>

        <div className="rounded-card border border-deep-navy/10 bg-white p-6 shadow-soft">
          <ServiceCards
            seriesLabel="[MẪU SM-04] DỊCH VỤ CHUYÊN BIỆT"
            titleLine1="CÁC LỘ TRÌNH ĐỒNG HÀNH"
            titleLine2="DÀNH RIÊNG CHO BẠN"
            emotionLine="Thiết kế cá nhân hóa phù hợp với từng giai đoạn chuyển mình"
            highlightServiceId="srv-1"
            _resolved={{
              services: [
                {
                  id: 'srv-1',
                  name: 'Khai vấn 1:1 Vững vàng chuyển mình',
                  slug: 'vung-vang-chuyen-minh',
                  badge: 'Nổi bật nhất',
                  audience: 'Dành cho quản lý & chuyên gia',
                  situations: ['Bế tắc cảm xúc trong công việc', 'Mất kết nối với bản thân'],
                  outcomes: ['Lấy lại năng lượng hành động', 'Xây dựng thói quen tâm lý vững vàng'],
                  ctaLabel: 'Đăng ký đồng hành',
                },
                {
                  id: 'srv-2',
                  name: 'Tư vấn Hướng nghiệp & Thế mạnh độc bản',
                  slug: 'huong-nghiep-the-manh',
                  audience: 'Dành cho người chuyển ngành',
                  situations: ['Hoang mang trước ngã rẽ sự nghiệp', 'Chưa rõ thế mạnh cá nhân'],
                  outcomes: ['Định vị giá trị cốt lõi', 'Lập kế hoạch hành động 6 tháng'],
                  ctaLabel: 'Đăng ký tư vấn',
                },
              ],
            }}
          />
        </div>
      </div>

      {/* 7. TwoPathCards */}
      <div className="space-y-6">
        <div className="border-b border-deep-navy/10 pb-2">
          <h3 className="font-ui text-sm font-bold uppercase tracking-wider text-bright-magenta">
            Khối TwoPathCards – Hai lối đi Cá nhân &amp; Doanh nghiệp
          </h3>
          <p className="mt-1 font-ui text-xs text-deep-navy/70">
            Thẻ solid (Cá nhân) và thẻ outline (Doanh nghiệp) điều hướng người dùng tới trang đích
            phù hợp
          </p>
        </div>

        <div className="rounded-card border border-deep-navy/10 bg-white p-6 shadow-soft">
          <TwoPathCards
            seriesLabel="[MẪU SM-04] BẠN ĐANG TÌM KIẾM ĐIỀU GÌ?"
            titleLine1="CHỌN LỐI ĐI PHÙ HỢP"
            titleLine2="VỚI NHU CẦU CỦA BẠN"
            path1GroupLabel="Lộ trình Cá nhân"
            path1Title="Dành cho Cá nhân"
            path1Description="[MẪU] Khám phá bản thân qua các công cụ tự học, chuỗi 21 ngày và phiên coaching 1:1 chuyên sâu."
            path1ButtonLabel="Khám phá lộ trình cá nhân"
            path1ButtonStyle="solid"
            path1Href="/coaching"
            path2GroupLabel="Giải pháp Tổ chức"
            path2Title="Dành cho Doanh nghiệp"
            path2Description="Workshop may đo, chương trình chăm sóc tinh thần nhân sự (EAP) và nâng cao năng lực lãnh đạo thấu cảm."
            path2ButtonLabel="Khám phá giải pháp B2B"
            path2ButtonStyle="outline"
            path2Href="/doanh-nghiep"
          />
        </div>
      </div>

      {/* 8. TeamGrid */}
      <div className="space-y-6">
        <div className="border-b border-deep-navy/10 pb-2">
          <h3 className="font-ui text-sm font-bold uppercase tracking-wider text-bright-magenta">
            Khối TeamGrid – Đội ngũ chuyên môn &amp; Cộng sự
          </h3>
          <p className="mt-1 font-ui text-xs text-deep-navy/70">
            Lưới thẻ đội ngũ hiển thị ảnh (nếu có) hoặc avatar chữ cái viết tắt, liên kết LinkedIn
          </p>
        </div>

        <div className="rounded-card border border-deep-navy/10 bg-white p-6 shadow-soft">
          <TeamGrid
            seriesLabel="[MẪU SM-04] ĐỘI NGŨ CHUYÊN MÔN"
            titleLine1="NHỮNG NGƯỜI ĐỒNG HÀNH"
            titleLine2="TẠI TRẠM DỪNG CẢM XÚC"
            emotionLine="Các chuyên gia tâm lý và khai vấn tận tâm vì sự trưởng thành của bạn"
            _resolved={{
              members: [
                {
                  id: 'mem-1',
                  name: '[MẪU] Thành viên Test 01',
                  role: '[MẪU] Vai trò Test 01',
                  bio: '[MẪU] Mô tả kinh nghiệm và chuyên môn của thành viên đồng hành.',
                  photoUrl: '/brand/sample-avatar.svg',
                  photoAlt: '[MẪU] Thành viên Test 01',
                  consent: true,
                },
                {
                  id: 'mem-2',
                  name: '[MẪU] Thành viên Test 02',
                  role: '[MẪU] Vai trò Test 02',
                  bio: '[MẪU] Mô tả thông tin chuyên sâu về điều hòa cảm xúc và tâm lý.',
                  photoUrl: null,
                  consent: true,
                },
                {
                  id: 'mem-3',
                  name: '[MẪU] Thành viên Test 03',
                  role: '[MẪU] Vai trò Test 03',
                  bio: '[MẪU] Mô tả thông tin kết nối và đồng hành cùng học viên.',
                  photoUrl: null,
                  consent: true,
                },
              ],
            }}
          />
        </div>
      </div>
    </div>
  )
}
