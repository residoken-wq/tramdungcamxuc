---
name: tdcx-brand
description: Brand rules for Trạm Dừng Cảm Xúc (Brand Book 2026) – the 8 colors, fonts by role, spacing, two-tone headings, visual assets, logo rules, voice, and the Puck block library. Use for ANY UI work in this repo (pages, components, Puck blocks, emails, share images, styleguide) and for UI review/QA. Overrides frontend-design, ui-ux-pro-max, theme-factory and any other general design skill whenever they conflict.
---

# tdcx-brand – Brand system of Trạm Dừng Cảm Xúc

**Priority rule:** when this skill, `AGENTS.md` or Brand Book 2026 conflicts with a general design skill (`frontend-design`, `ui-ux-pro-max`, `theme-factory`, …), **this skill wins**. Use the general skills only for things this skill does not decide (accessibility details, interaction patterns, performance, layout craft).

Source of truth: `AGENTS.md` §5, §5B, §14 and Brand Book 2026 (`docs/sources/`, if present). If something here disagrees with `AGENTS.md`, `AGENTS.md` wins – flag the mismatch.

## 1. Colors – only these 8

| Token | Hex | Use |
| --- | --- | --- |
| `deep-navy` | `#280A60` | Main headings, strong text, dark backgrounds |
| `bright-magenta` | `#BC039E` | Second line of headings, accents |
| `accent-pink` | `#EF3B83` | Primary CTA, hearts, links |
| `soft-pink` | `#FDE6F6` | Card backgrounds, badges |
| `lavender-mist` | `#E9DDF9` | Section backgrounds, secondary cards |
| `mint-haze` | `#D9F1EA` | Success states, tracker |
| `butter-cream` | `#F6E9B8` | Highlights, reminders |
| `warm-ivory` | `#FAF7F4` | Page background |

- Plus only `white`, `transparent`, `currentColor`, and opacity variants of the 8 tokens.
- Always reference tokens (Tailwind theme / CSS variables), **never raw hex in components**.
- Page backgrounds: light pastel gradient purple → pink → beige → white. Keep it subtle.
- Never introduce a new hue (no grey-blue, terracotta, acid green, Tailwind defaults like `red-500`).
- Contrast: body text on light backgrounds = `deep-navy`. Check WCAG AA for every text/background pair; `accent-pink` and `bright-magenta` on pastel backgrounds may fail for small text – use them for large text, buttons with white text (check), or icons.

## 2. Typography – fixed by role, do not choose fonts

| Role | Font |
| --- | --- |
| H1, H2 | **Anton** |
| Series labels, subheadings, buttons, UI | **Montserrat** SemiBold / Bold |
| Quotes, emotional lines | **Playfair Display Italic** |
| Body | Montserrat Regular (or Inter Regular) |

- Load via `next/font/google` with subset `vietnamese`. Verify Vietnamese diacritics render correctly in Anton (Ữ, Ộ, Ặ, Ỷ).
- Do not add other typefaces, monospace labels, or a "more distinctive" pairing.
- Body ≥ 16px, line-height ~1.5, line length < 80 characters.

## 3. Signature heading pattern (required, not a cliché here)

`SectionHeader` = series label (Montserrat) → heading **line 1 in `deep-navy`, line 2 in `bright-magenta`** (Anton) → emotional line (Playfair Display Italic).
This two-tone heading is the brand's identity. Ignore general advice to "avoid coloring part of a headline".

## 4. Spacing ("khoảng thở") and shape

- Header → heading: 16–24px · heading → emotional line: 12–16px · emotional line → image: 24–32px · outer margin ≥ 24px.
- Large card radius 16–24px, thin borders, very soft shadow. Generous whitespace.
- Mobile-first; every page must look right at **375px** and **1440px** (also check 768px).
- Social share images: 1080×1350 (4:5) and 1080×1920 (9:16).

## 5. Visual assets

Heart line, thin rules, valve, butterfly, leaf motifs – SVG components in `src/components/brand/`. Use sparingly as accents. Never crop images out of infographics; original assets live in `public/brand/`.

## 6. Logo

- Never recolor, rotate, stretch, add effects, or place on busy backgrounds.
- Minimum width 120px.
- Use light / dark / monochrome versions from `public/brand/` as appropriate to the background.

## 7. Voice and copy

- UI language: **Vietnamese with diacritics**. Display name always **Trạm Dừng Cảm Xúc**; `TRAM DUNG CAM XUC` (no diacritics) only for domain, bank transfer content, email sender, order codes.
- Tone: warm, calm, gentle, encouraging, never pushy or fear-based. UI principles: **Clarity, Warmth, Whitespace, Emotional Trust**.
  - Example tracker copy: "Lỡ nhịp 1 ngày là không sao cả", "Ngày hôm nay, bạn đã bỏ phiếu cho con người bạn muốn trở thành?"
- **Do not write marketing copy, prices, testimonials, statistics or credentials.** All content comes from the CMS. Only fixed UI labels live in `src/lib/i18n/vi.ts`. Placeholder content must be marked `[MẪU]`.
- Motion: calm and purposeful (e.g. a gentle card flip); always respect `prefers-reduced-motion`.

## 8. Puck page builder guardrails

- Color fields = dropdown of the 8 tokens only. No color picker, no font choice, no free CSS input.
- Spacing / radius / font size = preset levels (S / M / L; Spacer 16/24/32/48/64).
- Every block renders through the same component in `src/components/` as coded pages.
- Images come from Payload `media` with required `alt`.
- Data blocks (products, packages, testimonials) store IDs only and read prices/names from Payload.
- Block catalogue (by sidebar group): Mở đầu – `HeroTwoEntries`, `HeroImage`, `SectionHeader` · Nội dung – `RichText`, `ImageText`, `QuoteBlock`, `StatsBar`, `JourneySteps`, `FAQ`, `VideoEmbed` · Bố cục – `Columns`, `Spacer`, `Divider` · Bán hàng – `ProductGrid`, `ProductFeature`, `PackageComparison`, `PriceTag`, `TrialCTA` · Niềm tin – `TestimonialSlider`, `TestimonialGrid`, `LogoStrip`, `HanaStory` · Chuyển đổi – `CTAButton`, `LeadForm`, `BookingCTA`, `B2BBriefForm`, `QuizCTA`, `ShopeeButton`, `ZaloButton`, `LibraryPreview`.

## 9. Do / Don't checklist (use for build and for QA)

Do
- [ ] Only the 8 tokens; no raw hex in components
- [ ] Anton / Montserrat / Playfair Italic in their roles; Vietnamese diacritics correct
- [ ] Two-tone heading navy → magenta on section headers
- [ ] Breathing space per §4; looks right at 375 / 768 / 1440
- [ ] Contrast AA, visible focus ring, keyboard navigable, touch targets ≥ 44px
- [ ] Loading / empty / error states, written warmly in Vietnamese

Don't
- [ ] Dark "bold" themes, neon accents, brutalist/newspaper layouts, heavy shadows
- [ ] New fonts or colors "to be distinctive"
- [ ] Hardcoded copy, prices, testimonials, images
- [ ] Emotion/reflection data in analytics, certificates or public pages
- [ ] Altered logo
