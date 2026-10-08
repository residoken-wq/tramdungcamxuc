import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { AutosaveController } from '@/puck/autosave'
import type { Data } from '@puckeditor/core'

describe('Puck Autosave Controller (T1-04)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const initialData: Data = {
    root: { props: { title: 'Trang mẫu' } },
    content: [
      {
        type: 'RichText',
        props: { id: 'text-1', content: 'Đoạn văn' },
      },
    ],
  }

  const updatedData: Data = {
    root: { props: { title: 'Trang mẫu đã sửa' } },
    content: [
      {
        type: 'RichText',
        props: { id: 'text-1', content: 'Đoạn văn mới' },
      },
    ],
  }

  it('does NOT trigger onSave when data has not changed after 30 seconds', async () => {
    const onSave = vi.fn().mockResolvedValue(true)
    const controller = new AutosaveController({
      intervalMs: 30000,
      onSave,
    })

    controller.init(initialData)
    const cleanup = controller.start()

    expect(controller.isDirty()).toBe(false)

    // Advance 30 seconds
    await vi.advanceTimersByTimeAsync(30000)
    expect(onSave).not.toHaveBeenCalled()

    // Advance another 30 seconds
    await vi.advanceTimersByTimeAsync(30000)
    expect(onSave).not.toHaveBeenCalled()

    cleanup()
  })

  it('triggers onSave when data is modified after 30 seconds, and resets dirty state', async () => {
    const onSave = vi.fn().mockResolvedValue(true)
    const onSuccess = vi.fn()
    const controller = new AutosaveController({
      intervalMs: 30000,
      onSave,
      onAutoSaveSuccess: onSuccess,
    })

    controller.init(initialData)
    const cleanup = controller.start()

    // Modify data
    controller.setData(updatedData)
    expect(controller.isDirty()).toBe(true)

    // Advance 30 seconds
    await vi.advanceTimersByTimeAsync(30000)

    expect(onSave).toHaveBeenCalledTimes(1)
    expect(onSave).toHaveBeenCalledWith(updatedData)
    expect(onSuccess).toHaveBeenCalledTimes(1)
    expect(controller.isDirty()).toBe(false)

    // Advance another 30 seconds without further changes
    await vi.advanceTimersByTimeAsync(30000)
    expect(onSave).toHaveBeenCalledTimes(1)

    cleanup()
  })

  it('does NOT trigger onSave when isPublishing is true even if data is modified', async () => {
    const onSave = vi.fn().mockResolvedValue(true)
    const controller = new AutosaveController({
      intervalMs: 30000,
      onSave,
    })

    controller.init(initialData)
    const cleanup = controller.start()

    controller.setData(updatedData)
    expect(controller.isDirty()).toBe(true)

    // Mark publishing active
    controller.setPublishing(true)

    await vi.advanceTimersByTimeAsync(30000)
    expect(onSave).not.toHaveBeenCalled()

    // Turn off publishing
    controller.setPublishing(false)
    await vi.advanceTimersByTimeAsync(30000)
    expect(onSave).toHaveBeenCalledTimes(1)

    cleanup()
  })

  it('markSaved updates the saved snapshot without triggering onSave', async () => {
    const onSave = vi.fn().mockResolvedValue(true)
    const controller = new AutosaveController({
      intervalMs: 30000,
      onSave,
    })

    controller.init(initialData)
    controller.setData(updatedData)
    expect(controller.isDirty()).toBe(true)

    // Manual save occurs, notify controller
    controller.markSaved(updatedData)
    expect(controller.isDirty()).toBe(false)

    controller.start()
    await vi.advanceTimersByTimeAsync(30000)
    expect(onSave).not.toHaveBeenCalled()
    controller.stop()
  })
})
