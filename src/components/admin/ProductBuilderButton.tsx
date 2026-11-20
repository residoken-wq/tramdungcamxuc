'use client'

import React from 'react'
import { useDocumentInfo, useFormFields } from '@payloadcms/ui'
import { vi } from '@/lib/i18n/vi'
import { buildProductPageData, productPageTarget } from '@/puck/templates/product-page'
import { BuilderPagePanel } from './BuilderPagePanel'

const t = vi.bx08.builderPanel

/**
 * BX-08: in the product form – create (as a draft) or open the builder page that replaces this
 * product's coded page.
 */
export const ProductBuilderButton: React.FC = () => {
  const { id } = useDocumentInfo()
  const fields = useFormFields(([f]) => ({
    slug: (f.slug?.value as string | undefined) ?? '',
    type: (f.type?.value as string | undefined) ?? '',
    saleStatus: (f.saleStatus?.value as string | undefined) ?? '',
    name: (f.name?.value as string | undefined) ?? '',
  }))
  const target = productPageTarget(fields)

  return (
    <BuilderPagePanel
      slug={target?.slug ?? ''}
      title={t.title}
      hint={t.hint}
      noTargetMessage={t.noTarget}
      notReadyMessage={t.saveFirst}
      ready={Boolean(id)}
      pageTitle={fields.name || target?.slug || ''}
      buildPuckData={(title) => buildProductPageData(target?.kind ?? 'offer', id ?? '', title)}
      testId="product-builder-panel"
    />
  )
}
