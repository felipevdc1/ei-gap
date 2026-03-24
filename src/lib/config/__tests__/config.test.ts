import { describe, it, expect, beforeEach, vi } from 'vitest'

// We need to reset the cached config between tests
// getConfig is lazy-loaded and caches after first call
let getConfig: () => ReturnType<typeof import('../config').getConfig>

describe('config — env var validation via Zod', () => {
  const REQUIRED_ENV = {
    OPENROUTER_API_KEY: 'sk-test-key-123',
    OPENROUTER_MODEL: 'google/gemini-2.0-flash-lite-001',
    NEXT_PUBLIC_SITE_URL: 'https://ei-gap.com',
    NEXT_PUBLIC_CTA_URL: 'https://wa.me/5511999999999',
  }

  beforeEach(async () => {
    // Clear all env stubs
    vi.unstubAllEnvs()
    // Reset module cache so getConfig() re-validates
    vi.resetModules()
    const mod = await import('../config')
    getConfig = mod.getConfig
  })

  describe('required env vars', () => {
    it('throws when OPENROUTER_API_KEY is missing', () => {
      vi.stubEnv('OPENROUTER_MODEL', REQUIRED_ENV.OPENROUTER_MODEL)
      vi.stubEnv('NEXT_PUBLIC_SITE_URL', REQUIRED_ENV.NEXT_PUBLIC_SITE_URL)
      vi.stubEnv('NEXT_PUBLIC_CTA_URL', REQUIRED_ENV.NEXT_PUBLIC_CTA_URL)

      expect(() => getConfig()).toThrow('OPENROUTER_API_KEY')
    })

    it('throws when OPENROUTER_MODEL is missing', () => {
      vi.stubEnv('OPENROUTER_API_KEY', REQUIRED_ENV.OPENROUTER_API_KEY)
      vi.stubEnv('NEXT_PUBLIC_SITE_URL', REQUIRED_ENV.NEXT_PUBLIC_SITE_URL)
      vi.stubEnv('NEXT_PUBLIC_CTA_URL', REQUIRED_ENV.NEXT_PUBLIC_CTA_URL)

      expect(() => getConfig()).toThrow('OPENROUTER_MODEL')
    })

    it('throws when NEXT_PUBLIC_SITE_URL is missing', () => {
      vi.stubEnv('OPENROUTER_API_KEY', REQUIRED_ENV.OPENROUTER_API_KEY)
      vi.stubEnv('OPENROUTER_MODEL', REQUIRED_ENV.OPENROUTER_MODEL)
      vi.stubEnv('NEXT_PUBLIC_CTA_URL', REQUIRED_ENV.NEXT_PUBLIC_CTA_URL)

      expect(() => getConfig()).toThrow('NEXT_PUBLIC_SITE_URL')
    })

    it('throws when NEXT_PUBLIC_CTA_URL is missing', () => {
      vi.stubEnv('OPENROUTER_API_KEY', REQUIRED_ENV.OPENROUTER_API_KEY)
      vi.stubEnv('OPENROUTER_MODEL', REQUIRED_ENV.OPENROUTER_MODEL)
      vi.stubEnv('NEXT_PUBLIC_SITE_URL', REQUIRED_ENV.NEXT_PUBLIC_SITE_URL)

      expect(() => getConfig()).toThrow('NEXT_PUBLIC_CTA_URL')
    })

    it('throws descriptive error listing all missing required vars', () => {
      // No env vars set at all
      expect(() => getConfig()).toThrow(/missing.*required.*env/i)
    })

    it('returns config when all required vars are present', () => {
      for (const [key, value] of Object.entries(REQUIRED_ENV)) {
        vi.stubEnv(key, value)
      }

      const config = getConfig()

      expect(config.openrouter.apiKey).toBe(REQUIRED_ENV.OPENROUTER_API_KEY)
      expect(config.openrouter.model).toBe(REQUIRED_ENV.OPENROUTER_MODEL)
      expect(config.site.url).toBe(REQUIRED_ENV.NEXT_PUBLIC_SITE_URL)
      expect(config.site.ctaUrl).toBe(REQUIRED_ENV.NEXT_PUBLIC_CTA_URL)
    })
  })

  describe('optional env vars with defaults', () => {
    beforeEach(() => {
      for (const [key, value] of Object.entries(REQUIRED_ENV)) {
        vi.stubEnv(key, value)
      }
    })

    it('uses default OPENROUTER_TIMEOUT_MS of 30000', () => {
      const config = getConfig()
      expect(config.openrouter.timeoutMs).toBe(30000)
    })

    it('uses default OPENROUTER_MAX_RETRIES of 3', () => {
      const config = getConfig()
      expect(config.openrouter.maxRetries).toBe(3)
    })

    it('uses default RATE_LIMIT_PER_IP of 5', () => {
      const config = getConfig()
      expect(config.rateLimit.perIp).toBe(5)
    })

    it('uses undefined as default for OPENROUTER_FALLBACK_MODEL', () => {
      const config = getConfig()
      expect(config.openrouter.fallbackModel).toBeUndefined()
    })

    it('overrides OPENROUTER_TIMEOUT_MS when provided', () => {
      vi.stubEnv('OPENROUTER_TIMEOUT_MS', '60000')
      const config = getConfig()
      expect(config.openrouter.timeoutMs).toBe(60000)
    })

    it('overrides OPENROUTER_MAX_RETRIES when provided', () => {
      vi.stubEnv('OPENROUTER_MAX_RETRIES', '5')
      const config = getConfig()
      expect(config.openrouter.maxRetries).toBe(5)
    })

    it('overrides RATE_LIMIT_PER_IP when provided', () => {
      vi.stubEnv('RATE_LIMIT_PER_IP', '10')
      const config = getConfig()
      expect(config.rateLimit.perIp).toBe(10)
    })

    it('uses OPENROUTER_FALLBACK_MODEL when provided', () => {
      vi.stubEnv('OPENROUTER_FALLBACK_MODEL', 'openai/gpt-4o-mini')
      const config = getConfig()
      expect(config.openrouter.fallbackModel).toBe('openai/gpt-4o-mini')
    })
  })

  describe('Supabase env vars — optional (Phase 5 guard)', () => {
    beforeEach(() => {
      for (const [key, value] of Object.entries(REQUIRED_ENV)) {
        vi.stubEnv(key, value)
      }
    })

    it('returns undefined supabase config when vars are not set', () => {
      const config = getConfig()
      expect(config.supabase).toBeUndefined()
    })

    it('returns supabase config when all supabase vars are set', () => {
      vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://abc.supabase.co')
      vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key-123')
      vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-role-key-456')

      const config = getConfig()
      expect(config.supabase).toBeDefined()
      expect(config.supabase!.url).toBe('https://abc.supabase.co')
      expect(config.supabase!.anonKey).toBe('anon-key-123')
      expect(config.supabase!.serviceRoleKey).toBe('service-role-key-456')
    })

    it('returns undefined supabase config when only partial supabase vars are set', () => {
      vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://abc.supabase.co')
      // Missing anon key and service role key

      const config = getConfig()
      expect(config.supabase).toBeUndefined()
    })
  })

  describe('caching behavior', () => {
    it('returns the same object reference on subsequent calls', () => {
      for (const [key, value] of Object.entries(REQUIRED_ENV)) {
        vi.stubEnv(key, value)
      }

      const config1 = getConfig()
      const config2 = getConfig()
      expect(config1).toBe(config2)
    })
  })

  describe('type coercion', () => {
    beforeEach(() => {
      for (const [key, value] of Object.entries(REQUIRED_ENV)) {
        vi.stubEnv(key, value)
      }
    })

    it('coerces OPENROUTER_TIMEOUT_MS to number', () => {
      vi.stubEnv('OPENROUTER_TIMEOUT_MS', '45000')
      const config = getConfig()
      expect(typeof config.openrouter.timeoutMs).toBe('number')
    })

    it('coerces OPENROUTER_MAX_RETRIES to number', () => {
      vi.stubEnv('OPENROUTER_MAX_RETRIES', '2')
      const config = getConfig()
      expect(typeof config.openrouter.maxRetries).toBe('number')
    })

    it('coerces RATE_LIMIT_PER_IP to number', () => {
      vi.stubEnv('RATE_LIMIT_PER_IP', '20')
      const config = getConfig()
      expect(typeof config.rateLimit.perIp).toBe('number')
    })

    it('throws on invalid numeric value for OPENROUTER_TIMEOUT_MS', () => {
      vi.stubEnv('OPENROUTER_TIMEOUT_MS', 'not-a-number')
      expect(() => getConfig()).toThrow()
    })

    it('throws on negative OPENROUTER_TIMEOUT_MS', () => {
      vi.stubEnv('OPENROUTER_TIMEOUT_MS', '-1')
      expect(() => getConfig()).toThrow()
    })

    it('throws on negative OPENROUTER_MAX_RETRIES', () => {
      vi.stubEnv('OPENROUTER_MAX_RETRIES', '-1')
      expect(() => getConfig()).toThrow()
    })

    it('throws on zero RATE_LIMIT_PER_IP', () => {
      vi.stubEnv('RATE_LIMIT_PER_IP', '0')
      expect(() => getConfig()).toThrow()
    })
  })
})
