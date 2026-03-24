// ---------------------------------------------------------------------------
// EI-GAP — Store Swap Tests (TDD — RED phase)
// Verifies env-var-based transparent swap between Memory and Supabase stores.
// ---------------------------------------------------------------------------
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mock Supabase server client (needed by SupabaseStore)
// ---------------------------------------------------------------------------
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    from: vi.fn().mockReturnValue({
      insert: vi.fn().mockReturnValue({ error: null }),
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockReturnValue({ data: null, error: null }),
          maybeSingle: vi.fn().mockReturnValue({ data: null, error: null }),
        }),
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({ error: null }),
      }),
    }),
  }),
}))

// ---------------------------------------------------------------------------
// Helpers to manipulate env
// ---------------------------------------------------------------------------
const ENV = globalThis.process.env
const SB_URL_KEY = 'NEXT_PUBLIC_SUPABASE_URL'
const SB_KEY_KEY = 'SUPABASE_SERVICE_ROLE_KEY'

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Store swap — env var detection', () => {
  let savedUrl: string | undefined
  let savedKey: string | undefined

  beforeEach(() => {
    vi.resetModules()
    savedUrl = ENV[SB_URL_KEY]
    savedKey = ENV[SB_KEY_KEY]
  })

  afterEach(() => {
    if (savedUrl !== undefined) ENV[SB_URL_KEY] = savedUrl
    else delete ENV[SB_URL_KEY]
    if (savedKey !== undefined) ENV[SB_KEY_KEY] = savedKey
    else delete ENV[SB_KEY_KEY]
  })

  it('returns MemoryStore when Supabase env vars are absent', async () => {
    delete ENV[SB_URL_KEY]
    delete ENV[SB_KEY_KEY]

    const { store } = await import('../index')
    const { MemoryStore } = await import('../memory')

    expect(store).toBeInstanceOf(MemoryStore)
  })

  it('returns SupabaseStore when Supabase env vars are present', async () => {
    ENV[SB_URL_KEY] = 'https://test.supabase.co'
    ENV[SB_KEY_KEY] = 'test-service-role-key'

    const { store } = await import('../index')
    const { SupabaseStore } = await import('../supabase')

    expect(store).toBeInstanceOf(SupabaseStore)
  })

  it('returns MemoryStore when only URL is set (missing key)', async () => {
    ENV[SB_URL_KEY] = 'https://test.supabase.co'
    delete ENV[SB_KEY_KEY]

    const { store } = await import('../index')
    const { MemoryStore } = await import('../memory')

    expect(store).toBeInstanceOf(MemoryStore)
  })

  it('returns MemoryStore when only key is set (missing URL)', async () => {
    delete ENV[SB_URL_KEY]
    ENV[SB_KEY_KEY] = 'test-service-role-key'

    const { store } = await import('../index')
    const { MemoryStore } = await import('../memory')

    expect(store).toBeInstanceOf(MemoryStore)
  })
})

describe('Store swap — interface compatibility', () => {
  it('MemoryStore and SupabaseStore expose the same ScanStore methods', async () => {
    const { MemoryStore } = await import('../memory')
    const { SupabaseStore } = await import('../supabase')

    const memory = new MemoryStore()
    const supabase = new SupabaseStore()

    const requiredMethods = [
      'saveScan',
      'getScan',
      'updateScanStatus',
      'saveReport',
      'getReport',
      'saveLead',
    ] as const

    for (const method of requiredMethods) {
      expect(typeof (memory as Record<string, unknown>)[method]).toBe('function')
      expect(typeof (supabase as Record<string, unknown>)[method]).toBe('function')
    }
  })
})
