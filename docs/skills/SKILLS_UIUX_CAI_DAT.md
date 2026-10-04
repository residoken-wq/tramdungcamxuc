# Danh sách skill & MCP cho UI/UX – Trạm Dừng Cảm Xúc

Dành cho bộ đôi:

- **Antigravity + Gemini** → coder (viết code giao diện)
- **Claude extension** → BA Manager, Planning Manager, QA

> Nguyên tắc: **cài ít mà đúng.** Skill nào cũng tốn token và có thể tự kích hoạt chồng lên nhau. Chỉ cài ở cấp **workspace (trong repo)**, không cài global, để 2 agent dùng chung một bộ.

---

## 0. Chuẩn bị (làm 1 lần)

- [ ] Cài Node.js 20+ (để chạy `npx`)
- [ ] Mở terminal tại **thư mục gốc repo**
- [ ] Tạo nhánh git riêng trước khi cài: `git checkout -b chore/install-skills`

Cách cài chung cho mọi skill bên dưới: CLI `skills` sẽ hỏi cài cho agent nào → **chọn cả Antigravity và Claude Code**, phạm vi **Project**.

Thư mục skill (để kiểm tra sau khi cài):

| Agent       | Thư mục workspace                                                                   |
| ----------- | ----------------------------------------------------------------------------------- |
| Claude Code | `.claude/skills/`                                                                   |
| Antigravity | `.agent/skills/` (một số bản dùng `.agents/skills/` – xem Settings của Antigravity) |

Cài xong: **khởi động lại session** của cả 2 agent thì skill mới được nhận.

---

## 1. Bắt buộc – cài ngay

| ✓   | Skill                                    | Ai dùng         | Làm gì cho dự án                                                                              | Lệnh cài                                                                                       |
| --- | ---------------------------------------- | --------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| [ ] | **frontend-design** (Anthropic)          | Gemini          | Giao diện chỉn chu, typography và bố cục có chủ đích, tránh "giao diện AI mặc định"           | `npx skills add anthropics/skills@frontend-design`                                             |
| [ ] | **ui-ux-pro-max** (NextLevelBuilder)     | Gemini + Claude | Kho kiến thức UX: pattern component, phân cấp thị giác, màu, hướng dẫn UX cho web & mobile    | `npx skills add https://github.com/nextlevelbuilder/ui-ux-pro-max-skill --skill ui-ux-pro-max` |
| [ ] | **web-design-guidelines** (Vercel)       | Claude (QA)     | Soát UI theo bộ Web Interface Guidelines (thiết kế + accessibility), báo lỗi dạng `file:line` | `npx skills add vercel-labs/agent-skills@web-design-guidelines`                                |
| [ ] | **webapp-testing** (Anthropic)           | Claude (QA)     | Dùng Playwright mở web thật, chụp màn hình, kiểm tra luồng, bắt lỗi giao diện                 | `npx skills add anthropics/skills@webapp-testing`                                              |
| [ ] | **vercel-react-best-practices** (Vercel) | Gemini          | Quy tắc hiệu năng React/Next.js – giữ Lighthouse mobile ≥ 90 như AGENTS.md yêu cầu            | `npx skills add vercel-labs/agent-skills@vercel-react-best-practices`                          |

---

## 2. MCP server – cho agent "nhìn thấy" giao diện

Skill là kiến thức; MCP là công cụ. QA không thể duyệt UI nếu không mở được trình duyệt.

| ✓   | MCP                      | Ai dùng         | Làm gì                                                                    | Cài cho Claude Code                                                |
| --- | ------------------------ | --------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| [ ] | **Playwright MCP**       | Claude (QA)     | Điều khiển trình duyệt: bấm, điền form, chụp 375px / 768px / 1440px       | `claude mcp add playwright -- npx @playwright/mcp@latest`          |
| [ ] | **Chrome DevTools MCP**  | Claude (QA)     | Đọc console lỗi, network, đo hiệu năng                                    | `claude mcp add chrome-devtools -- npx chrome-devtools-mcp@latest` |
| [ ] | **Context7**             | Gemini + Claude | Lấy docs mới nhất của Payload CMS, Puck, Next.js → tránh code theo API cũ | `claude mcp add context7 -- npx -y @upstash/context7-mcp`          |
| [ ] | **Figma MCP** (tùy chọn) | Gemini          | Đọc thiết kế Figma nếu Hana/designer vẽ mockup                            | Bật Dev Mode MCP trong Figma desktop                               |

Với **Antigravity**: thêm các MCP trên qua **MCP Store** trong Antigravity hoặc file cấu hình MCP của nó, cùng lệnh `npx` như cột bên phải.

> Lệnh MCP thay đổi khá nhanh. Nếu lệnh báo lỗi, xem README chính thức của từng MCP trên GitHub.

---

## 3. Nên cài – khi bắt đầu Giai đoạn 1

| ✓   | Skill                                | Ai dùng     | Làm gì                                                                         | Lệnh cài                                                  |
| --- | ------------------------------------ | ----------- | ------------------------------------------------------------------------------ | --------------------------------------------------------- |
| [ ] | **design-md** (Google Labs – Stitch) | Claude (BA) | Phân tích dự án và sinh file `DESIGN.md` mô tả hệ thống thiết kế cho agent đọc | `npx skills add google-labs-code/stitch-skills@design-md` |
| [ ] | **theme-factory** (Anthropic)        | Gemini      | Áp một bộ theme (màu + font) nhất quán lên toàn bộ component                   | `npx skills add anthropics/skills@theme-factory`          |
| [ ] | **skill-creator** (Anthropic)        | Claude      | Để tạo skill brand riêng ở mục 4                                               | `npx skills add anthropics/skills@skill-creator`          |

---

## 4. Quan trọng nhất – skill brand riêng của Trạm Dừng Cảm Xúc

Các skill trên là kiến thức **chung**. `frontend-design` mặc định khuyến khích phong cách "táo bạo", có thể kéo giao diện lệch khỏi brand book (pastel, dịu dàng). Cần **một skill riêng** để thắng mọi skill chung:

- [ ] Tạo `tdcx-brand` gồm: 8 màu, 4 font theo vai trò, khoảng thở, quy tắc tiêu đề 2 tầng màu, visual assets, giọng văn, Do/Don't logo, danh sách khối Puck
- [ ] Đặt ở cả `.claude/skills/tdcx-brand/` và `.agent/skills/tdcx-brand/`
- [ ] Thêm vào đầu AGENTS.md dòng: _"Khi có xung đột giữa các skill thiết kế, `tdcx-brand` và Brand Book 2026 luôn thắng."_

---

## 5. Phân vai sau khi cài

| Vai              | Agent                | Skill / MCP chính                                                                    |
| ---------------- | -------------------- | ------------------------------------------------------------------------------------ |
| Coder UI         | Gemini (Antigravity) | tdcx-brand → frontend-design → ui-ux-pro-max → vercel-react-best-practices, Context7 |
| BA Manager       | Claude               | ui-ux-pro-max (đề xuất pattern), design-md                                           |
| Planning Manager | Claude               | skill-creator, Context7                                                              |
| QA               | Claude               | web-design-guidelines, webapp-testing, Playwright MCP, Chrome DevTools MCP           |

Quy trình QA giao diện mỗi task: Gemini code xong → Claude mở preview bằng Playwright ở 375 / 768 / 1440px → chạy `web-design-guidelines` → đối chiếu Brand Book → trả danh sách lỗi cho Gemini sửa.

---

## 6. KHÔNG nên làm

- Không cài cả bộ hàng trăm skill (`--all`, các "mega pack"): tốn token, skill tự kích hoạt lung tung.
- Không cài skill từ nguồn lạ mà chưa đọc `SKILL.md` và thư mục `scripts/` – skill có thể chạy lệnh trên máy.
- Không cài nhiều skill thiết kế chồng chéo (canvas-design, algorithmic-art…) – không cần cho dự án này.

---

## 7. Kiểm tra sau khi cài

- [ ] Hỏi Gemini: _"Bạn đang có những skill nào?"_ → thấy đủ skill mục 1
- [ ] Hỏi Claude: _"Liệt kê skill và MCP bạn đang dùng được"_ → thấy skill + Playwright, Chrome DevTools, Context7
- [ ] Nhờ Claude chụp trang `/styleguide` ở 375px → xác nhận Playwright chạy được
- [ ] Commit `.claude/skills/`, `.agent/skills/` vào repo để lần sau không phải cài lại
