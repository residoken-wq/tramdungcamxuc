import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import { s3Storage } from '@payloadcms/storage-s3'
import { vi } from '@payloadcms/translations/languages/vi'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { PrivateFiles } from './collections/PrivateFiles'
import { migrations } from './migrations'
import { Products } from './collections/Products'
import { Services } from './collections/Services'
import { Programs } from './collections/Programs'
import { Posts } from './collections/Posts'
import { Testimonials } from './collections/Testimonials'
import { EqCards } from './collections/EqCards'
import { CourseModules } from './collections/CourseModules'
import { Lessons } from './collections/Lessons'
import { DiagnosticQuestions } from './collections/DiagnosticQuestions'
import { Techniques } from './collections/Techniques'
import { LegalPages } from './collections/LegalPages'
import { Workshops } from './collections/Workshops'
import { WorkshopReminders } from './collections/WorkshopReminders'
import { TrialReminders } from './collections/TrialReminders'
import { TrackerNudges } from './collections/TrackerNudges'
import { Pages } from './collections/Pages'
import { Customers } from './collections/Customers'
import { Entitlements } from './collections/Entitlements'
import { Orders } from './collections/Orders'
import { DiscountCodes } from './collections/DiscountCodes'
import { Leads } from './collections/Leads'
import { HabitPlans } from './collections/HabitPlans'
import { HabitCheckins } from './collections/HabitCheckins'
import { SavedCards } from './collections/SavedCards'
import { DiagnosticResults } from './collections/DiagnosticResults'
import { Certificates } from './collections/Certificates'
import { LessonProgress } from './collections/LessonProgress'
import { OtpCodes } from './collections/OtpCodes'
import { PaymentEvents } from './collections/PaymentEvents'
import { AuditLogs } from './collections/AuditLogs'
import { RateLimitHits } from './collections/RateLimitHits'
import { TrialUsage } from './collections/TrialUsage'
import { SiteSettings } from './globals/SiteSettings'
import { Navigation } from './globals/Navigation'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const { S3_BUCKET, S3_ENDPOINT, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY } = process.env
const storageEnabled = Boolean(S3_BUCKET && S3_ENDPOINT && S3_ACCESS_KEY_ID && S3_SECRET_ACCESS_KEY)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: ' – Trạm Dừng Cảm Xúc',
    },
    components: {
      graphics: {
        Logo: '@/components/admin/brand/Logo#AdminLogo',
        Icon: '@/components/admin/brand/Icon#AdminIcon',
      },
    },
  },
  // Lock admin interface to Vietnamese only: matches non-technical owner's workflow (HUONG_DAN_CMS.md)
  // and eliminates language-switching confusion.
  i18n: {
    supportedLanguages: { vi },
    fallbackLanguage: 'vi',
  },
  collections: [
    // Trang web
    Pages,
    Posts,
    Testimonials,
    LegalPages,

    // Sản phẩm & bán hàng
    Products,
    Services,
    Programs,
    Orders,
    DiscountCodes,

    // Khóa Habit
    CourseModules,
    Lessons,
    Techniques,
    DiagnosticQuestions,
    Workshops,

    // EQ Buddy
    EqCards,

    // Học viên & khách
    Customers,
    Leads,
    Certificates,
    HabitPlans,

    // Hệ thống
    Users,
    Media,
    PrivateFiles,
    Entitlements,
    HabitCheckins,
    LessonProgress,
    DiagnosticResults,
    SavedCards,
    PaymentEvents,
    AuditLogs,
    TrialReminders,
    WorkshopReminders,
    TrackerNudges,
    OtpCodes,
    RateLimitHits,
    TrialUsage,
  ],
  globals: [Navigation, SiteSettings],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || process.env.DATABASE_URL || '',
      options: '-c timezone=UTC',
    },
    push: false,
    migrationDir: path.resolve(dirname, 'migrations'),
    prodMigrations: migrations,
  }),
  sharp,
  // Register disabled too: schema must be identical with local and R2 storage.
  plugins: [
    s3Storage({
      enabled: storageEnabled,
      alwaysInsertFields: true,
      collections: {
        media: true,
        privateFiles: {
          prefix: 'private',
        },
      },
      bucket: S3_BUCKET || '',
      config: {
        endpoint: S3_ENDPOINT,
        region: process.env.S3_REGION || 'auto',
        credentials: {
          accessKeyId: S3_ACCESS_KEY_ID || '',
          secretAccessKey: S3_SECRET_ACCESS_KEY || '',
        },
      },
    }),
  ],
})
