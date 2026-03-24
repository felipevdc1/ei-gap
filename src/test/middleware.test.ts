import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock @supabase/ssr before importing middleware
const mockGetUser = vi.fn().mockResolvedValue({ data: { user: null }, error: null })
const mockCreateServerClient = vi.fn().mockReturnValue({
  auth: { getUser: mockGetUser },
})

vi.mock('@supabase/ssr', () => ({
  createServerClient: mockCreateServerClient,
}))

// Minimal NextRequest/NextResponse mocks compatible with middleware
function createMockRequest(url = 'http://localhost:3000/dashboard') {
  const cookies = new Map<string, string>()
  return {
    url,
    nextUrl: new URL(url),
    cookies: {
      getAll: () => Array.from(cookies.entries()).map(([name, value]) => ({ name, value })),
      set: (name: string, value: string) => cookies.set(name, value),
    },
  } as unknown as import('next/server').NextRequest
}

describe('middleware', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    vi.resetModules()
    mockCreateServerClient.mockClear()
    mockGetUser.mockClear()
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it('returns passthrough NextResponse.next() when NEXT_PUBLIC_SUPABASE_URL is missing', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    const { middleware } = await import('@/middleware')
    const request = createMockRequest()
    const response = await middleware(request)

    expect(response).toBeDefined()
    expect(mockCreateServerClient).not.toHaveBeenCalled()
  })

  it('returns passthrough NextResponse.next() when NEXT_PUBLIC_SUPABASE_ANON_KEY is missing', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    const { middleware } = await import('@/middleware')
    const request = createMockRequest()
    const response = await middleware(request)

    expect(response).toBeDefined()
    expect(mockCreateServerClient).not.toHaveBeenCalled()
  })

  it('calls createServerClient when both env vars are present', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'

    const { middleware } = await import('@/middleware')
    const request = createMockRequest()
    await middleware(request)

    expect(mockCreateServerClient).toHaveBeenCalledWith(
      'https://example.supabase.co',
      'test-anon-key',
      expect.objectContaining({ cookies: expect.any(Object) })
    )
    expect(mockGetUser).toHaveBeenCalled()
  })

  it('exports a matcher config that excludes static assets', async () => {
    const { config } = await import('@/middleware')

    expect(config).toBeDefined()
    expect(config.matcher).toBeDefined()
    expect(config.matcher.length).toBeGreaterThan(0)

    // The matcher regex should exclude common static file extensions
    const matcherPattern = config.matcher[0]
    expect(matcherPattern).toContain('_next/static')
    expect(matcherPattern).toContain('_next/image')
    expect(matcherPattern).toContain('favicon.ico')
  })
})
