import OpenAI from 'openai'
import { getConfig } from '@/lib/config/config'

export interface ChatCompletionOptions {
  /** Override the default model */
  model?: string
  /** Override the default timeout in milliseconds */
  timeoutMs?: number
}

/**
 * Calls OpenRouter's chat completions endpoint via the OpenAI SDK.
 *
 * @param systemPrompt - The system message content
 * @param userMessage - The user message content
 * @param options - Optional overrides for model and timeout
 * @returns The assistant's response content string, or null if content is null
 */
export async function chatCompletion(
  systemPrompt: string,
  userMessage: string,
  options?: ChatCompletionOptions,
): Promise<string | null> {
  const config = getConfig()

  const model = options?.model ?? config.openrouter.model
  const timeoutMs = options?.timeoutMs ?? config.openrouter.timeoutMs

  const client = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: config.openrouter.apiKey,
    maxRetries: 0, // No SDK-level retries; retry logic lives in the pipeline (E2)
    dangerouslyAllowBrowser: true, // Safe: runs server-side only; flag needed for jsdom test env
    defaultHeaders: {
      'HTTP-Referer': config.site.url,
      'X-Title': 'EI-GAP AI Scanner',
    },
  })

  // AbortController for per-call timeout
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await client.chat.completions.create(
      {
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
      },
      { signal: controller.signal },
    )

    return response.choices[0]?.message?.content ?? null
  } catch (error: unknown) {
    // Re-throw with a clearer message for abort/timeout
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`OpenRouter request timed out after ${timeoutMs}ms`)
    }
    throw error
  } finally {
    clearTimeout(timer)
  }
}
