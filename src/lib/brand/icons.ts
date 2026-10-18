// Brand icon keys selectable in the CMS. SVG drawings live with the components that render
// them (SM-03); the CMS only stores the key, so icons can be redrawn without data changes.
export const BRAND_ICONS = [
  { value: 'target', label: 'Hồng tâm' },
  { value: 'layers', label: 'Các lớp' },
  { value: 'star', label: 'Ngôi sao' },
  { value: 'heart', label: 'Trái tim' },
  { value: 'butterfly', label: 'Bướm' },
  { value: 'leaf', label: 'Lá' },
  { value: 'valve', label: 'Van' },
  { value: 'compass', label: 'La bàn' },
  { value: 'mask', label: 'Mặt nạ' },
  { value: 'signpost', label: 'Biển chỉ đường' },
  { value: 'team', label: 'Đội nhóm' },
  { value: 'chat', label: 'Trò chuyện' },
  { value: 'book', label: 'Sách' },
  { value: 'spark', label: 'Tia sáng' },
  { value: 'shield', label: 'Khiên' },
  { value: 'mirror', label: 'Tấm gương' },
] as const

export type BrandIcon = (typeof BRAND_ICONS)[number]['value']

export const brandIconOptions: [string, string][] = BRAND_ICONS.map(({ value, label }) => [
  value,
  label,
])
