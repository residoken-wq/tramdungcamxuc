/**
 * Public Testimonial DTO & pure transformation functions.
 * Enforces strict consent-only policy (AGENTS.md §7, T1-02b).
 */

export interface PublicTestimonialPhoto {
  url: string
  alt: string
}

export interface PublicTestimonialStory {
  before?: string
  insight?: string
  after?: string
}

export interface PublicTestimonial {
  id: number | string
  name: string
  quote: string
  role?: string
  age?: number | string
  story?: PublicTestimonialStory
  relatedOffer?: string
  language?: 'vi' | 'en'
  photo?: PublicTestimonialPhoto
  consent?: true
}

/**
 * Pure function to transform a Testimonial document (from Local API or REST API)
 * into a safe, consent-verified PublicTestimonial DTO.
 *
 * Anti-data-leak & Consent-only rules:
 * 1. If `consent !== true`, returns `null`. Unconsented testimonials MUST NEVER reach the browser.
 * 2. If `_status` is present and `_status !== 'published'`, returns `null`.
 * 3. Returns `age`, `role`, and `story` only when `consent === true`.
 * 4. Normalizes photo to `{ url, alt }`.
 */
export function toPublicTestimonial(doc: unknown): PublicTestimonial | null {
  if (!doc || typeof doc !== 'object') {
    return null
  }

  const t = doc as Record<string, unknown>

  // Strict consent check: Must be explicitly true
  if (t.consent !== true) {
    return null
  }

  // Publication status check: Must not be unpublished draft
  if (t._status !== undefined && t._status !== 'published') {
    return null
  }

  const id = (t.id as string | number) ?? ''
  const name = typeof t.name === 'string' ? t.name : ''
  const quote = typeof t.quote === 'string' ? t.quote : ''
  const language = (t.language as 'vi' | 'en') || 'vi'

  const role = typeof t.role === 'string' && t.role.trim().length > 0 ? t.role.trim() : undefined
  const age =
    typeof t.age === 'number'
      ? t.age
      : typeof t.age === 'string' && t.age.trim().length > 0
        ? t.age.trim()
        : undefined

  let photo: PublicTestimonialPhoto | undefined = undefined
  if (t.photo && typeof t.photo === 'object') {
    const rawPhoto = t.photo as Record<string, unknown>
    const url = typeof rawPhoto.url === 'string' ? rawPhoto.url : ''
    const alt = typeof rawPhoto.alt === 'string' ? rawPhoto.alt : ''
    if (url) {
      photo = { url, alt }
    }
  }

  let story: PublicTestimonialStory | undefined = undefined
  if (t.story && typeof t.story === 'object') {
    const s = t.story as Record<string, unknown>
    const before =
      typeof s.before === 'string' && s.before.trim().length > 0 ? s.before.trim() : undefined
    const insight =
      typeof s.insight === 'string' && s.insight.trim().length > 0 ? s.insight.trim() : undefined
    const after =
      typeof s.after === 'string' && s.after.trim().length > 0 ? s.after.trim() : undefined
    if (before || insight || after) {
      story = { before, insight, after }
    }
  }

  let relatedOffer: string | undefined = undefined
  if (t.relatedOffer && typeof t.relatedOffer === 'object') {
    const ro = t.relatedOffer as Record<string, unknown>
    if (ro.value && typeof ro.value === 'object') {
      const val = ro.value as Record<string, unknown>
      if (typeof val.name === 'string') relatedOffer = val.name
    } else if (typeof ro.name === 'string') {
      relatedOffer = ro.name
    }
  } else if (typeof t.relatedOffer === 'string' && t.relatedOffer.trim().length > 0) {
    relatedOffer = t.relatedOffer.trim()
  }

  const result: PublicTestimonial = {
    id,
    name,
    quote,
    language,
    consent: true,
  }

  if (role !== undefined) result.role = role
  if (age !== undefined) result.age = age
  if (photo !== undefined) result.photo = photo
  if (story !== undefined) result.story = story
  if (relatedOffer !== undefined) result.relatedOffer = relatedOffer

  return result
}
