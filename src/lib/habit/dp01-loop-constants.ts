import { Zap, Flame, CheckCircle2, Gift } from 'lucide-react'
import type React from 'react'
import type { IdentityFormData } from '@/components/habit/zip/types'
import { formatTimeAmPm } from '@/lib/habit/tracker-stats'

export interface TechniqueItem {
  id: string
  title: string
  description: string
  examples: string[]
  applyLabel?: string
  placeholderGenerator: (identity?: IdentityFormData) => string
  videoUrl: string
}

export interface LawSection {
  id: 'cue' | 'craving' | 'response' | 'reward'
  categoryKey: 'cues' | 'cravings' | 'responses' | 'rewards'
  lawNumber: string
  lawEnTitle: string
  title: string
  subLabel: string
  question: string
  icon: React.ComponentType<{ className?: string }>
  videoUrl: string
  totalTechs: number
  borderClass: string
  prescribedBorderClass: string
  prescribedBgClass: string
  pillClass: string
  iconBoxClass: string
  videoBtnClass: string
  checkboxActiveClass: string
  techniques: TechniqueItem[]
}

export const DEFAULT_LAW_SECTIONS: LawSection[] = [
  // 1. QUY LUẬT 1: MAKE IT OBVIOUS (TÍN HIỆU)
  {
    id: 'cue',
    categoryKey: 'cues',
    lawNumber: '1 · MAKE IT OBVIOUS',
    lawEnTitle: 'Cue · Tín hiệu',
    title: 'Tín hiệu đủ rõ ràng',
    subLabel: 'Cue · Tín hiệu',
    question: 'Điều gì sẽ nhắc bạn bắt đầu? Lúc nào, ở đâu, sau việc gì?',
    icon: Zap,
    videoUrl:
      'https://www.facebook.com/61577262321239/videos/a.122201322500908744/1692428401853478',
    totalTechs: 3,
    borderClass: 'border-blue-200/90',
    prescribedBorderClass: 'border-[#3b4991] ring-2 ring-[#3b4991]/20 shadow-md',
    prescribedBgClass: 'bg-[#3b4991]',
    pillClass: 'bg-[#EEF2FF] text-deep-navy border border-blue-200/60',
    iconBoxClass: 'bg-[#EEF2FF] text-deep-navy border border-blue-200/60',
    videoBtnClass: 'border-deep-navy text-deep-navy hover:bg-deep-navy/10',
    checkboxActiveClass: 'bg-[#3b4991] border-[#3b4991] text-white',
    techniques: [
      {
        id: 'tech-1',
        title: 'Soi lại nhịp sinh học',
        description: 'Gắn thói quen mới vào đúng thời điểm bạn còn năng lượng, thay vì lúc đã cạn.',
        examples: [
          'Nhận ra mình tỉnh táo nhất lúc 6h30, đặt việc quan trọng vào đó thay vì 10h tối khi đã cạn',
          'Thấy mình hay trống 15 phút lúc chờ cơm trưa, dùng đúng khoảng đó cho thói quen mới',
        ],
        applyLabel: 'Thói quen tốt tôi nhận ra:',
        placeholderGenerator: (id) => {
          const formatted = id?.mentorTime ? formatTimeAmPm(id.mentorTime) || id.mentorTime : ''
          return formatted
            ? `Thói quen của tôi sẽ rơi vào khoảng ${formatted}, lúc tôi còn năng lượng.`
            : 'Ngồi thiền'
        },
        videoUrl: 'https://www.facebook.com/reel/1346424584229031',
      },
      {
        id: 'tech-2',
        title: 'Ghép thói quen mới',
        description:
          'Gắn việc mới vào ngay sau một việc bạn đã làm ổn định. Việc cũ chính là Mentor, và nó trở thành tín hiệu cho việc mới.',
        examples: [
          'Sau khi pha cà phê sáng, tôi đọc 1 trang sách',
          'Sau khi đóng laptop cuối ngày, tôi viết 3 dòng nháp',
        ],
        placeholderGenerator: (id) =>
          id?.selectedMentor
            ? `Sau khi ${id.selectedMentor}, tôi sẽ ${id.atomicHabit || '[thói quen hạt nhân]'}.`
            : 'Sau khi [Mentor], tôi sẽ [thói quen hạt nhân].',
        videoUrl: 'https://www.facebook.com/reel/2074993686432772',
      },
      {
        id: 'tech-3',
        title: 'Hẹn thói quen cụ thể',
        description: 'Khi nào, ở đâu, với ai. Một lời hẹn mơ hồ là một lời hẹn sẽ bị hoãn.',
        examples: [
          'Thứ Hai, Tư, Sáu lúc 6h, ở công viên gần nhà, tôi chạy bộ 10 phút',
          'Mỗi tối 21h, ở bàn làm việc, tôi viết 3 dòng nháp',
        ],
        placeholderGenerator: () => 'Tôi sẽ [hành động] vào [thời gian] tại [địa điểm].',
        videoUrl: 'https://www.facebook.com/reel/1397759535662307',
      },
    ],
  },

  // 2. QUY LUẬT 2: MAKE IT ATTRACTIVE (KHAO KHÁT)
  {
    id: 'craving',
    categoryKey: 'cravings',
    lawNumber: '2 · MAKE IT ATTRACTIVE',
    lawEnTitle: 'Craving · Khao khát',
    title: 'Khao khát thực hiện đủ lớn',
    subLabel: 'Craving · Khao khát',
    question: 'Làm sao để bạn mong chờ việc này thay vì né nó?',
    icon: Flame,
    videoUrl:
      'https://www.facebook.com/61577262321239/videos/a.122201322500908744/1563757661881940',
    totalTechs: 3,
    borderClass: 'border-pink-200/90',
    prescribedBorderClass: 'border-[#a8325d] ring-2 ring-[#a8325d]/20 shadow-md',
    prescribedBgClass: 'bg-[#a8325d]',
    pillClass: 'bg-soft-pink text-bright-magenta border border-bright-magenta/20',
    iconBoxClass: 'bg-soft-pink text-bright-magenta border border-bright-magenta/20',
    videoBtnClass: 'border-bright-magenta text-bright-magenta hover:bg-bright-magenta/10',
    checkboxActiveClass: 'bg-[#a8325d] border-[#a8325d] text-white',
    techniques: [
      {
        id: 'tech-4',
        title: 'Môi trường ảnh hưởng',
        description:
          'Cái gì muốn giữ thì để gần, cái gì muốn bỏ thì để xa. Môi trường làm thay phần lớn việc của ý chí.',
        examples: [
          'Để sách ngay trên gối, để điện thoại sạc ngoài phòng ngủ',
          'Đặt giày chạy ngay cửa, đẩy app mạng xã hội ra khỏi màn hình chính',
        ],
        placeholderGenerator: () => 'Tôi sẽ thay đổi không gian bằng cách…',
        videoUrl: 'https://www.facebook.com/reel/4513469222272397',
      },
      {
        id: 'tech-5',
        title: 'Nghi thức tạo động lực',
        description:
          'Một hành động dạo đầu dễ chịu, lặp lại mỗi lần, giúp bạn vào việc mà không phải tranh luận với chính mình.',
        examples: [
          'Mở đúng một playlist 10 phút rồi mới bắt đầu; hết nhạc là xong phiên',
          'Rót một tách trà, bật đèn bàn, hít thở ba lần rồi mới vào việc',
        ],
        placeholderGenerator: () => 'Trước khi bắt đầu, tôi sẽ…',
        videoUrl: 'https://www.facebook.com/reel/4682982545357599',
      },
      {
        id: 'tech-6',
        title: 'Bộ đôi thói quen',
        description:
          'Ghép việc cần làm với một điều bạn thật sự thích, và chỉ cho phép mình điều đó khi đang làm việc kia.',
        examples: [
          'Chỉ nghe podcast yêu thích khi đang đi bộ',
          'Chỉ uống ly cà phê ngon của ngày khi đang ngồi viết',
        ],
        placeholderGenerator: () => 'Tôi chỉ [điều tôi thích] khi đang [việc cần làm].',
        videoUrl: 'https://www.facebook.com/reel/1962615811412992',
      },
    ],
  },

  // 3. QUY LUẬT 3: MAKE IT EASY (PHẢN HỒI)
  {
    id: 'response',
    categoryKey: 'responses',
    lawNumber: '3 · MAKE IT EASY',
    lawEnTitle: 'Response · Phản hồi',
    title: 'Phản hồi đủ dễ dàng',
    subLabel: 'Response · Phản hồi',
    question: 'Phiên bản nhỏ nhất của việc này là gì?',
    icon: CheckCircle2,
    videoUrl: 'https://www.facebook.com/reel/1980547615969349',
    totalTechs: 2,
    borderClass: 'border-amber-200/90',
    prescribedBorderClass: 'border-[#b87614] ring-2 ring-[#b87614]/20 shadow-md',
    prescribedBgClass: 'bg-[#b87614]',
    pillClass: 'bg-butter-cream/60 text-[#B45309] border border-amber-200',
    iconBoxClass: 'bg-butter-cream/60 text-[#B45309] border border-amber-200/60',
    videoBtnClass: 'border-[#B45309] text-[#B45309] hover:bg-amber-100',
    checkboxActiveClass: 'bg-[#b87614] border-[#b87614] text-white',
    techniques: [
      {
        id: 'tech-7',
        title: 'Quy tắc 2 phút',
        description:
          'Phiên bản mở đầu phải nhỏ đến mức không thể từ chối. Mục tiêu của hai phút đầu là xuất hiện, không phải hoàn thành.',
        examples: [
          'Đọc sách → chỉ cần mở sách và đọc 1 trang',
          'Tập thể dục → chỉ cần mặc đồ tập và ra khỏi cửa',
        ],
        placeholderGenerator: () => 'Phiên bản hai phút của tôi là…',
        videoUrl: 'https://www.facebook.com/reel/2178394586406770',
      },
      {
        id: 'tech-8',
        title: 'Tự động hóa cam kết',
        description: 'Một quyết định làm một lần, loại bỏ hàng chục quyết định sau đó.',
        examples: [
          'Đăng ký lớp tập trả trước một tháng, để chỉ phải quyết định một lần',
          'Tối Chủ nhật hẹn giờ sẵn ba bài viết cho cả tuần',
        ],
        placeholderGenerator: () => 'Việc tôi làm một lần để khỏi phải quyết định lại là…',
        videoUrl: 'https://www.facebook.com/reel/1985523752130697',
      },
    ],
  },

  // 4. QUY LUẬT 4: MAKE IT SATISFYING (PHẦN THƯỞNG)
  {
    id: 'reward',
    categoryKey: 'rewards',
    lawNumber: '4 · MAKE IT SATISFYING',
    lawEnTitle: 'Reward · Phần thưởng',
    title: 'Phần thưởng đủ khích lệ ngay',
    subLabel: 'Reward · Phần thưởng',
    question: 'Ngay sau khi làm xong, bạn ghi nhận mình thế nào?',
    icon: Gift,
    videoUrl: 'https://www.facebook.com/reel/1064718299619776',
    totalTechs: 3,
    borderClass: 'border-emerald-200/90',
    prescribedBorderClass: 'border-[#23684a] ring-2 ring-[#23684a]/20 shadow-md',
    prescribedBgClass: 'bg-[#23684a]',
    pillClass: 'bg-mint-haze text-[#065F46] border border-emerald-200',
    iconBoxClass: 'bg-mint-haze text-[#065F46] border border-emerald-200/60',
    videoBtnClass: 'border-[#065F46] text-[#065F46] hover:bg-emerald-100',
    checkboxActiveClass: 'bg-[#23684a] border-[#23684a] text-white',
    techniques: [
      {
        id: 'tech-9',
        title: 'Chọn phần thưởng theo gu',
        description:
          'Phần thưởng chỉ có tác dụng khi đúng ngôn ngữ ghi nhận của bạn. Có người cần một món ngon, có người cần một lời khen, có người cần nửa giờ yên tĩnh.',
        examples: [
          'Làm xong thì tự cho phép mình nửa giờ đọc truyện không làm gì khác',
          'Làm xong thì nhắn cho một người bạn: mình vừa làm được rồi đó',
        ],
        placeholderGenerator: () => 'Ngay sau khi làm xong, tôi sẽ tự thưởng…',
        videoUrl: 'https://www.facebook.com/reel/1348980047032173',
      },
      {
        id: 'tech-10',
        title: 'Ghi nhận mình mỗi lần thực hiện',
        description:
          'Kết quả thật thường đến muộn. Bạn phải tự trả thưởng cho mình ngay lúc vừa làm xong, trước khi đi tìm kết quả.',
        examples: [
          'Tick ô trên tracker ngay khi vừa làm xong',
          'Viết một dòng cho mình: hôm nay mình đã giữ lời',
        ],
        placeholderGenerator: () => 'Ngay khi làm xong, tôi sẽ…',
        videoUrl: 'https://www.facebook.com/reel/1106447762337619',
      },
      {
        id: 'tech-11',
        title: 'Đôi bạn cùng tiến',
        description: 'Trách nhiệm với một người cụ thể giữ bạn lại đúng lúc bạn muốn buông.',
        examples: [
          'Tối Chủ nhật gửi ảnh chụp tracker cho một người bạn',
          'Rủ một người cùng chạy 28 ngày, mỗi tuần kể nhau nghe một lần',
        ],
        placeholderGenerator: () => 'Tôi sẽ rủ [tên] và hẹn nhau…',
        videoUrl: 'https://www.facebook.com/reel/1108792161728354',
      },
    ],
  },
]
