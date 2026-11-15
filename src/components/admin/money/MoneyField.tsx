'use client'

import React from 'react'
import type { NumberFieldClientComponent } from 'payload'
import { FieldDescription, FieldError, FieldLabel, useField } from '@payloadcms/ui'
import { VndInput } from './VndInput'

/** Payload number field shown as a VND amount (`1.750.000 đ`). Stored value stays a number. */
export const MoneyField: NumberFieldClientComponent = ({ field, path, readOnly }) => {
  const { value, setValue, showError, errorMessage } = useField<number | null>({ path })
  // Same id Payload gives its own number input, so labels, tests and anchors keep working.
  const inputId = `field-${path.replace(/\./g, '__')}`
  const isReadOnly = Boolean(readOnly || field.admin?.readOnly)
  const description = field.admin?.description

  return (
    <div
      className={`field-type number ${inputId}${showError ? ' error' : ''}${isReadOnly ? ' read-only' : ''}`}
      style={field.admin?.width ? { flex: `0 1 ${field.admin.width}` } : undefined}
    >
      <FieldLabel htmlFor={inputId} label={field.label} required={field.required} path={path} />
      <div className="field-type__wrap">
        <FieldError path={path} showError={showError} message={errorMessage} />
        <VndInput
          id={inputId}
          name={path}
          value={typeof value === 'number' ? value : null}
          onValueChange={(next) => setValue(next)}
          readOnly={isReadOnly}
          disabled={isReadOnly}
          placeholder="0"
          data-testid={`money-${path}`}
        />
      </div>
      {description ? <FieldDescription description={description} path={path} /> : null}
    </div>
  )
}
