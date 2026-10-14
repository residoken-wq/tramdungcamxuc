import React from 'react'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Button } from '@/components/ui/Button'
import { vi } from '@/lib/i18n/vi'
import type { CustomerOrderDto } from '@/lib/account/orders.server'

export interface MyOrdersProps {
  orders: CustomerOrderDto[]
}

const ORDER_STATUS_MAP: Record<
  CustomerOrderDto['paymentStatus'],
  { status: 'on_sale' | 'consult' | 'coming_soon' | 'hidden'; label: string }
> = {
  paid: { status: 'on_sale', label: vi.account.orders.status.paid },
  pending: { status: 'consult', label: vi.account.orders.status.pending },
  failed: { status: 'coming_soon', label: vi.account.orders.status.failed },
  cancelled: { status: 'hidden', label: vi.account.orders.status.cancelled },
}

export function MyOrders({ orders }: MyOrdersProps) {
  return (
    <div className="bg-white/95 rounded-2xl p-6 border border-lavender-mist shadow-sm space-y-4">
      <h2 className="font-ui text-base font-bold text-deep-navy">{vi.account.orders.heading}</h2>

      {orders.length === 0 ? (
        <div className="p-8 rounded-xl bg-warm-ivory/50 border border-dashed border-deep-navy/20 text-center space-y-4">
          <p className="font-sans text-sm text-deep-navy/70">{vi.account.orders.empty}</p>
          <div>
            <Button
              href="/tai-nguyen"
              variant="secondary"
              size="sm"
              className="motion-reduce:transition-none"
            >
              {vi.account.orders.exploreLibrary}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order, idx) => {
            const badgeInfo = ORDER_STATUS_MAP[order.paymentStatus]
            const isPendingOrFailed =
              order.paymentStatus === 'pending' || order.paymentStatus === 'failed'

            return (
              <div
                key={`${order.paymentStatus}-${order.createdAtFormatted}-${idx}`}
                data-testid="customer-order-item"
                className="p-4 sm:p-5 rounded-2xl border border-lavender-mist bg-warm-ivory/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-colors motion-reduce:transition-none"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-ui font-bold text-deep-navy text-base">
                      {order.productName}
                    </h3>
                    <StatusBadge status={badgeInfo.status} label={badgeInfo.label} />
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-deep-navy/70 font-sans">
                    <div>
                      <span className="font-medium text-deep-navy/50">
                        {vi.account.orders.totalLabel}:{' '}
                      </span>
                      <span className="font-bold text-deep-navy">{order.totalFormatted}</span>
                    </div>
                    <div>
                      <span className="font-medium text-deep-navy/50">
                        {vi.account.orders.createdLabel}:{' '}
                      </span>
                      <span>{order.createdAtFormatted}</span>
                    </div>
                    {order.paidAtFormatted && (
                      <div>
                        <span className="font-medium text-deep-navy/50">
                          {vi.account.orders.paidLabel}:{' '}
                        </span>
                        <span>{order.paidAtFormatted}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:self-center">
                  {isPendingOrFailed && order.payToken && (
                    <Button
                      href={`/thanh-toan/don/${order.payToken}`}
                      variant="primary"
                      size="sm"
                      className="motion-reduce:transition-none"
                    >
                      {vi.account.orders.viewPayment}
                    </Button>
                  )}

                  {order.downloadFiles && order.downloadFiles.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                      {order.downloadFiles.map((file) => (
                        <Button
                          key={file.fileId}
                          href={file.downloadUrl}
                          variant="secondary"
                          size="sm"
                          className="motion-reduce:transition-none"
                        >
                          {file.filename
                            ? vi.account.orders.downloadFileWithFilename(file.filename)
                            : vi.account.orders.downloadFile}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
