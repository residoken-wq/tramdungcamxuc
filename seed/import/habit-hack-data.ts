// Real Habit Hack content from Hana's workbook
// docs/sources/CÔNG CỤ XÂY THÓI QUEN _ Habit Hack - Trạm dừng cảm xúc.xlsx (received 08/10/2026).
// Text is copied verbatim; do not reword here – Hana edits it in the CMS afterwards.

export type Stage = 'cue' | 'craving' | 'response' | 'reward'

// Sheet "Khảo sát trì hoãn": column A (statement), B (stage), C (suggestion).
export const diagnosticQuestions: { statement: string; stage: Stage; suggestion: string }[] = [
  {
    statement: 'Tôi cảm thấy công việc quá nặng nề nên để qua ngày hôm sau.',
    stage: 'cue',
    suggestion:
      'Chia nhỏ công việc: Bắt đầu với các bước nhỏ dễ thực hiện để giảm cảm giác quá tải. Giảm áp lực bằng cách đặt ra một phần việc nhỏ nhất để bắt đầu, ví dụ: dành 5 phút để làm nhiệm vụ.',
  },
  {
    statement: 'Khi không có tâm trạng, tôi trì hoãn làm những việc quan trọng.',
    stage: 'craving',
    suggestion:
      'Tăng tính hấp dẫn của nhiệm vụ: Ghép công việc với một hoạt động bạn thích, như nghe nhạc nhẹ khi làm việc. Tập trung vào lợi ích lâu dài mà nhiệm vụ mang lại để tăng động lực.',
  },
  {
    statement: 'Tôi trì hoãn vì sợ kết quả cuối cùng không đạt như mong đợi.',
    stage: 'craving',
    suggestion:
      'Thay đổi tư duy: Nhắc nhở rằng tiến bộ nhỏ còn hơn không có gì. Chấp nhận rằng không phải mọi việc đều hoàn hảo, và tập trung vào quá trình hơn là kết quả.',
  },
  {
    statement: 'Tôi ngại làm những công việc đòi hỏi sự sáng tạo hoặc suy nghĩ quá nhiều.',
    stage: 'response',
    suggestion:
      'Bắt đầu với bước đơn giản: Thực hiện một hành động dễ như viết xuống ý tưởng đầu tiên để phá vỡ rào cản. Đặt mục tiêu nhỏ và không tạo áp lực phải làm hoàn hảo ngay từ đầu.',
  },
  {
    statement: 'Tôi dễ bị phân tâm bởi các hoạt động không liên quan khi đang làm việc.',
    stage: 'cue',
    suggestion:
      'Invisible: Loại bỏ các yếu tố xao nhãng như điện thoại hoặc thông báo không cần thiết. Sắp xếp không gian làm việc yên tĩnh để giảm thiểu các yếu tố gây mất tập trung.',
  },
  {
    statement: 'Tôi dành quá nhiều thời gian cho mạng xã hội thay vì hoàn thành công việc.',
    stage: 'reward',
    suggestion:
      'Unsatisfying: Đặt giới hạn thời gian cho mạng xã hội hoặc tự thưởng chỉ sau khi hoàn thành công việc.',
  },
  {
    statement:
      'Khi làm việc, tôi dễ bị kéo đi bởi các yếu tố bên ngoài như điện thoại hoặc tiếng ồn.',
    stage: 'cue',
    suggestion:
      'Giảm thiểu tín hiệu gây xao nhãng: Tắt thông báo điện thoại, sử dụng tai nghe chống ồn hoặc tạo một không gian yên tĩnh riêng để tập trung hơn.',
  },
  {
    statement:
      'Tôi thường bị cuốn vào những việc nhỏ nhặt, ít quan trọng thay vì tập trung vào việc lớn cần hoàn thành.',
    stage: 'response',
    suggestion:
      'Ưu tiên công việc: Lập danh sách ưu tiên theo mức độ quan trọng. Dành thời gian đầu ngày cho các nhiệm vụ lớn và chỉ làm việc nhỏ khi đã hoàn thành việc chính.',
  },
  {
    statement: 'Tôi thường trì hoãn công việc chỉ vì không cảm thấy hứng thú với nó.',
    stage: 'craving',
    suggestion:
      'Unattractive: Liên kết nhiệm vụ với lợi ích lâu dài hoặc tự đặt phần thưởng nhỏ sau khi hoàn thành. Tự tạo hứng thú bằng cách xem nhiệm vụ như một thử thách.',
  },
  {
    statement: 'Tôi thấy khó bắt đầu những nhiệm vụ không hấp dẫn hoặc nhàm chán.',
    stage: 'response',
    suggestion:
      'Habit Stacking: Ghép nhiệm vụ với một thói quen hiện có, ví dụ: “Sau khi uống cà phê, tôi sẽ dành 10 phút cho nhiệm vụ.”',
  },
  {
    statement: 'Khi không có người giám sát, tôi dễ bỏ qua công việc hoặc trì hoãn lại.',
    stage: 'cue',
    suggestion:
      'Tạo lịch tự giám sát: Sử dụng danh sách kiểm tra hàng ngày hoặc công cụ theo dõi để tự giám sát và giữ cam kết với bản thân.',
  },
  {
    statement: 'Tôi thấy khó duy trì năng lượng để hoàn thành một nhiệm vụ kéo dài.',
    stage: 'response',
    suggestion:
      'Chia nhỏ nhiệm vụ: Chia công việc lớn thành từng phần nhỏ và tự thưởng ngắn sau mỗi phần hoàn thành để duy trì năng lượng.',
  },
  {
    statement: 'Tôi thường để lại công việc cho đến phút cuối cùng.',
    stage: 'reward',
    suggestion:
      'Unsatisfying: Tự đặt hậu quả nếu trì hoãn như phải làm việc thêm giờ. Đặt lịch hoàn thành sớm hơn để tránh dồn vào phút cuối.',
  },
  {
    statement: 'Tôi không lập kế hoạch rõ ràng nên thường bị quá tải và trì hoãn công việc.',
    stage: 'cue',
    suggestion:
      'Lập kế hoạch cụ thể: Xác định rõ các bước cần làm và thời gian hoàn thành cho mỗi nhiệm vụ để tránh cảm giác quá tải và trì hoãn.',
  },
  {
    statement: 'Khi có quá nhiều việc, tôi không biết nên bắt đầu từ đâu và thường để lại cho sau.',
    stage: 'response',
    suggestion:
      'Difficult: Sắp xếp thứ tự ưu tiên và chỉ tập trung vào một nhiệm vụ tại một thời điểm. Sử dụng kỹ thuật Pomodoro để chia thời gian cho từng nhiệm vụ.',
  },
  {
    statement:
      'Tôi thường làm việc không theo thứ tự ưu tiên, dẫn đến việc quan trọng bị trì hoãn.',
    stage: 'cue',
    suggestion:
      'Lập kế hoạch ưu tiên: Tạo danh sách công việc theo thứ tự ưu tiên và hoàn thành những việc quan trọng trước.',
  },
]

type Lesson = { title: string; stage: Stage | 'none'; technique?: Technique }
type Technique = { name: string; howTo?: string; example?: string }
type Module = { title: string; group: 'insight' | 'principle' | 'technique'; lessons: Lesson[] }

// Sheet "Video siêu ngắn…": column A is the module, column B the video title (20 videos).
// Technique names are the video titles before the colon, in sentence case; howTo is the text
// after the colon; example comes from sheet "VÍ DỤ MẪU", column I, where Hana gave one.
const technique = (
  stage: Stage,
  title: string,
  name: string,
  howTo?: string,
  example?: string,
): Lesson => ({
  title,
  stage,
  technique: { name, howTo, example },
})

export const courseModules: Module[] = [
  {
    title: 'Insight về thói quen',
    group: 'insight',
    lessons: [
      'Insight 1: Vì sao bạn nên áp dụng Atomic Habit để xây thói quen?',
      'Insight 2: Mindset quan trọng nhất mà bạn cần có để xây thói quen bền vững',
      'Insight 3: Điều bạn cần làm trước khi bắt tay vào tạo thói quen',
      'Insight 4: Giai đoạn mà chắc chắc bạn sẽ đi qua khi xây thói quen mới',
    ].map((title) => ({ title, stage: 'none' as const })),
  },
  {
    title: 'Vòng lặp thói quen',
    group: 'principle',
    lessons: [{ title: 'HABIT LOOP: 4 giai đoạn luôn xảy ra với thói quen', stage: 'none' }],
  },
  {
    title: 'Nguyên tắc tạo thói quen',
    group: 'principle',
    lessons: [
      {
        title: 'Nguyên tắc 1: Make It Obvious | Làm cho thói quen có TÍN HIỆU rõ ràng',
        stage: 'cue',
      },
      {
        title:
          'Nguyên tắc 2: Make It Attractive | Làm cho thói quen có KHAO KHÁT đủ thu hút với bạn',
        stage: 'craving',
      },
      {
        title: 'Nguyên tắc 3: Make It Easy | Làm cho thói quen dễ dàng PHẢN HỒI nhất có thể',
        stage: 'response',
      },
      {
        title: 'Nguyên tắc 4: Make It Satisfied | Làm cho thói quen được ghi nhận bằng PHẦN THƯỞNG',
        stage: 'reward',
      },
    ],
  },
  {
    title: 'Kỹ thuật tạo Tín hiệu rõ ràng',
    group: 'technique',
    lessons: [
      technique(
        'cue',
        'SOI LẠI NHỊP SINH HỌC: Gắn thói quen mới vào đúng thời điểm',
        'Soi lại nhịp sinh học',
        'Gắn thói quen mới vào đúng thời điểm',
        'Nhận diện Rửa bình, pha nước là "đòn bẩy"',
      ),
      technique(
        'cue',
        'GHÉP THÓI QUEN MỚI: Gắn "cũ" cùng với "mới" để tạo tín hiệu',
        'Ghép thói quen mới',
        'Gắn "cũ" cùng với "mới" để tạo tín hiệu',
        'Đọc sách + Rửa bình, Pha nước',
      ),
      technique(
        'cue',
        'HẸN THÓI QUEN CỤ THỂ: Khi nào - ở đâu - với ai',
        'Hẹn thói quen cụ thể',
        'Khi nào - ở đâu - với ai',
      ),
    ],
  },
  {
    title: 'Kỹ thuật tạo Khao khát thu hút',
    group: 'technique',
    lessons: [
      technique(
        'craving',
        'MÔI TRƯỜNG ẢNH HƯỞNG: Cái gì giữ thì ở gần, cái gì bỏ thì ở xa',
        'Môi trường ảnh hưởng',
        'Cái gì giữ thì ở gần, cái gì bỏ thì ở xa',
      ),
      technique(
        'craving',
        'NGHI THỨC TẠO ĐỘNG LỰC: Tạo nhịp dạo đầu cho thói quen',
        'Nghi thức tạo động lực',
        'Tạo nhịp dạo đầu cho thói quen',
        'Mở Timer rồi mới đọc',
      ),
      technique(
        'craving',
        'BỘ ĐÔI THÓI QUEN: Thực hiện thói quen cùng với 1 điều mình thích',
        'Bộ đôi thói quen',
        'Thực hiện thói quen cùng với 1 điều mình thích',
      ),
    ],
  },
  {
    title: 'Kỹ thuật tạo Phản hồi dễ dàng',
    group: 'technique',
    lessons: [
      technique(
        'response',
        'QUY TẮC 2 PHÚT: Bắt đầu bằng bước nhỏ đến mức không thể từ chối',
        'Quy tắc 2 phút',
        'Bắt đầu bằng bước nhỏ đến mức không thể từ chối',
        'Bắt đầu = 5 phút/ ngày',
      ),
      technique(
        'response',
        'TỰ ĐỘNG HÓA CAM KẾT: Một quyết định tác động đến 1 chuỗi thói quen',
        'Tự động hóa cam kết',
        'Một quyết định tác động đến 1 chuỗi thói quen',
      ),
    ],
  },
  {
    title: 'Kỹ thuật tạo Phần thưởng ghi nhận',
    group: 'technique',
    lessons: [
      technique(
        'reward',
        'CHỌN PHẦN THƯỞNG THEO GU: Hãy biết "ngôn ngữ" ghi nhận của bản là gì',
        'Chọn phần thưởng theo gu',
        'Hãy biết "ngôn ngữ" ghi nhận của bản là gì',
      ),
      technique(
        'reward',
        'GHI NHẬN MÌNH MỖI LẦN THỰC HIỆN',
        'Ghi nhận mình mỗi lần thực hiện',
        undefined,
        'Thực hiện xong thì tick the box',
      ),
      technique(
        'reward',
        'ĐÔI BẠN CÙNG TIẾN',
        'Đôi bạn cùng tiến',
        undefined,
        'Chia sẻ cho người bạn cùng tiến',
      ),
    ],
  },
]
