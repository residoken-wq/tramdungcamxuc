import React from 'react'
import '@puckeditor/core/dist/index.css'

export default function BuilderLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi">
      <body className="m-0 p-0 antialiased">{children}</body>
    </html>
  )
}
