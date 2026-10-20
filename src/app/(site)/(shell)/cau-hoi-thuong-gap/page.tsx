import type { Metadata } from 'next'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { faqGroupOptions } from '@/collections/Faqs'
import { PATHS } from '@/lib/paths'
import { vi } from '@/lib/i18n/vi'
import { Button } from '@/components/ui/Button'
import { FAQ } from '@/components/site/FAQ'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `${vi.sm06.faq.pageTitle} | Trạm Dừng Cảm Xúc`,
    description: vi.sm06.faq.pageDescription,
    alternates: {
      canonical: PATHS.faq,
    },
  }
}

interface PageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

interface FaqDoc {
  id: number | string
  question: string
  answer: string
  group: string
  order?: number
}

export default async function SharedFaqPage({ searchParams }: PageProps) {
  const sp = (await searchParams) || {}
  const rawQ = typeof sp.q === 'string' ? sp.q : Array.isArray(sp.q) ? sp.q[0] || '' : ''
  const query = rawQ.trim().slice(0, 100)

  let allFaqs: FaqDoc[] = []
  let hasFetchError = false

  try {
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })
    const result = await payload.find({
      collection: 'faqs',
      where: {
        _status: { equals: 'published' },
      },
      sort: 'order',
      depth: 0,
      limit: 500,
    })
    allFaqs = (result?.docs || []).map((doc) => ({
      id: doc.id,
      question: String(doc.question || ''),
      answer: String(doc.answer || ''),
      group: String(doc.group || 'general'),
      order: typeof doc.order === 'number' ? doc.order : 0,
    }))
  } catch {
    hasFetchError = true
  }

  // Filter by query (if provided)
  const lowerQ = query.toLowerCase()
  const filteredFaqs = query
    ? allFaqs.filter(
        (faq) =>
          faq.question.toLowerCase().includes(lowerQ) || faq.answer.toLowerCase().includes(lowerQ),
      )
    : allFaqs

  // Group by faqGroupOptions in declared order (groups with 0 items are omitted)
  const groupedFaqs = faqGroupOptions
    .map(([groupValue, groupLabel]) => {
      const items = filteredFaqs.filter((faq) => faq.group === groupValue)
      return {
        groupValue,
        groupLabel,
        items,
      }
    })
    .filter((grp) => grp.items.length > 0)

  // Flat list of all currently displayed questions for JSON-LD schema
  const displayedFaqs = groupedFaqs.flatMap((grp) => grp.items)

  return (
    <div className="w-full bg-warm-ivory py-12 sm:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
          <span className="inline-block mb-3 font-ui text-xs font-bold uppercase tracking-widest text-bright-magenta">
            {vi.sm06.faq.pageTitle}
          </span>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl uppercase tracking-tight leading-[1.15] text-deep-navy mb-4">
            <span>CÂU HỎI THƯỜNG GẶP</span> <span className="text-bright-magenta">VÀ GIẢI ĐÁP</span>
          </h1>
          <p className="font-ui text-base sm:text-lg text-deep-navy/80 leading-relaxed">
            {vi.sm06.faq.pageDescription}
          </p>
        </div>

        {/* Search Bar Form */}
        <form method="GET" action={PATHS.faq} className="relative max-w-2xl mx-auto mb-8 sm:mb-10">
          <label htmlFor="faq-search-input" className="sr-only">
            {vi.sm06.faq.searchLabel}
          </label>
          <div className="relative flex items-center">
            <input
              id="faq-search-input"
              type="search"
              name="q"
              defaultValue={query}
              maxLength={100}
              placeholder={vi.sm06.faq.searchPlaceholder}
              className="w-full pl-5 pr-28 py-3.5 rounded-full border border-deep-navy/15 bg-white text-deep-navy font-ui text-sm sm:text-base placeholder:text-deep-navy/40 focus:outline-none focus:ring-2 focus:ring-accent-pink shadow-soft transition-all"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1.5 bottom-1.5 px-5 rounded-full bg-deep-navy text-white hover:bg-bright-magenta font-ui text-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-pink"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <span>{vi.sm06.faq.searchButton}</span>
            </button>
          </div>
          {query && (
            <div className="mt-3 text-center text-xs sm:text-sm text-deep-navy/70 flex items-center justify-center gap-2">
              <span>
                Kết quả tìm kiếm cho: <strong>&ldquo;{query}&rdquo;</strong> ({filteredFaqs.length})
              </span>
              <span>&bull;</span>
              <Button
                href={PATHS.faq}
                variant="ghost"
                size="sm"
                className="text-bright-magenta underline p-0 h-auto"
              >
                {vi.sm06.faq.clearSearch}
              </Button>
            </div>
          )}
        </form>

        {/* Group Anchor Navigation Pills (Shown when multiple groups exist) */}
        {!hasFetchError && groupedFaqs.length > 1 && (
          <nav
            aria-label="Nhóm câu hỏi"
            className="mb-10 sm:mb-12 flex flex-wrap justify-center gap-2 sm:gap-3"
          >
            {groupedFaqs.map((grp) => (
              <a
                key={grp.groupValue}
                href={`#${grp.groupValue}`}
                className="px-4 py-2 rounded-full font-ui text-xs sm:text-sm font-semibold bg-white border border-deep-navy/10 text-deep-navy hover:bg-soft-pink hover:border-bright-magenta/30 hover:text-bright-magenta transition-colors shadow-xs"
              >
                {grp.groupLabel} ({grp.items.length})
              </a>
            ))}
          </nav>
        )}

        {/* Content Section */}
        {hasFetchError ? (
          <div className="max-w-2xl mx-auto p-8 rounded-card bg-white border border-deep-navy/10 shadow-soft text-center">
            <h2 className="font-display text-xl sm:text-2xl text-deep-navy mb-3">
              Không thể tải nội dung câu hỏi
            </h2>
            <p className="font-ui text-sm sm:text-base text-deep-navy/70 mb-6">
              Đã có lỗi xảy ra trong quá trình tải dữ liệu. Vui lòng thử tải lại trang hoặc liên hệ
              với Trạm để được hỗ trợ.
            </p>
            <Button href={PATHS.contact} variant="primary" size="md">
              {vi.sm06.faq.ctaStripButton}
            </Button>
          </div>
        ) : allFaqs.length === 0 ? (
          <div className="max-w-2xl mx-auto p-8 rounded-card bg-white border border-deep-navy/10 shadow-soft text-center">
            <h2 className="font-display text-xl sm:text-2xl text-deep-navy mb-3">
              {vi.sm06.faq.emptyAllTitle}
            </h2>
            <p className="font-ui text-sm sm:text-base text-deep-navy/70 mb-6">
              {vi.sm06.faq.emptyAllDesc}
            </p>
            <Button href={PATHS.contact} variant="primary" size="md">
              {vi.sm06.faq.ctaStripButton}
            </Button>
          </div>
        ) : query && filteredFaqs.length === 0 ? (
          <div className="max-w-2xl mx-auto p-8 rounded-card bg-white border border-deep-navy/10 shadow-soft text-center">
            <h2 className="font-display text-xl sm:text-2xl text-deep-navy mb-3">
              {vi.sm06.faq.emptySearchTitle}
            </h2>
            <p className="font-ui text-sm sm:text-base text-deep-navy/70 mb-6">
              {vi.sm06.faq.emptySearchDesc}
            </p>
            <Button href={PATHS.faq} variant="secondary" size="md">
              {vi.sm06.faq.clearSearch}
            </Button>
          </div>
        ) : (
          <div className="space-y-8 sm:space-y-12">
            {groupedFaqs.map((grp) => (
              <div key={grp.groupValue} className="rounded-card overflow-hidden">
                <FAQ
                  headingId={grp.groupValue}
                  titleLine1={grp.groupLabel}
                  titleLine2=""
                  seriesLabel=""
                  items={grp.items.map((item) => ({
                    question: item.question,
                    answer: item.answer,
                  }))}
                  source="manual"
                  preserveWhitespace={true}
                  bgColor="warm-ivory"
                  padding="sm"
                />
              </div>
            ))}
          </div>
        )}

        {/* Bottom CTA Strip */}
        <div className="mt-16 sm:mt-20 rounded-card bg-deep-navy text-white p-8 sm:p-12 text-center shadow-soft border border-white/20">
          <h3 className="font-display text-2xl sm:text-3xl lg:text-4xl uppercase tracking-tight text-white mb-4">
            {vi.sm06.faq.ctaStripHeading}
          </h3>
          <p className="font-quote italic text-soft-pink text-base sm:text-lg max-w-2xl mx-auto mb-8">
            {vi.sm06.faq.ctaStripEmotion}
          </p>
          <Button href={PATHS.contact} variant="primary" size="lg">
            {vi.sm06.faq.ctaStripButton}
          </Button>
        </div>
      </div>

      {/* JSON-LD FAQPage Schema */}
      {displayedFaqs.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: displayedFaqs.map((faq) => ({
                '@type': 'Question',
                name: faq.question.trim(),
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: faq.answer.replace(/<[^>]*>/g, '').trim(),
                },
              })),
            }),
          }}
        />
      )}
    </div>
  )
}
