/**
 * DP-01d: Pure functions and target data for patching techniques & habit journey content from DIGITAL PRODUCT.zip.
 * Idempotent, safe dry-run diffing, preserves untouched fields and user customizations.
 */

export interface PatchTechnique {
  order: number
  name: string
  stage: 'cue' | 'craving' | 'response' | 'reward'
  description: string
  examples: { text: string }[]
  applyTemplate: string
  exampleVideoUrl: string
}

export const ZIP_11_TECHNIQUES: PatchTechnique[] = [
  // 1. Cue
  {
    order: 1,
    name: 'Soi lại nhịp sinh học',
    stage: 'cue',
    description: 'Gắn thói quen mới vào đúng thời điểm bạn còn năng lượng, thay vì lúc đã cạn.',
    examples: [
      { text: 'Nhận ra mình tỉnh táo nhất lúc 6h30, đặt việc quan trọng vào đó thay vì 10h tối khi đã cạn' },
      { text: 'Thấy mình hay trống 15 phút lúc chờ cơm trưa, dùng đúng khoảng đó cho thói quen mới' },
    ],
    applyTemplate: 'Thói quen của tôi sẽ rơi vào khoảng {gio}, lúc tôi còn năng lượng.',
    exampleVideoUrl: 'https://www.facebook.com/reel/1346424584229031',
  },
  {
    order: 2,
    name: 'Ghép thói quen mới',
    stage: 'cue',
    description:
      'Gắn việc mới vào ngay sau một việc bạn đã làm ổn định. Việc cũ chính là Mentor, và nó trở thành tín hiệu cho việc mới.',
    examples: [
      { text: 'Sau khi pha cà phê sáng, tôi đọc 1 trang sách' },
      { text: 'Sau khi đóng laptop cuối ngày, tôi viết 3 dòng nháp' },
    ],
    applyTemplate: 'Sau khi {mentor}, tôi sẽ {thoi_quen}.',
    exampleVideoUrl: 'https://www.facebook.com/reel/2074993686432772',
  },
  {
    order: 3,
    name: 'Hẹn thói quen cụ thể',
    stage: 'cue',
    description: 'Khi nào, ở đâu, với ai. Một lời hẹn mơ hồ là một lời hẹn sẽ bị hoãn.',
    examples: [
      { text: 'Thứ Hai, Tư, Sáu lúc 6h, ở công viên gần nhà, tôi chạy bộ 10 phút' },
      { text: 'Mỗi tối 21h, ở bàn làm việc, tôi viết 3 dòng nháp' },
    ],
    applyTemplate: 'Tôi sẽ [hành động] vào [thời gian] tại [địa điểm].',
    exampleVideoUrl: 'https://www.facebook.com/reel/1397759535662307',
  },
  // 2. Craving
  {
    order: 4,
    name: 'Môi trường ảnh hưởng',
    stage: 'craving',
    description:
      'Cái gì muốn giữ thì để gần, cái gì muốn bỏ thì để xa. Môi trường làm thay phần lớn việc của ý chí.',
    examples: [
      { text: 'Để sách ngay trên gối, để điện thoại sạc ngoài phòng ngủ' },
      { text: 'Đặt giày chạy ngay cửa, đẩy app mạng xã hội ra khỏi màn hình chính' },
    ],
    applyTemplate: 'Tôi sẽ thay đổi không gian bằng cách…',
    exampleVideoUrl: 'https://www.facebook.com/reel/4513469222272397',
  },
  {
    order: 5,
    name: 'Nghi thức tạo động lực',
    stage: 'craving',
    description:
      'Một hành động dạo đầu dễ chịu, lặp lại mỗi lần, giúp bạn vào việc mà không phải tranh luận với chính mình.',
    examples: [
      { text: 'Mở đúng một playlist 10 phút rồi mới bắt đầu; hết nhạc là xong phiên' },
      { text: 'Rót một tách trà, bật đèn bàn, hít thở ba lần rồi mới vào việc' },
    ],
    applyTemplate: 'Trước khi bắt đầu, tôi sẽ…',
    exampleVideoUrl: 'https://www.facebook.com/reel/4682982545357599',
  },
  {
    order: 6,
    name: 'Bộ đôi thói quen',
    stage: 'craving',
    description:
      'Ghép việc cần làm với một điều bạn thật sự thích, và chỉ cho phép mình điều đó khi đang làm việc kia.',
    examples: [
      { text: 'Chỉ nghe podcast yêu thích khi đang đi bộ' },
      { text: 'Chỉ uống ly cà phê ngon của ngày khi đang ngồi viết' },
    ],
    applyTemplate: 'Tôi chỉ [điều tôi thích] khi đang [việc cần làm].',
    exampleVideoUrl: 'https://www.facebook.com/reel/1962615811412992',
  },
  // 3. Response
  {
    order: 7,
    name: 'Quy tắc 2 phút',
    stage: 'response',
    description:
      'Phiên bản mở đầu phải nhỏ đến mức không thể từ chối. Mục tiêu của hai phút đầu là xuất hiện, không phải hoàn thành.',
    examples: [
      { text: 'Đọc sách → chỉ cần mở sách và đọc 1 trang' },
      { text: 'Tập thể dục → chỉ cần mặc đồ tập và ra khỏi cửa' },
    ],
    applyTemplate: 'Phiên bản hai phút của tôi là…',
    exampleVideoUrl: 'https://www.facebook.com/reel/2178394586406770',
  },
  {
    order: 8,
    name: 'Tự động hóa cam kết',
    stage: 'response',
    description: 'Một quyết định làm một lần, loại bỏ hàng chục quyết định sau đó.',
    examples: [
      { text: 'Đăng ký lớp tập trả trước một tháng, để chỉ phải quyết định một lần' },
      { text: 'Tối Chủ nhật hẹn giờ sẵn ba bài viết cho cả tuần' },
    ],
    applyTemplate: 'Việc tôi làm một lần để khỏi phải quyết định lại là…',
    exampleVideoUrl: 'https://www.facebook.com/reel/1985523752130697',
  },
  // 4. Reward
  {
    order: 9,
    name: 'Chọn phần thưởng theo gu',
    stage: 'reward',
    description:
      'Phần thưởng chỉ có tác dụng khi đúng ngôn ngữ ghi nhận của bạn. Có người cần một món ngon, có người cần một lời khen, có người cần nửa giờ yên tĩnh.',
    examples: [
      { text: 'Làm xong thì tự cho phép mình nửa giờ đọc truyện không làm gì khác' },
      { text: 'Làm xong thì nhắn cho một người bạn: mình vừa làm được rồi đó' },
    ],
    applyTemplate: 'Ngay sau khi làm xong, tôi sẽ tự thưởng…',
    exampleVideoUrl: 'https://www.facebook.com/reel/1348980047032173',
  },
  {
    order: 10,
    name: 'Ghi nhận mình mỗi lần thực hiện',
    stage: 'reward',
    description:
      'Kết quả thật thường đến muộn. Bạn phải tự trả thưởng cho mình ngay lúc vừa làm xong, trước khi đi tìm kết quả.',
    examples: [
      { text: 'Tick ô trên tracker ngay khi vừa làm xong' },
      { text: 'Viết một dòng cho mình: hôm nay mình đã giữ lời' },
    ],
    applyTemplate: 'Ngay khi làm xong, tôi sẽ…',
    exampleVideoUrl: 'https://www.facebook.com/reel/1106447762337619',
  },
  {
    order: 11,
    name: 'Đôi bạn cùng tiến',
    stage: 'reward',
    description: 'Trách nhiệm với một người cụ thể giữ bạn lại đúng lúc bạn muốn buông.',
    examples: [
      { text: 'Tối Chủ nhật gửi ảnh chụp tracker cho một người bạn' },
      { text: 'Rủ một người cùng chạy 28 ngày, mỗi tuần kể nhau nghe một lần' },
    ],
    applyTemplate: 'Tôi sẽ rủ [tên] và hẹn nhau…',
    exampleVideoUrl: 'https://www.facebook.com/reel/1108792161728354',
  },
]

export const ZIP_4_LAWS = [
  {
    stage: 'cue',
    lawChip: '1 · MAKE IT OBVIOUS',
    title: 'Tín hiệu đủ rõ ràng',
    subLabel: 'Cue · Tín hiệu',
    question: 'Điều gì sẽ nhắc bạn bắt đầu? Lúc nào, ở đâu, sau việc gì?',
    videoUrl:
      'https://www.facebook.com/61577262321239/videos/a.122201322500908744/1692428401853478',
  },
  {
    stage: 'craving',
    lawChip: '2 · MAKE IT ATTRACTIVE',
    title: 'Khao khát thực hiện đủ lớn',
    subLabel: 'Craving · Khao khát',
    question: 'Làm sao để bạn mong chờ việc này thay vì né nó?',
    videoUrl:
      'https://www.facebook.com/61577262321239/videos/a.122201322500908744/1563757661881940',
  },
  {
    stage: 'response',
    lawChip: '3 · MAKE IT EASY',
    title: 'Phản hồi đủ dễ dàng',
    subLabel: 'Response · Phản hồi',
    question: 'Phiên bản nhỏ nhất của việc này là gì?',
    videoUrl: 'https://www.facebook.com/reel/1980547615969349',
  },
  {
    stage: 'reward',
    lawChip: '4 · MAKE IT SATISFYING',
    title: 'Phần thưởng đủ khích lệ ngay',
    subLabel: 'Reward · Phần thưởng',
    question: 'Ngay sau khi làm xong, bạn ghi nhận mình thế nào?',
    videoUrl: 'https://www.facebook.com/reel/1064718299619776',
  },
]

export const ZIP_CUE_BOX = {
  boldText: 'Quy tắc này cần đủ cả 3 kỹ thuật.',
  text: 'Tín hiệu chỉ thật sự rõ khi có đủ thời điểm hợp năng lượng, việc cũ làm điểm tựa và lời hẹn cụ thể. Hai kỹ thuật đầu lấy từ bước Tìm Mentor:',
  buttonLabel: 'Xem lại bước 3 →',
}

// 8 câu hỏi khảo sát bước 1 nguyên văn từ constants.ts của zip
export const ZIP_8_DIAGNOSE_QUESTIONS = [
  {
    statement: 'Tôi không có giờ cố định cho thói quen mới, cứ lúc nào rảnh thì làm.',
    stage: 'cue' as const,
  },
  {
    statement: 'Có hôm đến tối muộn tôi mới sực nhớ ra là hôm nay mình định làm.',
    stage: 'cue' as const,
  },
  {
    statement: 'Tôi biết việc này tốt cho mình, nhưng cứ nghĩ đến là thấy ngại bắt đầu.',
    stage: 'craving' as const,
  },
  {
    statement: 'Tôi lo người khác sẽ nhìn mình thế nào khi thấy mình làm việc này.',
    stage: 'craving' as const,
  },
  {
    statement: 'Mỗi lần làm, tôi phải chuẩn bị quá nhiều thứ trước khi bắt đầu được.',
    stage: 'response' as const,
  },
  {
    statement: 'Tôi chờ đến khi có đủ thời gian hoặc đủ hứng mới chịu làm.',
    stage: 'response' as const,
  },
  {
    statement: 'Làm được mấy hôm mà chưa thấy kết quả là tôi mất hứng.',
    stage: 'reward' as const,
  },
  {
    statement: 'Tôi không nhớ nổi tuần vừa rồi mình đã làm được bao nhiêu lần.',
    stage: 'reward' as const,
  },
]
