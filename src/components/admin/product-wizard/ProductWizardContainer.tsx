'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import './wizard.css'
import { WizardProgress, type WizardStepMeta } from '../wizard/WizardProgress'
import { WizardControls } from '../wizard/WizardControls'
import { useWizardStorage } from '../wizard/useWizardStorage'
import { Step1Type } from './Step1Type'
import { Step2Basic } from './Step2Basic'
import { Step3Pricing } from './Step3Pricing'
import { Step4Content } from './Step4Content'
import { Step5Preview } from './Step5Preview'
import { getProductTemplate } from '@/lib/cms/product-templates'
import {
  createProductFromWizard,
  saveProductDraftFromWizard,
  type MediaOption,
  type ProductOption,
} from '@/lib/cms/product-wizard.server'
import type { ProductWizardInput } from '@/lib/cms/product-wizard-schema'
import type { ProductType } from '@/lib/cms/product-form'
import { vi } from '@/lib/i18n/vi'

const WIZARD_STORAGE_KEY = 'tdcx_product_wizard_draft_v1'

const WIZARD_STEPS: WizardStepMeta[] = [
  {
    number: 1,
    name: vi.cms.wizard.steps.step1.name,
    title: vi.cms.wizard.steps.step1.title,
    description: vi.cms.wizard.steps.step1.description,
  },
  {
    number: 2,
    name: vi.cms.wizard.steps.step2.name,
    title: vi.cms.wizard.steps.step2.title,
    description: vi.cms.wizard.steps.step2.description,
  },
  {
    number: 3,
    name: vi.cms.wizard.steps.step3.name,
    title: vi.cms.wizard.steps.step3.title,
    description: vi.cms.wizard.steps.step3.description,
  },
  {
    number: 4,
    name: vi.cms.wizard.steps.step4.name,
    title: vi.cms.wizard.steps.step4.title,
    description: vi.cms.wizard.steps.step4.description,
  },
  {
    number: 5,
    name: vi.cms.wizard.steps.step5.name,
    title: vi.cms.wizard.steps.step5.title,
    description: vi.cms.wizard.steps.step5.description,
  },
]

const initialWizardData: ProductWizardInput = {
  type: 'digital_tool',
  name: '',
  slug: '',
  web: 'habit',
  saleStatus: 'on_sale',
  trialDays: 21,
  accessDurationDays: null,
  ctaType: 'buy',
  ctaLabel: 'Mua ngay',
  components: [],
  includes: [],
  faq: [],
}

interface ProductWizardContainerProps {
  mediaList: MediaOption[]
  availableProducts: ProductOption[]
}

export function ProductWizardContainer({
  mediaList,
  availableProducts,
}: ProductWizardContainerProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [highestStepVisited, setHighestStepVisited] = useState(1)
  const [savedDocId, setSavedDocId] = useState<number | string | null>(null)

  const [isSaving, setIsSaving] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [isSavingPreviewDraft, setIsSavingPreviewDraft] = useState(false)

  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const { data, updateData, clearStorage, markSubmitted } = useWizardStorage<ProductWizardInput>({
    key: WIZARD_STORAGE_KEY,
    initialData: initialWizardData,
  })

  // Chọn loại sản phẩm ở bước 1: tự động áp dụng template mặc định
  const handleSelectType = (newType: ProductType) => {
    const template = getProductTemplate(newType)
    updateData({
      type: newType,
      web: template.web,
      saleStatus: template.saleStatus,
      trialDays: template.trialDays,
      accessDurationDays: template.accessDurationDays,
      ctaType: template.ctaType,
      ctaLabel: template.ctaLabel,
      externalUrl: template.externalUrl,
      externalLabel: template.externalLabel,
    })
    setErrorMessage(null)
  }

  // Điều kiện để được bấm "Tiếp tục"
  const canContinue = () => {
    switch (currentStep) {
      case 1:
        return Boolean(data.type)
      case 2:
        return Boolean(data.name?.trim() && data.slug?.trim())
      case 3:
        if (data.type === 'physical_external' && !data.externalUrl?.trim()) {
          return false
        }
        // Every package component needs a name: catch it here, not at the step 5 save.
        if (
          data.type === 'package' &&
          (data.components ?? []).some((component) => !component.label?.trim())
        ) {
          return false
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

    if (currentStep === 2) {
      if (!data.name?.trim()) {
        setErrorMessage(vi.cms.wizard.errors.missingName)
        return
      }
      if (!data.slug?.trim() || !/^[a-z0-9-]+$/.test(data.slug.trim())) {
        setErrorMessage(vi.cms.wizard.errors.missingSlug)
        return
      }
    }

    const nextStep = currentStep + 1
    setCurrentStep(nextStep)
    setHighestStepVisited((prev) => Math.max(prev, nextStep))

    // Khi bước vào bước 5 (Xem trước): tự động lưu nháp trước để có URL xem trước
    if (nextStep === 5) {
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
    if (step === 5) {
      await syncDraftForPreview()
    }
  }

  // Đồng bộ bản nháp để hiển thị trên iframe Bước 5
  const syncDraftForPreview = async () => {
    setIsSavingPreviewDraft(true)
    setErrorMessage(null)
    try {
      const res = await saveProductDraftFromWizard(data, savedDocId || undefined)
      if (res.success && res.docId) {
        setSavedDocId(res.docId)
      } else {
        setErrorMessage(res.error || vi.cms.wizard.errors.createFailed)
      }
    } catch (err: unknown) {
      setErrorMessage((err as Error).message || vi.cms.wizard.errors.createFailed)
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
      const res = await createProductFromWizard(data, {
        publish: false,
        docId: savedDocId || undefined,
      })

      if (res.success && res.docId) {
        markSubmitted()
        setSuccessMessage(vi.cms.wizard.success.draftSaved)
        setTimeout(() => {
          router.push(`/admin/collections/products/${res.docId}`)
        }, 800)
      } else {
        setErrorMessage(res.error || vi.cms.wizard.errors.createFailed)
      }
    } catch (err: unknown) {
      setErrorMessage((err as Error).message || vi.cms.wizard.errors.createFailed)
    } finally {
      setIsSaving(false)
    }
  }

  // Xuất bản (publish)
  const handlePublish = async () => {
    setIsPublishing(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      const res = await createProductFromWizard(data, {
        publish: true,
        docId: savedDocId || undefined,
      })

      if (res.success && res.docId) {
        markSubmitted()
        setSuccessMessage(vi.cms.wizard.success.published)
        setTimeout(() => {
          router.push(`/admin/collections/products/${res.docId}`)
        }, 800)
      } else {
        setErrorMessage(res.error || vi.cms.wizard.errors.createFailed)
      }
    } catch (err: unknown) {
      setErrorMessage((err as Error).message || vi.cms.wizard.errors.createFailed)
    } finally {
      setIsPublishing(false)
    }
  }

  // Bắt đầu lại
  const handleClearDraft = () => {
    if (window.confirm(vi.cms.wizard.confirm.clearDraft)) {
      clearStorage()
      setCurrentStep(1)
      setHighestStepVisited(1)
      setSavedDocId(null)
      setErrorMessage(null)
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Tiêu đề trang Wizard */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-lavender-mist/70 pb-4">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-extrabold uppercase tracking-wide text-deep-navy">
            {vi.cms.wizard.title}
          </h1>
          <p className="text-xs md:text-sm text-deep-navy/70 mt-1">{vi.cms.wizard.subtitle}</p>
        </div>

        <button
          type="button"
          onClick={() => router.push('/admin/collections/products')}
          className="rounded-xl border border-lavender-mist bg-white px-3.5 py-2 font-ui text-xs font-semibold text-deep-navy/70 hover:bg-soft-pink/30 hover:text-deep-navy transition-all"
        >
          ← {vi.cms.wizard.buttons.viewInCatalog}
        </button>
      </div>

      {/* Thanh tiến trình 5 bước */}
      <div className="mb-8">
        <WizardProgress
          steps={WIZARD_STEPS}
          currentStep={currentStep}
          onStepClick={handleStepClick}
          highestStepVisited={highestStepVisited}
        />
      </div>

      {/* Nội dung từng bước */}
      <div className="rounded-2xl border border-lavender-mist/60 bg-white p-6 shadow-sm md:p-8">
        {currentStep === 1 && (
          <Step1Type selectedType={data.type} onSelectType={handleSelectType} />
        )}

        {currentStep === 2 && (
          <Step2Basic
            name={data.name}
            slug={data.slug}
            web={data.web}
            shortDescription={data.shortDescription}
            journeyStep={data.journeyStep}
            coverImage={data.coverImage}
            coverImageAlt={null}
            mediaList={mediaList}
            onChange={(fields) => updateData(fields)}
          />
        )}

        {currentStep === 3 && (
          <Step3Pricing
            type={data.type}
            saleStatus={data.saleStatus}
            price={data.price}
            salePrice={data.salePrice}
            saleEndsAt={data.saleEndsAt}
            trialDays={data.trialDays}
            accessDurationDays={data.accessDurationDays}
            externalUrl={data.externalUrl}
            externalLabel={data.externalLabel}
            components={data.components}
            availableProducts={availableProducts}
            onChange={(fields) => updateData(fields)}
          />
        )}

        {currentStep === 4 && (
          <Step4Content
            includes={data.includes}
            painPoint={data.painPoint}
            outcome={data.outcome}
            faq={data.faq}
            onChange={(fields) => updateData(fields)}
          />
        )}

        {currentStep === 5 && (
          <Step5Preview
            docId={savedDocId}
            isSavingDraft={isSavingPreviewDraft}
            saveDraftError={errorMessage}
            onRetrySaveDraft={syncDraftForPreview}
          />
        )}
      </div>

      {/* Thanh điều khiển cuối trang */}
      <WizardControls
        currentStep={currentStep}
        totalSteps={5}
        canGoBack={currentStep > 1}
        canContinue={canContinue()}
        // Block save/publish while step 5 is still creating the preview draft: a click during
        // that request would create a second product with the same slug.
        isSaving={isSaving || isSavingPreviewDraft}
        isPublishing={isPublishing}
        errorMessage={errorMessage}
        successMessage={successMessage}
        onBack={handleBack}
        onContinue={handleContinue}
        onSaveDraft={handleSaveDraft}
        onPublish={currentStep === 5 ? handlePublish : undefined}
        onClearDraft={handleClearDraft}
      />
    </div>
  )
}
