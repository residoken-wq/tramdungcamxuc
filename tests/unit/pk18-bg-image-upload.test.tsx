import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { MediaPickerField } from '@/puck/editor/MediaPickerField'
import { createMediaExternalField } from '@/puck/media-field'
import { blockStyleCss } from '@/puck/style/style-css'
import { containerCss } from '@/puck/style/container-css'
import { sanitizeBlockStyle } from '@/puck/style/style-schema'
import { sanitizeContainer } from '@/puck/style/container-schema'
import { cleanDesignSystem, DEFAULT_DESIGN_SYSTEM } from '@/lib/design/design-system'

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: async () => body,
  } as Response
}

const fetchMock = vi.fn()

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('MediaPickerField (PK-18)', () => {
  test('mở hộp: thấy ô tìm kiếm, nút "Tìm kiếm", nút "Tải ảnh lên" cùng một hàng', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ docs: [], hasNextPage: false }))

    render(<MediaPickerField onChange={vi.fn()} />)

    // Trigger open button
    const openBtn = screen.getByRole('button', { name: /Chọn ảnh/i })
    fireEvent.click(openBtn)

    // Check modal role="dialog"
    const dialog = screen.getByRole('dialog')
    expect(dialog).toBeTruthy()

    // Top row items
    expect(screen.getByPlaceholderText(/Tìm theo mô tả/i)).toBeTruthy()
    expect(screen.getByRole('button', { name: /^Tìm kiếm$/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Tải ảnh lên/i })).toBeTruthy()
  })

  test('chọn dòng thì onChange("12")', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        docs: [
          { id: '12', alt: 'Ảnh mẫu 12', filename: 'mau12.jpg', url: '/api/media/file/mau12.jpg' },
        ],
        hasNextPage: false,
      }),
    )

    const onChange = vi.fn()
    render(<MediaPickerField onChange={onChange} />)

    fireEvent.click(screen.getByRole('button', { name: /Chọn ảnh/i }))

    // Wait for row
    const rowText = await screen.findByText('Ảnh mẫu 12')
    expect(rowText).toBeTruthy()

    // Click row
    fireEvent.click(rowText)
    expect(onChange).toHaveBeenCalledWith('12')
    // Modal closes
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  test('tải file .pdf thì báo lỗi, không gọi fetch upload', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ docs: [], hasNextPage: false }))

    render(<MediaPickerField onChange={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /Chọn ảnh/i }))

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    expect(fileInput).toBeTruthy()

    const pdfFile = new File(['dummy pdf'], 'document.pdf', { type: 'application/pdf' })
    fireEvent.change(fileInput, { target: { files: [pdfFile] } })

    expect(screen.getByText(/Chỉ chấp nhận file ảnh \(JPEG, PNG, WebP, AVIF\)/i)).toBeTruthy()
    // No POST /api/media
    expect(fetchMock).not.toHaveBeenCalledWith('/api/media', expect.anything())
  })

  test('tải lên với alt rỗng thì nút tải bị khoá', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ docs: [], hasNextPage: false }))

    render(<MediaPickerField onChange={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /Chọn ảnh/i }))

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const imgFile = new File(['dummy img'], 'hero.png', { type: 'image/png' })
    fireEvent.change(fileInput, { target: { files: [imgFile] } })

    // Prompt shows input with pre-filled filename 'hero'
    const altInput = screen.getByPlaceholderText(/Nhập mô tả hình ảnh/i) as HTMLInputElement
    expect(altInput.value).toBe('hero')

    // Empty the alt
    fireEvent.change(altInput, { target: { value: '   ' } })

    const uploadBtn = screen.getByRole('button', { name: /Tải lên & chọn/i })
    expect((uploadBtn as HTMLButtonElement).disabled).toBe(true)
  })

  test('tải thành công: onChange với id mới, request multipart có _payload chứa alt', async () => {
    fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
      if (typeof url === 'string' && url.startsWith('/api/media?')) {
        return jsonResponse({ docs: [], hasNextPage: false })
      }
      if (url === '/api/media' && init?.method === 'POST') {
        return jsonResponse({
          doc: { id: '99', alt: 'Ảnh thiên nhiên', url: '/api/media/file/nature.png' },
        })
      }
      return jsonResponse({}, false, 404)
    })

    const onChange = vi.fn()
    render(<MediaPickerField onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: /Chọn ảnh/i }))

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const imgFile = new File(['fake bytes'], 'nature.png', { type: 'image/png' })
    fireEvent.change(fileInput, { target: { files: [imgFile] } })

    const altInput = screen.getByPlaceholderText(/Nhập mô tả hình ảnh/i)
    fireEvent.change(altInput, { target: { value: 'Ảnh thiên nhiên' } })

    const submitBtn = screen.getByRole('button', { name: /Tải lên & chọn/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith('99')
    })

    // Check fetch was called with FormData containing _payload
    const postCall = fetchMock.mock.calls.find((call) => call[0] === '/api/media')
    expect(postCall).toBeTruthy()
    const reqInit = postCall![1] as RequestInit
    expect(reqInit.credentials).toBe('include')
    const body = reqInit.body as FormData
    expect(body.get('_payload')).toBe(JSON.stringify({ alt: 'Ảnh thiên nhiên' }))
    expect(body.get('file')).toBeTruthy()
  })

  test('lỗi 500 thì hiện thông báo uploadFailed, hộp còn mở', async () => {
    fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
      if (typeof url === 'string' && url.startsWith('/api/media?')) {
        return jsonResponse({ docs: [], hasNextPage: false })
      }
      if (url === '/api/media' && init?.method === 'POST') {
        return jsonResponse({ error: 'Server crashed' }, false, 500)
      }
      return jsonResponse({}, false, 404)
    })

    render(<MediaPickerField onChange={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /Chọn ảnh/i }))

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const imgFile = new File(['fake bytes'], 'error.png', { type: 'image/png' })
    fireEvent.change(fileInput, { target: { files: [imgFile] } })

    const submitBtn = screen.getByRole('button', { name: /Tải lên & chọn/i })
    fireEvent.click(submitBtn)

    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toMatch(/Tải ảnh lên thất bại/i)
    // Modal still open
    expect(screen.getByRole('dialog')).toBeTruthy()
  })

  test('Esc đóng hộp', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ docs: [], hasNextPage: false }))

    render(<MediaPickerField onChange={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /Chọn ảnh/i }))

    expect(screen.getByRole('dialog')).toBeTruthy()

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})

describe('createMediaExternalField (PK-18 compatibility)', () => {
  test('trả field có label và getItemSummary hợp lệ', () => {
    const field = createMediaExternalField({ label: 'Ảnh banner' })
    expect(field.label).toBe('Ảnh banner')
    expect(field.type).toBe('custom')
    expect(field.getItemSummary?.('10')).toBeTruthy()
    expect(field.getItemSummary?.('')).toBe('Chưa chọn ảnh')
  })
})

describe('blockStyleCss & backgroundImage (PK-18 / PK-23)', () => {
  const ds = cleanDesignSystem(DEFAULT_DESIGN_SYSTEM)

  test('đủ thuộc tính, mobile background image, và lớp phủ đúng màu / độ đậm', () => {
    const raw = {
      backgroundImage: {
        imageUrl: '/api/media/file/hero-bg.webp',
        mobileImageUrl: '/api/media/file/hero-bg-mobile.webp',
        size: 'cover',
        position: 'center',
        overlay: 'deep-navy',
        overlayOpacity: 40,
      },
    }
    const clean = sanitizeBlockStyle(raw, ds)
    expect(clean).toBeTruthy()

    const css = blockStyleCss('block-1', clean!)
    expect(css).toContain(
      '[data-eb-id="block-1"]{position:relative;background-image:url("/api/media/file/hero-bg.webp");background-size:cover;background-position:center;background-repeat:no-repeat}',
    )
    expect(css).toContain(
      '@media (max-width: 639px){[data-eb-id="block-1"]{background-image:url("/api/media/file/hero-bg-mobile.webp")}}',
    )
    expect(css).toContain(
      '[data-eb-id="block-1"]::before{content:"";position:absolute;inset:0;background:rgb(var(--color-deep-navy-rgb));opacity:0.4;pointer-events:none;z-index:0}',
    )
    expect(css).toContain(
      '[data-eb-id="block-1"][data-eb-id="block-1"]>*{position:relative;z-index:1;background-color:transparent}',
    )
    expect(css).toContain(
      '[data-eb-id="block-1"][data-eb-id="block-1"] [data-eb-section]{background-color:transparent}',
    )
  })

  test('URL bẩn (javascript:, có ") thì không sinh background-image', () => {
    const raw = {
      backgroundImage: {
        imageUrl: 'javascript:alert(1)',
        mobileImageUrl: '/api/media/file/bad"url.png',
      },
    }
    const clean = sanitizeBlockStyle(raw, ds)
    expect(clean).toBeNull()

    const sanitizedStyle = sanitizeBlockStyle(
      {
        backgroundImage: {
          imageUrl: 'javascript:alert(1)',
        },
      },
      ds,
    )
    expect(sanitizedStyle).toBeNull()
  })

  test('không có ảnh thì CSS sinh ra giống hệt trước', () => {
    const raw = {
      background: 'warm-ivory',
      textColor: 'deep-navy',
    }
    const clean = sanitizeBlockStyle(raw, ds)
    const css = blockStyleCss('block-plain', clean!)
    expect(css).toBe(
      '[data-eb-id="block-plain"]{background-color:rgb(var(--color-warm-ivory-rgb));color:rgb(var(--color-deep-navy-rgb))}',
    )
  })
})

describe('Container overlay & CSS comparison (PK-18)', () => {
  const ds = cleanDesignSystem(DEFAULT_DESIGN_SYSTEM)

  test('không lớp phủ thì CSS giống hệt trước', () => {
    const raw = {
      background: {
        type: 'image',
        imageUrl: '/api/media/file/container.jpg',
        size: 'cover',
        position: 'center',
      },
    }
    const clean = sanitizeContainer(raw, ds)
    const css = containerCss('c-1', clean.layout, clean.background)
    expect(css).toBe(
      '[data-eb-id="c-1"]{background-image:url("/api/media/file/container.jpg");background-size:cover;background-position:center;background-repeat:no-repeat}.eb-c-c-1{flex-direction:column}',
    )
  })

  test('có lớp phủ thì sinh ::before overlay', () => {
    const raw = {
      background: {
        type: 'image',
        imageUrl: '/api/media/file/container.jpg',
        size: 'cover',
        position: 'center',
        overlay: 'soft-pink',
        overlayOpacity: 60,
      },
    }
    const clean = sanitizeContainer(raw, ds)
    const css = containerCss('c-2', clean.layout, clean.background)
    expect(css).toContain(
      '[data-eb-id="c-2"]{position:relative;background-image:url("/api/media/file/container.jpg");background-size:cover;background-position:center;background-repeat:no-repeat}',
    )
    expect(css).toContain(
      '[data-eb-id="c-2"]::before{content:"";position:absolute;inset:0;background:rgb(var(--color-soft-pink-rgb));opacity:0.6;pointer-events:none;z-index:0}',
    )
  })
})
