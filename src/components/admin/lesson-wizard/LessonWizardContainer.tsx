'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import '../product-wizard/wizard.css'
import { WizardProgress, type WizardStepMeta } from '../wizard/WizardProgress'
import { WizardControls } from '../wizard/WizardControls'
import { useWizardStorage } from '../wizard/useWizardStorage'
import { Step1Module } from './Step1Module'
import { Step2Details } from './Step2Details'
import { Step3Video } from './Step3Video'
import { Step4Preview } from './Step4Preview'
import {
  createLessonFromWizard,
  saveLessonDraftFromWizard,
  getNextLessonOrderByModule,
  type CourseModuleOption,
} from '@/lib/cms/lesson-wizard.server'
import {
  parseDurationToSeconds,
  type LessonWizardInput,
} from '@/lib/cms/lesson-wizard-schema'
import { BUNNY_VIDEO_ID_REGEX } from '@/lib/video/bunny'
import { vi } from '@/lib/i18n/vi'

const LESSON_WIZARD_STORAGE_KEY = 'tdcx_lesson_wizard_draft_v1'

const LESSON_WIZARD_STEPS: WizardStepMeta[] = [
  {
    number: 1,
    name: vi.cms.lessonWizard.steps.step1.name,
    title: vi.cms.lessonWizard.steps.step1.title,
    description: vi.cms.lessonWizard.steps.step1.description,
  },
  {
    number: 2,
    name: vi.cms.lessonWizard.steps.step2.name,
    title: vi.cms.lessonWizard.steps.step2.title,
    description: vi.cms.lessonWizard.steps.step2.description,
  },
  {
    number: 3,
    name: vi.cms.lessonWizard.steps.step3.name,
    title: vi.cms.lessonWizard.steps.step3.title,
    description: vi.cms.lessonWizard.steps.step3.description,
  },
  {
    number: 4,
    name: vi.cms.lessonWizard.steps.step4.name,
    title: vi.cms.lessonWizard.steps.step4.title,
    description: vi.cms.lessonWizard.steps.step4.description,
  },
]

const initialLessonWizardData: LessonWizardInput = {
  moduleId: '',
  title: '',
  summary: '',
  stage: 'none',
  order: 1,
  videoId: '',
  durationInput: '',
  isFreePreview: false,
}

interface LessonWizardContainerProps {
  initialModules: CourseModuleOption[]
}

export function LessonWizardContainer({ initialModules }: LessonWizardContainerProps) {
  const router = useRouter()
  const [modules, setModules] = useState<CourseModuleOption[]>(initialModules)
  const [currentStep, setCurrentStep] = useState(1)
  const [highestStepVisited, setHighestStepVisited] = useState(1)
  const [savedDocId, setSavedDocId] = useState<number | string | null>(null)

  const [isSaving, setIsSaving] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [isSavingPreviewDraft, setIsSavingPreviewDraft] = useState(false)

  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const { data, updateData, clearStorage, markSubmitted } = useWizardStorage<LessonWizardInput>({
    key: LESSON_WIZARD_STORAGE_KEY,
    initialData: initialLessonWizardData,
  })

  // Chọn module và tự động lấy số thứ tự gợi ý
  const handleSelectModule = async (moduleId: number | string) => {
    updateData({ moduleId })
    setErrorMessage(null)

    try {
      const nextOrder = await getNextLessonOrderByModule(moduleId)
      updateData({ order: nextOrder })
    } catch {
      // Giữ nguyên order hiện tại nếu lỗi mạng
    }
  }

  // Thêm module mới tạo nhanh vào danh sách cục bộ
  const handleModuleCreated = (newModule: CourseModuleOption) => {
    setModules((prev) => [...prev, newModule])
    handleSelectModule(newModule.id)
  }

  // Điều kiện để được bấm "Tiếp tục"
  const canContinue = () => {
    switch (currentStep) {
      case 1:
        return Boolean(data.moduleId)
      case 2:
        return Boolean(data.title?.trim())
      case 3:
        if (data.videoId && !BUNNY_VIDEO_ID_REGEX.test(data.videoId.trim())) {
          return false
        }
        if (data.durationInput && data.durationInput.trim().length > 0) {
          if (parseDurationToSeconds(data.durationInput) === null) {
            return false
          }
        }
        return true
      case 4:
        return true
      default:
        return true
    }
  }

  // Chuyển sang bước tiếp theo
  const handleContinue = async () => {
    setErrorMessage(null)

    if (currentStep === 1) {
      if (!data.moduleId) {
        setErrorMessage(vi.cms.lessonWizard.errors.missingModule)
        return
      }
    }

    if (currentStep === 2) {
      if (!data.title?.trim()) {
        setErrorMessage(vi.cms.lessonWizard.errors.missingTitle)
        return
      }
    }

    if (currentStep === 3) {
      if (data.videoId && !BUNNY_VIDEO_ID_REGEX.test(data.videoId.trim())) {
        setErrorMessage(vi.cms.lessonWizard.errors.invalidVideoId)
        return
      }
      if (data.durationInput && data.durationInput.trim().length > 0) {
        if (parseDurationToSeconds(data.durationInput) === null) {
          setErrorMessage(vi.cms.lessonWizard.errors.invalidDuration)
          return
        }
      }
    }

    const nextStep = currentStep + 1
    setCurrentStep(nextStep)
    setHighestStepVisited((prev) => Math.max(prev, nextStep))

    // Khi bước vào bước 4 (Xem trước): tự động lưu nháp trước để có URL xem trước
    if (nextStep === 4) {
      await syncDraftForPreview()
    }
  }

  // Quay lại bước trước
  const handleBack = () => {
    setErrorMessage(null)
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  // Nhảy trực tiếp tới bước đã đi qua
  const handleStepClick = async (step: number) => {
    setErrorMessage(null)
    setCurrentStep(step)
    if (step === 4) {
      await syncDraftForPreview()
    }
  }

  // Đồng bộ bản nháp để hiển thị trên iframe Bước 4
  const syncDraftForPreview = async () => {
    setIsSavingPreviewDraft(true)
    setErrorMessage(null)
    try {
      const res = await saveLessonDraftFromWizard(data, savedDocId || undefined)
      if (res.success && res.docId) {
        setSavedDocId(res.docId)
      } else {
        setErrorMessage(res.error || vi.cms.lessonWizard.errors.createFailed)
      }
    } catch (err: unknown) {
      setErrorMessage((err as Error).message || vi.cms.lessonWizard.errors.createFailed)
    } finally {
      setIsSavingPreviewDraft(false)
    }
  }

  // Lưu nháp (mặc định)
  const handleSaveDraft = async () => {
    setIsSaving(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      const res = await createLessonFromWizard(data, {
        publish: false,
        docId: savedDocId || undefined,
      })

      if (res.success && res.docId) {
        markSubmitted()
        setSuccessMessage(vi.cms.lessonWizard.success.draftSaved)
        setTimeout(() => {
          router.push(`/admin/collections/lessons/${res.docId}`)
        }, 1200)
      } else {
        setErrorMessage(res.error || vi.cms.lessonWizard.errors.createFailed)
      }
    } catch (err: unknown) {
      setErrorMessage((err as Error).message || vi.cms.lessonWizard.errors.createFailed)
    } finally {
      setIsSaving(false)
    }
  }

  // Xuất bản công khai
  const handlePublish = async () => {
    setIsPublishing(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      const res = await createLessonFromWizard(data, {
        publish: true,
        docId: savedDocId || undefined,
      })

      if (res.success && res.docId) {
        markSubmitted()
        setSuccessMessage(vi.cms.lessonWizard.success.published)
        setTimeout(() => {
          router.push(`/admin/collections/lessons/${res.docId}`)
        }, 1200)
      } else {
        setErrorMessage(res.error || vi.cms.lessonWizard.errors.createFailed)
      }
    } catch (err: unknown) {
      setErrorMessage((err as Error).message || vi.cms.lessonWizard.errors.createFailed)
    } finally {
      setIsPublishing(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header giới thiệu */}
      <div className="mb-6">
        <span className="font-ui text-xs font-bold uppercase tracking-wider text-bright-magenta">
          {vi.cms.lessonWizard.seriesLabel}
        </span>
        <h1 className="font-display text-2xl uppercase tracking-wider text-deep-navy sm:text-3xl">
          {vi.cms.lessonWizard.title}
        </h1>
        <p className="mt-1 font-ui text-sm text-deep-navy/70">
          {vi.cms.lessonWizard.description}
        </p>
      </div>

      {/* Thanh tiến trình các bước */}
      <WizardProgress
        steps={LESSON_WIZARD_STEPS}
        currentStep={currentStep}
        highestStepVisited={highestStepVisited}
        onStepClick={handleStepClick}
      />

      {/* Nội dung từng bước */}
      <div className="mt-6 rounded-3xl border border-lavender-mist/80 bg-white p-6 shadow-sm sm:p-8">
        {currentStep === 1 && (
          <Step1Module
            selectedModuleId={data.moduleId}
            modules={modules}
            onSelectModule={handleSelectModule}
            onModuleCreated={handleModuleCreated}
          />
        )}

        {currentStep === 2 && (
          <Step2Details
            title={data.title}
            summary={data.summary || ''}
            stage={data.stage || 'none'}
            order={data.order ?? 0}
            onChange={(fields) => updateData(fields)}
          />
        )}

        {currentStep === 3 && (
          <Step3Video
            videoId={data.videoId || ''}
            durationInput={data.durationInput || ''}
            isFreePreview={Boolean(data.isFreePreview)}
            onChange={(fields) => updateData(fields)}
          />
        )}

        {currentStep === 4 && (
          <Step4Preview
            lessonId={savedDocId}
            title={data.title || 'Bài học mới'}
            isDraftSaved={Boolean(savedDocId) && !isSavingPreviewDraft}
          />
        )}
      </div>

      {/* Thanh điều khiển cuối trang */}
      <WizardControls
        currentStep={currentStep}
        totalSteps={LESSON_WIZARD_STEPS.length}
        canGoBack={currentStep > 1}
        canContinue={canContinue()}
        isSaving={isSaving || isSavingPreviewDraft}
        isPublishing={isPublishing}
        errorMessage={errorMessage}
        successMessage={successMessage}
        onBack={handleBack}
        onContinue={handleContinue}
        onSaveDraft={handleSaveDraft}
        onPublish={handlePublish}
        onClearDraft={clearStorage}
      />
    </div>
  )
}
