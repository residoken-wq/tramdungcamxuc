import { describe, expect, it } from 'vitest'
import config from '../../src/payload.config'

describe('Admin Payload i18n configuration (T0-12)', () => {
  it('should configure Payload admin with Vietnamese fallback language', async () => {
    const resolvedConfig = await config
    expect(resolvedConfig.i18n?.fallbackLanguage).toBe('vi')
  })

  it('should support only Vietnamese in admin supportedLanguages', async () => {
    const resolvedConfig = await config
    const supportedLangs = Object.keys(resolvedConfig.i18n?.supportedLanguages || {})
    expect(supportedLangs).toEqual(['vi'])
  })

  it('should load accurate Vietnamese UI translations matching HUONG_DAN_CMS.md', async () => {
    const resolvedConfig = await config
    const viLanguage = resolvedConfig.i18n?.supportedLanguages?.vi
    expect(viLanguage).toBeDefined()

    const translations = viLanguage?.translations
    expect(translations).toBeDefined()

    // Key actions referenced in HUONG_DAN_CMS.md
    expect(translations?.general?.createNew).toBe('Tạo mới')
    expect(translations?.general?.save).toBe('Lưu')
    expect(translations?.version?.saveDraft).toBe('Lưu bản nháp')
    expect(translations?.version?.publish).toBe('Xuất bản')
    expect(translations?.authentication?.login).toBe('Đăng nhập')
    expect(translations?.authentication?.changePassword).toBe('Đổi mật khẩu')
    expect(translations?.authentication?.newPassword).toBe('Mật khẩu mới')
  })
})
