import { http, HttpResponse, delay } from 'msw'
import { server } from '@/test/mocks/server'
import { _resetConfigCache } from '@/lib/config/config'

// Stub env vars BEFORE importing the module under test
function stubEnv() {
  vi.stubEnv('OPENROUTER_API_KEY', 'test-api-key-123')
  vi.stubEnv('OPENROUTER_MODEL', 'google/gemini-2.0-flash-001')
  vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://ei-gap.test')
  vi.stubEnv('NEXT_PUBLIC_CTA_URL', 'https://ei-gap.test/cta')
  vi.stubEnv('OPENROUTER_TIMEOUT_MS', '30000')
}

describe('openrouter/client — chatCompletion', () => {
  beforeEach(() => {
    stubEnv()
    _resetConfigCache()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    _resetConfigCache()
  })

  it('returns content string from a successful chat completion', async () => {
    const expectedContent = 'Hello from OpenRouter!'

    server.use(
      http.post('https://openrouter.ai/api/v1/chat/completions', () => {
        return HttpResponse.json({
          id: 'chatcmpl-test',
          object: 'chat.completion',
          choices: [
            {
              index: 0,
              message: { role: 'assistant', content: expectedContent },
              finish_reason: 'stop',
            },
          ],
          usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
        })
      }),
    )

    const { chatCompletion } = await import('@/lib/openrouter/client')
    const result = await chatCompletion('You are a helpful assistant.', 'Say hello.')

    expect(result).toBe(expectedContent)
  })

  it('sends correct OpenRouter headers (HTTP-Referer, X-Title)', async () => {
    let capturedHeaders: Record<string, string> = {}

    server.use(
      http.post('https://openrouter.ai/api/v1/chat/completions', ({ request }) => {
        capturedHeaders = {
          'http-referer': request.headers.get('HTTP-Referer') ?? '',
          'x-title': request.headers.get('X-Title') ?? '',
          authorization: request.headers.get('Authorization') ?? '',
        }

        return HttpResponse.json({
          id: 'chatcmpl-headers',
          object: 'chat.completion',
          choices: [
            {
              index: 0,
              message: { role: 'assistant', content: 'ok' },
              finish_reason: 'stop',
            },
          ],
        })
      }),
    )

    const { chatCompletion } = await import('@/lib/openrouter/client')
    await chatCompletion('system', 'user')

    expect(capturedHeaders['http-referer']).toBe('https://ei-gap.test')
    expect(capturedHeaders['x-title']).toBe('EI-GAP AI Scanner')
    expect(capturedHeaders['authorization']).toBe('Bearer test-api-key-123')
  })

  it('uses the model from OPENROUTER_MODEL config', async () => {
    let capturedModel = ''

    server.use(
      http.post('https://openrouter.ai/api/v1/chat/completions', async ({ request }) => {
        const body = (await request.json()) as { model?: string }
        capturedModel = body.model ?? ''

        return HttpResponse.json({
          id: 'chatcmpl-model',
          object: 'chat.completion',
          choices: [
            {
              index: 0,
              message: { role: 'assistant', content: 'ok' },
              finish_reason: 'stop',
            },
          ],
        })
      }),
    )

    const { chatCompletion } = await import('@/lib/openrouter/client')
    await chatCompletion('system', 'user')

    expect(capturedModel).toBe('google/gemini-2.0-flash-001')
  })

  it('throws AbortError when timeout fires', async () => {
    // Use a very short timeout for the test
    vi.stubEnv('OPENROUTER_TIMEOUT_MS', '100')
    _resetConfigCache()

    server.use(
      http.post('https://openrouter.ai/api/v1/chat/completions', async () => {
        // Delay longer than the timeout
        await delay(5000)
        return HttpResponse.json({
          id: 'chatcmpl-slow',
          object: 'chat.completion',
          choices: [
            {
              index: 0,
              message: { role: 'assistant', content: 'too late' },
              finish_reason: 'stop',
            },
          ],
        })
      }),
    )

    const { chatCompletion } = await import('@/lib/openrouter/client')

    await expect(chatCompletion('system', 'user')).rejects.toThrow(/timed out|aborted/i)
  })

  it('throws with rate limit info on 429 response', async () => {
    server.use(
      http.post('https://openrouter.ai/api/v1/chat/completions', () => {
        return HttpResponse.json(
          {
            error: {
              message: 'Rate limit exceeded. Please wait 30 seconds.',
              type: 'rate_limit_error',
              code: 429,
            },
          },
          {
            status: 429,
            headers: {
              'Retry-After': '30',
              'X-RateLimit-Limit': '10',
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': '1700000000',
            },
          },
        )
      }),
    )

    const { chatCompletion } = await import('@/lib/openrouter/client')

    await expect(chatCompletion('system', 'user')).rejects.toThrow(/429|rate.limit/i)
  })

  it('returns null when choices[0].message.content is null', async () => {
    server.use(
      http.post('https://openrouter.ai/api/v1/chat/completions', () => {
        return HttpResponse.json({
          id: 'chatcmpl-null',
          object: 'chat.completion',
          choices: [
            {
              index: 0,
              message: { role: 'assistant', content: null },
              finish_reason: 'stop',
            },
          ],
        })
      }),
    )

    const { chatCompletion } = await import('@/lib/openrouter/client')
    const result = await chatCompletion('system', 'user')

    expect(result).toBeNull()
  })

  it('accepts optional overrides (model, timeout)', async () => {
    let capturedModel = ''

    server.use(
      http.post('https://openrouter.ai/api/v1/chat/completions', async ({ request }) => {
        const body = (await request.json()) as { model?: string }
        capturedModel = body.model ?? ''

        return HttpResponse.json({
          id: 'chatcmpl-override',
          object: 'chat.completion',
          choices: [
            {
              index: 0,
              message: { role: 'assistant', content: 'overridden' },
              finish_reason: 'stop',
            },
          ],
        })
      }),
    )

    const { chatCompletion } = await import('@/lib/openrouter/client')
    const result = await chatCompletion('system', 'user', {
      model: 'anthropic/claude-3-haiku',
      timeoutMs: 60000,
    })

    expect(result).toBe('overridden')
    expect(capturedModel).toBe('anthropic/claude-3-haiku')
  })
})
