import type { Data } from '@puckeditor/core'

export type AutosaveControllerOptions = {
  intervalMs?: number
  onSave: (data: Data) => Promise<boolean>
  onAutoSaveSuccess?: (timeString: string) => void
  onAutoSaveError?: (error: unknown) => void
}

/**
 * Quản lý chu kỳ tự động lưu bản nháp mỗi intervalMs (mặc định 30 giây):
 * - Chỉ gọi onSave khi dữ liệu đã thay đổi so với lần lưu gần nhất.
 * - Không gọi khi đang trong tiến trình xuất bản (isPublishing).
 * - Không gọi khi đang trong tiến trình lưu khác (isSaving).
 */
export class AutosaveController {
  private intervalMs: number
  private onSave: (data: Data) => Promise<boolean>
  private onAutoSaveSuccess?: (timeString: string) => void
  private onAutoSaveError?: (error: unknown) => void

  private timerId: ReturnType<typeof setInterval> | null = null
  private currentData: Data | null = null
  private lastSavedJson: string = ''
  private isPublishing: boolean = false
  private isSaving: boolean = false

  constructor(options: AutosaveControllerOptions) {
    this.intervalMs = options.intervalMs ?? 30000
    this.onSave = options.onSave
    this.onAutoSaveSuccess = options.onAutoSaveSuccess
    this.onAutoSaveError = options.onAutoSaveError
  }

  public init(initialData: Data): void {
    this.currentData = initialData
    this.lastSavedJson = JSON.stringify(initialData)
  }

  public setData(data: Data): void {
    this.currentData = data
  }

  public markSaved(data: Data): void {
    this.currentData = data
    this.lastSavedJson = JSON.stringify(data)
  }

  public setPublishing(publishing: boolean): void {
    this.isPublishing = publishing
  }

  public isDirty(): boolean {
    if (!this.currentData) return false
    return JSON.stringify(this.currentData) !== this.lastSavedJson
  }

  public async tick(): Promise<boolean> {
    if (this.isPublishing || this.isSaving) {
      return false
    }

    if (!this.isDirty() || !this.currentData) {
      return false
    }

    const dataToSave = this.currentData
    const jsonToSave = JSON.stringify(dataToSave)

    try {
      this.isSaving = true
      const success = await this.onSave(dataToSave)
      if (success) {
        this.lastSavedJson = jsonToSave
        const now = new Date()
        const timeString = `${String(now.getHours()).padStart(2, '0')}:${String(
          now.getMinutes(),
        ).padStart(2, '0')}`
        if (this.onAutoSaveSuccess) {
          this.onAutoSaveSuccess(timeString)
        }
        return true
      }
      return false
    } catch (err) {
      if (this.onAutoSaveError) {
        this.onAutoSaveError(err)
      }
      return false
    } finally {
      this.isSaving = false
    }
  }

  public start(): () => void {
    this.stop()
    this.timerId = setInterval(() => {
      void this.tick()
    }, this.intervalMs)

    return () => this.stop()
  }

  public stop(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId)
      this.timerId = null
    }
  }
}
