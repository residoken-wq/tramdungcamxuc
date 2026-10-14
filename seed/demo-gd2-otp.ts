// REVIEW-REQUIRED: Script CLI sinh mã OTP đăng nhập cho khách demo GĐ 2.
// Email @example.test không nhận được email thật, nên script này sinh mã 6 số trực tiếp từ dòng lệnh
// mà không cần mở backdoor trong ứng dụng web.
// Usage: DEMO_SEED_ALLOW=true DEMO_EMAIL=hoc-vien-test-01@example.test pnpm seed:demo-gd2:otp
import { getPayload } from 'payload'
import config from '../src/payload.config'
import { collectDemoSeedFacts, createDemoOtp, DEMO_EMAILS } from './demo-gd2-lib'
import { checkDemoSeedAllowed, checkDemoSeedEnv } from './demo-guard'

const envGuard = checkDemoSeedEnv(process.env)
if (!envGuard.ok) {
  console.error(envGuard.reason)
  process.exit(1)
}

const payload = await getPayload({ config })

try {
  // 1. Kiểm tra guard an toàn
  const facts = await collectDemoSeedFacts(payload)
  const guard = checkDemoSeedAllowed(process.env, facts)

  if (!guard.ok) {
    console.error(guard.reason)
    await payload.destroy()
    process.exit(1)
  }

  // 2. Kiểm tra email demo
  const rawEmail = process.env.DEMO_EMAIL
  if (!rawEmail || !rawEmail.trim()) {
    console.error(
      `Từ chối: Vui lòng chỉ định email demo qua biến môi trường DEMO_EMAIL (ví dụ: DEMO_EMAIL=hoc-vien-test-01@example.test).\nDanh sách email demo được phép: ${DEMO_EMAILS.join(', ')}`,
    )
    await payload.destroy()
    process.exit(1)
  }

  const email = rawEmail.trim().toLowerCase()
  if (!DEMO_EMAILS.includes(email as (typeof DEMO_EMAILS)[number])) {
    console.error(
      `Từ chối: Email '${email}' không thuộc danh sách khách hàng demo GĐ 2.\nChỉ chấp nhận các email: ${DEMO_EMAILS.join(', ')}`,
    )
    await payload.destroy()
    process.exit(1)
  }

  // 3. Sinh mã OTP và lưu vào DB
  const { code } = await createDemoOtp(payload, email)

  console.log('\n==============================================================')
  console.log('MÃ ĐĂNG NHẬP OTP CHO KHÁCH DEMO:')
  console.log(`Email  : ${email}`)
  console.log(`Mã OTP : ${code}`)
  console.log('Hiệu lực: 10 phút')
  console.log('Hướng dẫn: Nhập mã này tại trang /tai-khoan/dang-nhap để đăng nhập.')
  console.log('==============================================================\n')
} catch (error) {
  console.error('Lỗi khi sinh mã OTP demo:', error)
  await payload.destroy()
  process.exit(1)
} finally {
  await payload.destroy()
}

process.exit(0)
