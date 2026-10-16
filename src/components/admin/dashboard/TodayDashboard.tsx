import React from 'react'
import type { Payload, PayloadRequest } from 'payload'
import { getDashboardStats } from '@/lib/cms/dashboard.server'
import { vi } from '@/lib/i18n/vi'

export interface TodayDashboardProps {
  payload?: Payload
  user?: PayloadRequest['user']
}

// REVIEW-REQUIRED: CM-02: Server component hiển thị dashboard "Hôm nay" phía trên danh sách collections.
// - Chạy trên server, Local API tôn trọng quyền đọc theo user của phiên.
// - Chỉ hiển thị số lượng thống kê việc cần làm, tuyệt đối không hiển thị PII (email, họ tên, số tiền).
export async function TodayDashboard(props: TodayDashboardProps) {
  const { payload, user } = props
  if (!payload) {
    return null
  }

  const stats = await getDashboardStats(payload, user)
  const userName =
    (user as { name?: string | null })?.name ||
    (user as { email?: string })?.email?.split('@')[0] ||
    ''

  const roleText =
    stats.userRole === 'owner'
      ? vi.cms.dashboard.roleBadge.owner
      : stats.userRole === 'editor'
        ? vi.cms.dashboard.roleBadge.editor
        : ''

  return (
    <section
      aria-label="Dashboard Hôm nay"
      style={{
        width: '100%',
        margin: '0 0 32px 0',
        padding: '0',
        fontFamily: 'Montserrat, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: '#280A60',
      }}
    >
      {/* 1. Header / Welcome Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #FAF7F4 0%, #FDE6F6 40%, #E9DDF9 100%)',
          borderRadius: '20px',
          padding: '28px 32px',
          marginBottom: '28px',
          border: '1px solid rgba(40, 10, 96, 0.08)',
          boxShadow: '0 4px 20px -2px rgba(40, 10, 96, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div>
            <span
              style={{
                display: 'inline-block',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#EF3B83',
                marginBottom: '4px',
              }}
            >
              Trang quản trị trung tâm
            </span>
            <h1
              style={{
                margin: 0,
                fontSize: '28px',
                lineHeight: 1.25,
                fontWeight: 800,
                letterSpacing: '-0.01em',
              }}
            >
              <span style={{ color: '#280A60' }}>{vi.cms.dashboard.headingLine1} </span>
              <span style={{ color: '#BC039E' }}>{vi.cms.dashboard.headingLine2}</span>
            </h1>
          </div>

          {roleText && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: stats.userRole === 'owner' ? '#FDE6F6' : '#FAF7F4',
                color: stats.userRole === 'owner' ? '#BC039E' : '#280A60',
                border: '1px solid rgba(188, 3, 158, 0.2)',
                borderRadius: '999px',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: 700,
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: stats.userRole === 'owner' ? '#EF3B83' : '#BC039E',
                }}
              />
              {roleText}
            </div>
          )}
        </div>

        <p
          style={{
            margin: 0,
            fontSize: '14px',
            color: 'rgba(40, 10, 96, 0.8)',
            lineHeight: 1.5,
          }}
        >
          {vi.cms.dashboard.welcome(userName)} {vi.cms.dashboard.welcomeSub}
        </p>
      </div>

      {/* Error state if query failed */}
      {stats.hasError && (
        <div
          role="alert"
          style={{
            background: '#FDE6F6',
            border: '1px solid #EF3B83',
            borderRadius: '16px',
            padding: '16px 20px',
            marginBottom: '24px',
            color: '#280A60',
          }}
        >
          <strong style={{ color: '#EF3B83', display: 'block', marginBottom: '4px' }}>
            {vi.cms.dashboard.errorTitle}
          </strong>
          <span style={{ fontSize: '13px' }}>
            {stats.errorMessage || vi.cms.dashboard.errorMessage}
          </span>
        </div>
      )}

      {/* 2. Phần "Việc cần làm" */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ marginBottom: '16px' }}>
          <h2
            style={{
              margin: '0 0 4px 0',
              fontSize: '18px',
              fontWeight: 700,
              color: '#280A60',
            }}
          >
            {vi.cms.dashboard.todosTitle}
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: '13px',
              color: 'rgba(40, 10, 96, 0.7)',
            }}
          >
            {vi.cms.dashboard.todosSubtitle}
          </p>
        </div>

        {/* Empty state: Không có việc nào - tuyệt! */}
        {stats.totalActionableCount === 0 ? (
          <div
            data-testid="cms-dashboard-empty"
            style={{
              background: 'linear-gradient(135deg, #D9F1EA 0%, #FAF7F4 100%)',
              border: '1px solid rgba(40, 10, 96, 0.1)',
              borderRadius: '18px',
              padding: '24px 28px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: '#FAF7F4',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                flexShrink: 0,
              }}
            >
              🌸
            </div>
            <div>
              <div
                style={{
                  fontSize: '15px',
                  fontWeight: 700,
                  color: '#280A60',
                  marginBottom: '2px',
                }}
              >
                {vi.cms.dashboard.emptyTodosTitle}
              </div>
              <div
                style={{
                  fontSize: '13px',
                  color: 'rgba(40, 10, 96, 0.75)',
                }}
              >
                {vi.cms.dashboard.emptyTodosDesc}
              </div>
            </div>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '16px',
            }}
          >
            {stats.todos.map((todo) => {
              const hasItems = todo.count > 0
              const badgeBg =
                todo.badgeColor === 'accent'
                  ? '#FDE6F6'
                  : todo.badgeColor === 'warning'
                    ? '#F6E9B8'
                    : '#E9DDF9'
              const badgeText =
                todo.badgeColor === 'accent'
                  ? '#BC039E'
                  : todo.badgeColor === 'warning'
                    ? '#280A60'
                    : '#280A60'

              return (
                <a
                  key={todo.id}
                  href={todo.href}
                  data-testid={`cms-todo-${todo.id}`}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '20px',
                    borderRadius: '18px',
                    background: hasItems ? '#FFFFFF' : '#FAF7F4',
                    border: hasItems
                      ? '1px solid rgba(188, 3, 158, 0.25)'
                      : '1px solid rgba(40, 10, 96, 0.08)',
                    boxShadow: hasItems ? '0 4px 12px rgba(40, 10, 96, 0.05)' : 'none',
                    textDecoration: 'none',
                    color: '#280A60',
                    transition:
                      'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'baseline',
                        justifyContent: 'space-between',
                        marginBottom: '8px',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '32px',
                          fontWeight: 800,
                          lineHeight: 1,
                          color: hasItems ? '#EF3B83' : 'rgba(40, 10, 96, 0.35)',
                        }}
                      >
                        {todo.count}
                      </span>
                      {hasItems && (
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '999px',
                            background: badgeBg,
                            color: badgeText,
                          }}
                        >
                          Cần xử lý
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: '14px',
                        fontWeight: 700,
                        color: '#280A60',
                        marginBottom: '6px',
                      }}
                    >
                      {todo.title}
                    </div>
                    <div
                      style={{
                        fontSize: '12px',
                        color: 'rgba(40, 10, 96, 0.65)',
                        lineHeight: 1.4,
                      }}
                    >
                      {todo.description}
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: '16px',
                      paddingTop: '12px',
                      borderTop: '1px dashed rgba(40, 10, 96, 0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: hasItems ? '#BC039E' : 'rgba(40, 10, 96, 0.5)',
                    }}
                  >
                    <span>Xem danh sách</span>
                    <span>→</span>
                  </div>
                </a>
              )
            })}
          </div>
        )}
      </div>

      {/* 3. Phần "Tạo nhanh" & "Hướng dẫn sử dụng" (2 cột) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '20px',
        }}
      >
        {/* Cột Tạo nhanh */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: '20px',
            padding: '24px',
            border: '1px solid rgba(40, 10, 96, 0.08)',
            boxShadow: '0 2px 10px rgba(40, 10, 96, 0.03)',
          }}
        >
          <div style={{ marginBottom: '16px' }}>
            <h2
              style={{
                margin: '0 0 4px 0',
                fontSize: '16px',
                fontWeight: 700,
                color: '#280A60',
              }}
            >
              {vi.cms.dashboard.quickActionsTitle}
            </h2>
            <p
              style={{
                margin: 0,
                fontSize: '12px',
                color: 'rgba(40, 10, 96, 0.65)',
              }}
            >
              {vi.cms.dashboard.quickActionsSubtitle}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {stats.quickActions.map((action) => (
              <a
                key={action.id}
                href={action.href}
                data-testid={`cms-quick-${action.id}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: '#FAF7F4',
                  border: '1px solid rgba(40, 10, 96, 0.06)',
                  textDecoration: 'none',
                  color: '#280A60',
                  transition: 'background 0.15s ease',
                }}
              >
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#280A60' }}>
                    {action.title}
                  </div>
                  <div
                    style={{
                      fontSize: '11px',
                      color: 'rgba(40, 10, 96, 0.6)',
                      marginTop: '2px',
                    }}
                  >
                    {action.description}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: '16px',
                    color: '#EF3B83',
                    marginLeft: '12px',
                    flexShrink: 0,
                  }}
                >
                  +
                </span>
              </a>
            ))}
          </div>
        </div>

        {/* Cột Hướng dẫn */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: '20px',
            padding: '24px',
            border: '1px solid rgba(40, 10, 96, 0.08)',
            boxShadow: '0 2px 10px rgba(40, 10, 96, 0.03)',
          }}
        >
          <div style={{ marginBottom: '16px' }}>
            <h2
              style={{
                margin: '0 0 4px 0',
                fontSize: '16px',
                fontWeight: 700,
                color: '#280A60',
              }}
            >
              {vi.cms.dashboard.guidesTitle}
            </h2>
            <p
              style={{
                margin: 0,
                fontSize: '12px',
                color: 'rgba(40, 10, 96, 0.65)',
              }}
            >
              {vi.cms.dashboard.guidesSubtitle}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {stats.guides.map((guide) => (
              <a
                key={guide.id}
                href={guide.href}
                target="_blank"
                rel="noopener noreferrer"
                data-testid={`cms-guide-${guide.id}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: '#FAF7F4',
                  border: '1px solid rgba(40, 10, 96, 0.06)',
                  textDecoration: 'none',
                  color: '#280A60',
                  transition: 'background 0.15s ease',
                }}
              >
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#280A60' }}>
                    {guide.title}
                  </div>
                  <div
                    style={{
                      fontSize: '11px',
                      color: 'rgba(40, 10, 96, 0.6)',
                      marginTop: '2px',
                    }}
                  >
                    {guide.description}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: '13px',
                    color: '#BC039E',
                    marginLeft: '12px',
                    flexShrink: 0,
                  }}
                  title="Mở tài liệu hướng dẫn"
                >
                  ↗
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
