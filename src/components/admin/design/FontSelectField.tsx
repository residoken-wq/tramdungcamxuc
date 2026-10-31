'use client'

import React, { useId } from 'react'
import type { TextFieldClientComponent } from 'payload'
import { FieldDescription, FieldError, FieldLabel, useField } from '@payloadcms/ui'
import { DESIGN_FONT_OPTIONS } from '@/lib/design/fonts'

/** EB-01: dropdown over DESIGN_FONT_OPTIONS for a font stored as plain text. */
export const FontSelectField: TextFieldClientComponent = ({ field, path }) => {
  const { value, setValue, showError, errorMessage } = useField<string>({ path })
  const id = useId()
  const label = typeof field.label === 'string' ? field.label : field.name
  const description =
    typeof field.admin?.description === 'string' ? field.admin.description : undefined

  return (
    <div className="field-type select" style={{ flex: '1 1 0' }}>
      <FieldLabel htmlFor={id} label={label} required={field.required} path={path} />
      <FieldError path={path} showError={showError} message={errorMessage} />
      <select
        id={id}
        value={typeof value === 'string' ? value : ''}
        onChange={(event) => setValue(event.target.value)}
        style={{ width: '100%', minHeight: 40 }}
      >
        {DESIGN_FONT_OPTIONS.map((font) => (
          <option key={font.value} value={font.value}>
            {font.label} ({font.category})
          </option>
        ))}
      </select>
      {description ? <FieldDescription description={description} path={path} /> : null}
    </div>
  )
}
