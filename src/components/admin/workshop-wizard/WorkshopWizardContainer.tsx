'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import '../product-wizard/wizard.css'
import { WizardProgress, type WizardStepMeta } from '../wizard/WizardProgress'
import { WizardControls } from '../wizard/WizardControls'
import { useWizardStorage } from '../wizard/useWizardStorage'
import { Step1Audience } from './Step1Audience'
import { Step2Schedule } from './Step2Schedule'
import { Step3EmailPreview } from './Step3EmailPreview'
import {
  createWorkshopFromWizard,
  saveWorkshopDraftFromWizard,
  type WorkshopAudienceProductOption,
} from '@/lib/cms/workshop-wizard.server'
import type { WorkshopWizardInput } from '@/lib/cms/workshop-wizard-schema'
import { vi } from '@/lib/i18n/vi'

const WORKSHOP_WIZARD_STORAGE_KEY = 'tdcx_workshop_wizard_draft_v1'

const WORKSHOP_WIZARD_STEPS: WizardStepMeta[] = [
  {
    number: 1,
    name: vi.cms.workshopWizard.steps.step1.name,
    title: vi.cms.workshopWizard.steps.step1.title,
    description: vi.cms.workshopWizard.steps.step1.description,
  },
  {
    number: 2,
    name: vi.cms.workshopWizard.steps.step2.name,
    title: vi.cms.workshopWizard.steps.step2.title,
    description: vi.cms.workshopWizard.steps.step2.description,
  },
  {
    number: 3,
    name: vi.cms.workshopWizard.steps.step3.name,
    title: vi.cms.workshopWizard.steps.step3.title,
    description: vi.cms.workshopWizard.steps.step3.description,
  },
]

const initialWorkshopWizardData: WorkshopWizardInput = {
  audienceProductIds: [],
  title: '',
  vnDate: '',
  vnTime: '20:00',
  joinUrl: '',
}

interface WorkshopWizardContainerProps {
  availableProducts: WorkshopAudienceProductOption[]
}

export function WorkshopWizardContainer({ availableProducts }: WorkshopWizardContainerProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [highestStepVisited, setHighestStepVisited] = useState(1)
  const [savedDocId, setSavedDocId] = useState<number | string | null>(null)

  const [isSaving, setIsSaving] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [isSavingPreviewDraft, setIsSavingPreviewDraft] = useState(false)

  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const { data, updateData, clearStorage, markSubmitted } = useWizardStorage<WorkshopWizardInput>({
    key: WORKSHOP_WIZARD_STORAGE_KEY,
    initialData: initialWorkshopWizardData,
  })

  const isValidUrl = (urlStr?: string) => {
    if (!urlStr) return false
    try {
      const u = new URL(urlStr.trim())
      return u.protocol === 'http:' || u.protocol === 'https:'
    } catch {
      return false
    }
  }

  // Điều kiện để được bấm "Tiếp tục"
  const canContinue = () => {
    switch (currentStep) {
      case 1:
        return Boolean(data.title?.trim()) && data.audienceProductIds.length > 0
      case 2:
        return (
          Boolean(data.vnDate?.trim()) &&
          Boolean(data.vnTime?.trim()) &&
          Boolean(data.joinUrl?.trim()) &&
          isValidUrl(data.joinUrl)
        )
      case 3:
        return true
      default:
        return true
    }
  }

  // Chuyển sang bước tiếp theo
  const handleContinue = async () => {
    setErrorMessage(null)

    if (currentStep === 1) {
      if (!data.title?.trim()) {
        setErrorMessage(vi.cms.workshopWizard.errors.missingTitle)
        return
      }
      if (!data.audienceProductIds || data.audienceProductIds.length === 0) {
        setErrorMessage(vi.cms.workshopWizard.errors.missingAudience)
        return
      }
    }

    if (currentStep === 2) {
      if (!data.vnDate?.trim()) {
        setErrorMessage(vi.cms.workshopWizard.errors.missingDate)
        return
      }
      if (!data.vnTime?.trim()) {
        setErrorMessage(vi.cms.workshopWizard.errors.missingTime)
        return
      }
      if (!data.joinUrl?.trim() || !isValidUrl(data.joinUrl)) {
        setErrorMessage(vi.cms.workshopWizard.errors.invalidJoinUrl)
        return
      }
    }

    const nextStep = currentStep + 1
    setCurrentStep(nextStep)
    setHighestStepVisited((prev) => Math.max(prev, nextStep))

    // Khi bước vào bước 3 (Xem trước): tự động lưu nháp
    if (nextStep === 3) {
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
    if (step === 3) {
      await syncDraftForPreview()
    }
  }

  // Đồng bộ bản nháp
  const syncDraftForPreview = async () => {
    setIsSavingPreviewDraft(true)
    setErrorMessage(null)
    try {
      const res = await saveWorkshopDraftFromWizard(data, savedDocId || undefined)
      if (res.success && res.docId) {
        setSavedDocId(res.docId)
      } else {
        setErrorMessage(res.error || vi.cms.workshopWizard.errors.createFailed)
      }
    } catch (err: unknown) {
      setErrorMessage((err as Error).message || vi.cms.workshopWizard.errors.createFailed)
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
      const res = await createWorkshopFromWizard(data, {
        publish: false,
        docId: savedDocId || undefined,
      })

      if (res.success && res.docId) {
        markSubmitted()
        setSuccessMessage(vi.cms.workshopWizard.success.draftSaved)
        setTimeout(() => {
          router.push(`/admin/collections/workshops/${res.docId}`)
        }, 1200)
      } else {
        setErrorMessage(res.error || vi.cms.workshopWizard.errors.createFailed)
      }
    } catch (err: unknown) {
      setErrorMessage((err as Error).message || vi.cms.workshopWizard.errors.createFailed)
    } finally {
      setIsSaving(false)
    }
  }

  // Xuất bản công khai lịch workshop
  const handlePublish = async () => {
    setIsPublishing(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      const res = await createWorkshopFromWizard(data, {
        publish: true,
        docId: savedDocId || undefined,
      })

      if (res.success && res.docId) {
        markSubmitted()
        setSuccessMessage(vi.cms.workshopWizard.success.published)
        setTimeout(() => {
          router.push(`/admin/collections/workshops/${res.docId}`)
        }, 1200)
      } else {
        setErrorMessage(res.error || vi.cms.workshopWizard.errors.createFailed)
      }
    } catch (err: unknown) {
      setErrorMessage((err as Error).message || vi.cms.workshopWizard.errors.createFailed)
    } finally {
      setIsPublishing(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header giới thiệu */}
      <div className="mb-6">
        <span className="font-ui text-xs font-bold uppercase tracking-wider text-bright-magenta">
          {vi.cms.workshopWizard.seriesLabel}
        </span>
        <h1 className="font-display text-2xl uppercase tracking-wider text-deep-navy sm:text-3xl">
          {vi.cms.workshopWizard.title}
        </h1>
        <p className="mt-1 font-ui text-sm text-deep-navy/70">
          {vi.cms.workshopWizard.description}
        </p>
      </div>

      {/* Thanh tiến trình các bước */}
      <WizardProgress
        steps={WORKSHOP_WIZARD_STEPS}
        currentStep={currentStep}
        highestStepVisited={highestStepVisited}
        onStepClick={handleStepClick}
      />

      {/* Nội dung từng bước */}
      <div className="mt-6 rounded-3xl border border-lavender-mist/80 bg-white p-6 shadow-sm sm:p-8">
        {currentStep === 1 && (
          <Step1Audience
            title={data.title}
            selectedAudienceIds={data.audienceProductIds || []}
            availableProducts={availableProducts}
            onChange={(fields) => {
              updateData({
                ...(fields.title !== undefined ? { title: fields.title } : {}),
                ...(fields.selectedAudienceIds !== undefined
                  ? { audienceProductIds: fields.selectedAudienceIds }
                  : {}),
              })
            }}
          />
        )}

        {currentStep === 2 && (
          <Step2Schedule
            vnDate={data.vnDate}
            vnTime={data.vnTime}
            joinUrl={data.joinUrl}
            onChange={(fields) => updateData(fields)}
          />
        )}

        {currentStep === 3 && (
          <Step3EmailPreview
            title={data.title || 'Workshop Tập thương cảm xúc'}
            vnDate={data.vnDate}
            vnTime={data.vnTime}
            joinUrl={data.joinUrl}
            isDraftSaved={Boolean(savedDocId) && !isSavingPreviewDraft}
          />
        )}
      </div>

      {/* Thanh điều khiển cuối trang */}
      <WizardControls
        currentStep={currentStep}
        totalSteps={WORKSHOP_WIZARD_STEPS.length}
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
