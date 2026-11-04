'use client'

import React, { useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Check,
  PlayCircle,
  Zap,
  Flame,
  CheckCircle2,
  Gift,
  ExternalLink,
} from 'lucide-react'
import { LoopTechniques, IdentityFormData, HabitStep } from '../types'
import { StepQuoteHeader } from '../StepQuoteHeader'

interface Step5LoopDesignProps {
  loopTechniques: LoopTechniques
  prescribedCategory?: 'cue' | 'craving' | 'response' | 'reward' | null
  identity?: IdentityFormData
  onGoToStep?: (step: HabitStep) => void
  onTechniquesChange: (updated: LoopTechniques) => void
  onNext: () => void
  onPrev: () => void
}

interface TechniqueItem {
  id: string
  title: string
  description: string
  examples: string[]
  placeholderGenerator: (identity?: IdentityFormData) => string
  videoUrl: string
}

interface LawSection {
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

const LAW_SECTIONS: LawSection[] = [
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
        placeholderGenerator: (id) =>
          id?.mentorTime
            ? `Thói quen của tôi sẽ rơi vào khoảng ${id.mentorTime}, lúc tôi còn năng lượng.`
            : 'Khoảng thời gian trong ngày tôi còn năng lượng nhất là…',
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

export function Step5LoopDesign({
  loopTechniques,
  prescribedCategory,
  identity,
  onGoToStep,
  onTechniquesChange,
  onNext,
  onPrev,
}: Step5LoopDesignProps) {
  const [openTechniques, setOpenTechniques] = useState<Record<string, boolean>>({
    'tech-1': true,
    'tech-2': true,
  })

  const toggleTechnique = (techId: string) => {
    setOpenTechniques((prev) => ({ ...prev, [techId]: !prev[techId] }))
  }

  const handleToggleTechnique = (
    category: 'cues' | 'cravings' | 'responses' | 'rewards',
    techTitle: string,
    techId: string,
  ) => {
    const currentList = loopTechniques[category] || []
    const isChecked = currentList.includes(techTitle)
    const updatedList = isChecked
      ? currentList.filter((t) => t !== techTitle)
      : [...currentList, techTitle]

    if (!isChecked) {
      setOpenTechniques((prev) => ({ ...prev, [techId]: true }))
    }

    onTechniquesChange({
      ...loopTechniques,
      [category]: updatedList,
    })
  }

  const handleNoteChange = (techId: string, text: string) => {
    const currentNotes = loopTechniques.appliedNotes || {}
    onTechniquesChange({
      ...loopTechniques,
      appliedNotes: {
        ...currentNotes,
        [techId]: text,
      },
    })
  }

  const handleOpenVideo = (url: string) => {
    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. Quote Block chuẩn hóa */}
      <StepQuoteHeader
        stage="GIAI ĐOẠN 2 · XÂY THÓI QUEN"
        title="Thiết kế vòng lặp"
        quote="“Bạn không vươn tới tầm mục tiêu của mình. Bạn rơi xuống mức các hệ thống của bạn.”"
        author="— James Clear, Atomic Habits —"
      />

      {/* 2. Card lý thuyết: Vòng lặp thói quen · The Habit Loop */}
      <div className="bg-white rounded-2xl border border-lavender-mist shadow-soft p-5 sm:p-7 space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-bright-magenta" />
            <h2 className="font-ui font-bold text-lg sm:text-xl text-deep-navy">
              Vòng lặp thói quen · The Habit Loop
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-deep-navy/70 font-ui mt-1 leading-relaxed">
            Mọi thói quen, tốt hay xấu, đều chạy qua bốn giai đoạn khép kín này — lặp đi lặp lại
            thành một vòng tròn.
          </p>
        </div>

        {/* Bố cục 2 cột (trên desktop) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center pt-2">
          {/* Cột trái: Biểu đồ SVG hình tròn đặc chia 4 góc phần tư + 2 mũi tên vòng cung chỉ hướng kim đồng hồ */}
          <div className="md:col-span-5 flex items-center justify-center">
            <div className="w-64 h-64 sm:w-72 sm:h-72">
              <svg viewBox="0 0 300 300" className="w-full h-full drop-shadow-sm select-none">
                <defs>
                  {/* Marker mũi tên vòng lặp thuận chiều kim đồng hồ */}
                  <marker
                    id="habit-loop-arrow"
                    viewBox="0 0 12 12"
                    refX="7"
                    refY="6"
                    markerWidth="8"
                    markerHeight="8"
                    orient="auto"
                  >
                    <path d="M 1 2 L 10 6 L 1 10 Z" fill="#280A60" />
                  </marker>
                </defs>

                {/* 2 MŨI TÊN VÒNG CUNG CHỈ HƯỚNG KIM ĐỒNG HỒ */}
                {/* Mũi tên 1: Nửa trên từ Trái sang Phải (CUE -> CRAVING -> RESPONSE) */}
                <path
                  d="M 43.1 100.1 A 118 118 0 0 1 256.9 100.1"
                  fill="none"
                  stroke="#280A60"
                  strokeWidth="3"
                  strokeLinecap="round"
                  opacity="0.85"
                  markerEnd="url(#habit-loop-arrow)"
                />

                {/* Mũi tên 2: Nửa dưới từ Phải sang Trái (RESPONSE -> REWARD -> CUE) */}
                <path
                  d="M 256.9 199.9 A 118 118 0 0 1 43.1 199.9"
                  fill="none"
                  stroke="#280A60"
                  strokeWidth="3"
                  strokeLinecap="round"
                  opacity="0.85"
                  markerEnd="url(#habit-loop-arrow)"
                />

                {/* HÌNH TRÒN ĐẶC CHIA LÀM 4 GÓC PHẦN TƯ (Radius = 100) */}
                {/* 1. Góc trên trái: CUE (#2C4A9A) */}
                <path
                  d="M 150 150 L 50 150 A 100 100 0 0 1 150 50 Z"
                  fill="#2C4A9A"
                  stroke="#FFFFFF"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                  className="transition-opacity hover:opacity-95"
                />
                <text
                  x="106"
                  y="102"
                  fill="#FFFFFF"
                  fontSize="13"
                  fontWeight="bold"
                  fontFamily="Montserrat, sans-serif"
                  textAnchor="middle"
                  letterSpacing="0.05em"
                >
                  CUE
                </text>
                <text
                  x="106"
                  y="120"
                  fill="#FFFFFF"
                  fontSize="11"
                  fontWeight="500"
                  fontFamily="Montserrat, sans-serif"
                  textAnchor="middle"
                  opacity="0.95"
                >
                  Tín hiệu
                </text>

                {/* 2. Góc trên phải: CRAVING (#2390C6) */}
                <path
                  d="M 150 150 L 150 50 A 100 100 0 0 1 250 150 Z"
                  fill="#2390C6"
                  stroke="#FFFFFF"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                  className="transition-opacity hover:opacity-95"
                />
                <text
                  x="194"
                  y="102"
                  fill="#FFFFFF"
                  fontSize="13"
                  fontWeight="bold"
                  fontFamily="Montserrat, sans-serif"
                  textAnchor="middle"
                  letterSpacing="0.05em"
                >
                  CRAVING
                </text>
                <text
                  x="194"
                  y="120"
                  fill="#FFFFFF"
                  fontSize="11"
                  fontWeight="500"
                  fontFamily="Montserrat, sans-serif"
                  textAnchor="middle"
                  opacity="0.95"
                >
                  Khao khát
                </text>

                {/* 3. Góc dưới phải: RESPONSE (#D69A12) */}
                <path
                  d="M 150 150 L 250 150 A 100 100 0 0 1 150 250 Z"
                  fill="#D69A12"
                  stroke="#FFFFFF"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                  className="transition-opacity hover:opacity-95"
                />
                <text
                  x="194"
                  y="186"
                  fill="#FFFFFF"
                  fontSize="13"
                  fontWeight="bold"
                  fontFamily="Montserrat, sans-serif"
                  textAnchor="middle"
                  letterSpacing="0.05em"
                >
                  RESPONSE
                </text>
                <text
                  x="194"
                  y="204"
                  fill="#FFFFFF"
                  fontSize="11"
                  fontWeight="500"
                  fontFamily="Montserrat, sans-serif"
                  textAnchor="middle"
                  opacity="0.95"
                >
                  Phản hồi
                </text>

                {/* 4. Góc dưới trái: REWARD (#D2343B) */}
                <path
                  d="M 150 150 L 150 250 A 100 100 0 0 1 50 150 Z"
                  fill="#D2343B"
                  stroke="#FFFFFF"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                  className="transition-opacity hover:opacity-95"
                />
                <text
                  x="106"
                  y="186"
                  fill="#FFFFFF"
                  fontSize="13"
                  fontWeight="bold"
                  fontFamily="Montserrat, sans-serif"
                  textAnchor="middle"
                  letterSpacing="0.05em"
                >
                  REWARD
                </text>
                <text
                  x="106"
                  y="204"
                  fill="#FFFFFF"
                  fontSize="11"
                  fontWeight="500"
                  fontFamily="Montserrat, sans-serif"
                  textAnchor="middle"
                  opacity="0.95"
                >
                  Phần thưởng
                </text>

                {/* Đường chia chữ thập sắc nét và điểm giao trung tâm */}
                <line
                  x1="50"
                  y1="150"
                  x2="250"
                  y2="150"
                  stroke="#FFFFFF"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <line
                  x1="150"
                  y1="50"
                  x2="150"
                  y2="250"
                  stroke="#FFFFFF"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <circle cx="150" cy="150" r="3" fill="#FFFFFF" />
              </svg>
            </div>
          </div>

          {/* Cột phải: Cấu trúc giải thích chia làm 2 tầng rõ rệt (Vấn đề / Giải pháp) */}
          <div className="md:col-span-7 space-y-4 font-ui">
            {/* TẦNG TRÊN: VẤN ĐỀ (CUE & CRAVING) */}
            <div className="flex items-stretch gap-3 sm:gap-4">
              <div className="w-7 sm:w-8 flex-shrink-0 flex items-center justify-center rounded-2xl bg-[#2C4A9A]/10 border border-[#2C4A9A]/20 select-none py-2">
                <span
                  style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                  className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest text-[#2C4A9A]"
                >
                  VẤN ĐỀ
                </span>
              </div>

              <div className="flex-1 space-y-2.5 border-l-2 border-[#2C4A9A]/30 pl-3.5 sm:pl-4 py-1">
                <div className="flex items-start gap-2.5">
                  <span className="font-ui font-bold text-[11px] sm:text-xs text-white px-2.5 py-0.5 rounded-md bg-[#2C4A9A] flex-shrink-0 tracking-wide mt-0.5 shadow-xs">
                    CUE
                  </span>
                  <p className="text-xs sm:text-sm text-deep-navy/90 leading-relaxed font-ui">
                    <strong className="text-deep-navy font-bold">Tín hiệu</strong> kích hoạt khao
                    khát
                  </p>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="font-ui font-bold text-[11px] sm:text-xs text-white px-2.5 py-0.5 rounded-md bg-[#2390C6] flex-shrink-0 tracking-wide mt-0.5 shadow-xs">
                    CRAVING
                  </span>
                  <p className="text-xs sm:text-sm text-deep-navy/90 leading-relaxed font-ui">
                    <strong className="text-deep-navy font-bold">Khao khát</strong> thúc đẩy phản
                    hồi
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-lavender-mist/70" />

            {/* TẦNG DƯỚI: GIẢI PHÁP (RESPONSE & REWARD) */}
            <div className="flex items-stretch gap-3 sm:gap-4">
              <div className="w-7 sm:w-8 flex-shrink-0 flex items-center justify-center rounded-2xl bg-[#D69A12]/10 border border-[#D69A12]/25 select-none py-2">
                <span
                  style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                  className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest text-[#B45309]"
                >
                  GIẢI PHÁP
                </span>
              </div>

              <div className="flex-1 space-y-2.5 border-l-2 border-[#D69A12]/35 pl-3.5 sm:pl-4 py-1">
                <div className="flex items-start gap-2.5">
                  <span className="font-ui font-bold text-[11px] sm:text-xs text-white px-2.5 py-0.5 rounded-md bg-[#D69A12] flex-shrink-0 tracking-wide mt-0.5 shadow-xs">
                    RESPONSE
                  </span>
                  <p className="text-xs sm:text-sm text-deep-navy/90 leading-relaxed font-ui">
                    <strong className="text-deep-navy font-bold">Phản hồi</strong> đưa đến phần
                    thưởng
                  </p>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="font-ui font-bold text-[11px] sm:text-xs text-white px-2.5 py-0.5 rounded-md bg-[#D2343B] flex-shrink-0 tracking-wide mt-0.5 shadow-xs">
                    REWARD
                  </span>
                  <p className="text-xs sm:text-sm text-deep-navy/90 leading-relaxed font-ui">
                    <strong className="text-deep-navy font-bold">Phần thưởng</strong> thỏa mãn khao
                    khát — và gắn ngược lại với tín hiệu, để lần sau não tự đoán trước cách phản
                    hồi.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-lavender-mist/70">
              <p className="text-xs sm:text-[13px] text-deep-navy/80 font-ui leading-relaxed italic">
                Hai giai đoạn đầu là vấn đề, hai giai đoạn sau là giải pháp. Đứt đoạn ở đâu thì sửa
                cách bạn thiết kế lại từng mắt xích.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Dòng hướng dẫn trên 4 quy luật */}
      <div className="p-4 rounded-2xl bg-warm-ivory border border-lavender-mist text-xs sm:text-sm text-deep-navy/80 font-ui leading-relaxed">
        Khối có nhãn <strong className="text-bright-magenta font-bold">Toa của bạn</strong> là lỗ
        hổng bạn tìm ra ở bước 1 — bắt đầu từ đó. Đánh dấu kỹ thuật bạn sẽ dùng; chỉ những kỹ thuật
        được đánh dấu mới hiện trên Habit Boarding Pass.
      </div>

      {/* 3. BỐN KHỐI QUY LUẬT (HIỂN THỊ MỞ CẢ 4 KHỐI) */}
      <div className="space-y-6">
        {LAW_SECTIONS.map((section) => {
          const isPrescribed = prescribedCategory === section.id
          const selectedInLaw = loopTechniques[section.categoryKey] || []
          const selectedCount = selectedInLaw.length

          return (
            <div
              key={section.id}
              className={`rounded-[20px] border transition-all duration-300 overflow-hidden bg-white shadow-soft ${
                isPrescribed ? section.prescribedBorderClass : 'border-lavender-mist'
              }`}
            >
              {/* Header của Khối Quy Luật */}
              <div className="p-5 sm:p-6 border-b border-lavender-mist/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider font-ui text-deep-navy/70 px-2 py-0.5 rounded bg-lavender-mist/40">
                      {section.lawNumber}
                    </span>

                    {isPrescribed && (
                      <span className="text-[10px] sm:text-[11px] font-bold text-white bg-bright-magenta px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                        Toa của bạn
                      </span>
                    )}

                    <span className="text-xs font-semibold text-deep-navy/60 font-ui">
                      {section.subLabel} · đã chọn {selectedCount}/{section.totalTechs}
                    </span>
                  </div>

                  <h3 className="font-display text-xl sm:text-2xl text-deep-navy uppercase tracking-wide">
                    {section.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-deep-navy/70 font-ui italic">
                    {section.question}
                  </p>
                </div>

                {/* Nút xem video quy luật */}
                <button
                  type="button"
                  onClick={() => handleOpenVideo(section.videoUrl)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-lavender-mist bg-white hover:bg-soft-pink/40 text-deep-navy font-semibold text-xs font-ui transition-all active:scale-95 shadow-xs flex-shrink-0 self-start md:self-auto cursor-pointer"
                >
                  <PlayCircle className="w-3.5 h-3.5 text-bright-magenta flex-shrink-0" />
                  <span>Video bài giảng</span>
                  <ExternalLink className="w-3 h-3 text-deep-navy/70" />
                </button>
              </div>

              {/* BỔ SUNG HỘP LƯU Ý RIÊNG CHO QUY LUẬT 1 */}
              {section.id === 'cue' && (
                <div className="mx-5 sm:mx-6 mt-4 p-4 rounded-2xl bg-[#EBF5FB] border border-[#AED6F1] text-xs sm:text-sm text-[#1B4F72] font-ui leading-relaxed flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <strong className="font-bold">Quy tắc này cần đủ cả 3 kỹ thuật.</strong> Tín
                    hiệu chỉ thật sự rõ khi có đủ thời điểm hợp năng lượng, việc cũ làm điểm tựa và
                    lời hẹn cụ thể. Hai kỹ thuật đầu lấy từ bước <em>Tìm Mentor</em>:
                  </div>
                  <button
                    type="button"
                    onClick={() => (onGoToStep ? onGoToStep(3) : onPrev())}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-[#AED6F1] text-xs font-bold text-[#1B4F72] hover:bg-[#D4E6F1] transition-all flex-shrink-0 cursor-pointer shadow-xs self-start sm:self-auto"
                  >
                    <span>Xem lại bước 3 →</span>
                  </button>
                </div>
              )}

              {/* Danh sách các kỹ thuật bên trong */}
              <div className="p-5 sm:p-6 space-y-4">
                {section.techniques.map((tech) => {
                  const isChecked = selectedInLaw.includes(tech.title)
                  const isDetailsOpen = !!openTechniques[tech.id]
                  const noteText = loopTechniques.appliedNotes?.[tech.id] || ''
                  const placeholder = tech.placeholderGenerator(identity)

                  return (
                    <div
                      key={tech.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        isChecked
                          ? 'bg-white border-bright-magenta/40 shadow-soft ring-1 ring-bright-magenta/20'
                          : 'bg-warm-ivory/50 border-lavender-mist/80 hover:border-lavender-mist'
                      }`}
                    >
                      {/* Technique Row Header */}
                      <div className="flex items-start justify-between gap-3">
                        {/* Checkbox + Title */}
                        <label className="flex items-start gap-3 cursor-pointer flex-1">
                          <button
                            type="button"
                            onClick={() =>
                              handleToggleTechnique(section.categoryKey, tech.title, tech.id)
                            }
                            className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all flex-shrink-0 mt-0.5 cursor-pointer ${
                              isChecked
                                ? section.checkboxActiveClass
                                : 'border-lavender-mist bg-white hover:border-bright-magenta'
                            }`}
                          >
                            {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </button>

                          <div>
                            <span className="font-ui font-bold text-sm sm:text-base text-deep-navy block">
                              {tech.title}
                            </span>
                            <p className="text-xs text-deep-navy/70 font-ui mt-0.5 leading-relaxed">
                              {tech.description}
                            </p>
                          </div>
                        </label>

                        {/* Nút Xem / Thu gọn */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => toggleTechnique(tech.id)}
                            className="text-xs font-semibold text-bright-magenta hover:text-bright-magenta font-ui flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-soft-pink/50 transition-colors cursor-pointer"
                          >
                            <span>{isDetailsOpen ? 'Thu gọn' : 'Xem'}</span>
                            {isDetailsOpen ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Technique Details (Collapsible) */}
                      {isDetailsOpen && (
                        <div className="mt-4 pt-4 border-t border-lavender-mist/60 space-y-3.5 font-ui animate-fadeIn">
                          {/* Ví dụ thực tế */}
                          <div className="p-3.5 rounded-2xl bg-white border border-lavender-mist/70 space-y-1.5">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-deep-navy/70 block">
                              Ví dụ:
                            </span>
                            <ul className="space-y-1 text-xs text-deep-navy/80">
                              {tech.examples.map((ex, exIdx) => (
                                <li key={exIdx} className="flex items-start gap-1.5">
                                  <span className="text-bright-magenta flex-shrink-0">•</span>
                                  <span>{ex}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Ô nhập "Cách tôi áp dụng" */}
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold uppercase tracking-wider text-deep-navy/60 block">
                              Cách tôi áp dụng:
                            </label>
                            <input
                              type="text"
                              value={noteText}
                              onChange={(e) => handleNoteChange(tech.id, e.target.value)}
                              placeholder={placeholder}
                              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-lavender-mist focus:border-bright-magenta outline-none text-xs sm:text-sm text-deep-navy font-ui transition-all shadow-xs"
                            />

                            {/* Lời nhắc nếu đã nhập text nhưng chưa tick chọn ô vuông */}
                            {noteText.trim() !== '' && !isChecked && (
                              <p className="text-[11px] text-[#D97706] font-ui flex items-center gap-1 font-medium mt-1">
                                <span>
                                  ⚠️ Đánh dấu ô vuông bên trái để kỹ thuật này hiện trên Boarding
                                  Pass.
                                </span>
                              </p>
                            )}
                          </div>

                          {/* Nút xem video reel của kỹ thuật */}
                          <div className="pt-1 flex justify-end">
                            <button
                              type="button"
                              onClick={() => handleOpenVideo(tech.videoUrl)}
                              className="inline-flex items-center gap-1.5 text-xs text-bright-magenta hover:text-bright-magenta font-semibold font-ui transition-colors group cursor-pointer"
                            >
                              <PlayCircle className="w-3.5 h-3.5" />
                              <span>Xem video hướng dẫn kỹ thuật này</span>
                              <ExternalLink className="w-3 h-3 text-deep-navy/70 group-hover:text-bright-magenta transition-colors" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onPrev}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-deep-navy/30 hover:border-deep-navy text-deep-navy text-sm font-ui font-semibold bg-white hover:bg-warm-ivory transition-all active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 rounded-full bg-bright-magenta hover:bg-bright-magenta text-white text-sm sm:text-base font-ui font-semibold shadow-soft hover:shadow-soft-md transition-all active:scale-95 group cursor-pointer"
        >
          <span>Tiếp · Habit Boarding Pass</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  )
}
