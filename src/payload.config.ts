import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import { s3Storage } from '@payloadcms/storage-s3'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
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
import { Pages } from './collections/Pages'
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
  },
  collections: [
    Users,
    Media,
    Products,
    Services,
    Programs,
    Posts,
    Testimonials,
    EqCards,
    CourseModules,
    Lessons,
    DiagnosticQuestions,
    Techniques,
    LegalPages,
    Workshops,
    Pages,
  ],
  globals: [SiteSettings, Navigation],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || process.env.DATABASE_URL || '',
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
      collections: { media: true },
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
