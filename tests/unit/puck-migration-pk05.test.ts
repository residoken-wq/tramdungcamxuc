/* eslint-disable @typescript-eslint/no-explicit-any -- fixtures read loose Puck JSON */
import { describe, expect, it } from 'vitest'
import type { Data } from '@puckeditor/core'
import { migrateFAQV3ToV4 } from '@/puck/migrations/v4-faq'
import { normalizePuckData } from '@/puck/migrations'

describe('PK-05: Puck Migration v4 (FAQ to slot FaqItem blocks)', () => {
  it('chuyển FAQ items mảng sang slot items với FaqItem blocks và giữ nguyên thứ tự/chữ', () => {
    const dataV3: Data = {
      root: { props: { title: 'Test FAQ V3' } },
      content: [
        {
          type: 'FAQ',
          props: {
            id: 'test-faq-v3',
            version: 3,
            source: 'manual',
            titleLine1: 'CÂU HỎI',
            titleLine2: 'THƯỜNG GẶP',
            items: [
              {
                question: 'Câu hỏi số 1?',
                answer: 'Nội dung trả lời 1.',
              },
              {
                question: 'Câu hỏi số 2?',
                answer: 'Nội dung trả lời 2.',
              },
            ],
            numbered: true,
            aside: 'none',
            bgColor: 'warm-ivory',
            padding: 'md',
          },
        },
      ],
    }

    const migrated = migrateFAQV3ToV4(dataV3)
    const block = migrated.content[0] as any

    expect(block.type).toBe('FAQ')
    expect(block.props.version).toBe(4)
    expect(block.props.source).toBe('manual')
    expect(Array.isArray(block.props.items)).toBe(true)
    expect(block.props.items).toHaveLength(2)

    const [f0, f1] = block.props.items
    expect(f0.type).toBe('FaqItem')
    expect(f0.props.id).toBe('test-faq-v3-faq-0')
    expect(f0.props.question).toBe('Câu hỏi số 1?')
    expect(f0.props.answer).toBe('Nội dung trả lời 1.')
    expect(f0.props.questionColor).toBe('deep-navy')
    expect(f0.props.questionSize).toBe('md')
    expect(f0.props.answerColor).toBe('deep-navy')
    expect(f0.props.answerSize).toBe('md')

    expect(f1.type).toBe('FaqItem')
    expect(f1.props.id).toBe('test-faq-v3-faq-1')
    expect(f1.props.question).toBe('Câu hỏi số 2?')
    expect(f1.props.answer).toBe('Nội dung trả lời 2.')
  })

  it('lọc bỏ các câu hỏi rỗng (không có cả question lẫn answer)', () => {
    const dataWithEmpty: Data = {
      root: { props: {} },
      content: [
        {
          type: 'FAQ',
          props: {
            id: 'faq-filter',
            version: 3,
            items: [
              { question: 'Có câu hỏi', answer: '' },
              { question: '', answer: '' },
              { question: '   ', answer: '   ' },
              null,
              { question: '', answer: 'Có câu trả lời' },
            ],
          },
        },
      ],
    }

    const migrated = migrateFAQV3ToV4(dataWithEmpty)
    const block = migrated.content[0] as any

    expect(block.props.items).toHaveLength(2)
    expect(block.props.items[0].props.question).toBe('Có câu hỏi')
    expect(block.props.items[1].props.answer).toBe('Có câu trả lời')
  })

  it('giữ nguyên cấu hình source: group và các thông số group, limit', () => {
    const dataGroup: Data = {
      root: { props: {} },
      content: [
        {
          type: 'FAQ',
          props: {
            id: 'faq-group-test',
            version: 3,
            source: 'group',
            group: 'coaching',
            limit: 8,
            items: [],
          },
        },
      ],
    }

    const migrated = migrateFAQV3ToV4(dataGroup)
    const block = migrated.content[0] as any

    expect(block.props.version).toBe(4)
    expect(block.props.source).toBe('group')
    expect(block.props.group).toBe('coaching')
    expect(block.props.limit).toBe(8)
    expect(block.props.items).toEqual([])
  })

  it('idempotent: chạy 2 lần cho kết quả toEqual giống nhau', () => {
    const data: Data = {
      root: { props: {} },
      content: [
        {
          type: 'FAQ',
          props: {
            id: 'faq-idem',
            version: 1,
            items: [{ question: 'Q1', answer: 'A1' }],
          },
        },
      ],
    }

    const once = migrateFAQV3ToV4(data)
    const twice = migrateFAQV3ToV4(once)
    expect(twice).toEqual(once)
  })

  it('di chuyển vào trong slot Columns (col1, col2, col3)', () => {
    const dataInColumns: Data = {
      root: { props: {} },
      content: [
        {
          type: 'Columns',
          props: {
            id: 'col-block',
            col2: [
              {
                type: 'FAQ',
                props: {
                  id: 'faq-in-col',
                  version: 2,
                  items: [{ question: 'FAQ in col2?', answer: 'Answer in col2.' }],
                },
              },
            ],
          },
        },
      ],
    }

    const migrated = migrateFAQV3ToV4(dataInColumns)
    const colBlock = migrated.content[0] as any
    const innerFaq = colBlock.props.col2[0]

    expect(innerFaq.props.version).toBe(4)
    expect(innerFaq.props.items).toHaveLength(1)
    expect(innerFaq.props.items[0].type).toBe('FaqItem')
    expect(innerFaq.props.items[0].props.question).toBe('FAQ in col2?')
  })

  it('normalizePuckData tự động migrate FAQ sang v4', () => {
    const rawData = {
      content: [
        {
          type: 'FAQ',
          props: {
            id: 'norm-faq',
            items: [{ question: 'Tự động migrate?', answer: 'Đúng vậy.' }],
          },
        },
      ],
    }

    const normalized = normalizePuckData(rawData)
    const block = normalized.content[0] as any

    expect(block.props.version).toBe(4)
    expect(block.props.items[0].type).toBe('FaqItem')
  })
})
