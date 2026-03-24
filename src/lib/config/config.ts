import { z } from 'zod'

const positiveInt = z.coerce.number().int().positive()

const envSchema = z.object({
  // Required
  OPENROUTER_API_KEY: z.string().min(1, 'OPENROUTER_API_KEY is required'),
  OPENROUTER_MODEL: z.string().min(1, 'OPENROUTER_MODEL is required'),
  NEXT_PUBLIC_SITE_URL: z.string().url('NEXT_PUBLIC_SITE_URL must be a valid URL'),
  NEXT_PUBLIC_CTA_URL: z.string().min(1, 'NEXT_PUBLIC_CTA_URL is required'),

  // Optional with defaults
  OPENROUTER_TIMEOUT_MS: positiveInt.default(30000),
  OPENROUTER_MAX_RETRIES: z.coerce.number().int().nonnegative().default(3),
  OPENROUTER_FALLBACK_MODEL: z.string().optional(),
  RATE_LIMIT_PER_IP: positiveInt.default(5),

  // Supabase — all optional
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
})

export interface AppConfig {
  openrouter: {
    apiKey: string
    model: string
    timeoutMs: number
    maxRetries: number
    fallbackModel: string | undefined
  }
  site: {
    url: string
    ctaUrl: string
  }
  rateLimit: {
    perIp: number
  }
  supabase:
    | {
        url: string
        anonKey: string
        serviceRoleKey: string
      }
    | undefined
}

function buildConfig(env: z.infer<typeof envSchema>): AppConfig {
  // Supabase guard: only return supabase config if ALL three vars are present
  const supabase =
    env.NEXT_PUBLIC_SUPABASE_URL &&
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    env.SUPABASE_SERVICE_ROLE_KEY
      ? {
          url: env.NEXT_PUBLIC_SUPABASE_URL,
          anonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
        }
      : undefined

  return {
    openrouter: {
      apiKey: env.OPENROUTER_API_KEY,
      model: env.OPENROUTER_MODEL,
      timeoutMs: env.OPENROUTER_TIMEOUT_MS,
      maxRetries: env.OPENROUTER_MAX_RETRIES,
      fallbackModel: env.OPENROUTER_FALLBACK_MODEL,
    },
    site: {
      url: env.NEXT_PUBLIC_SITE_URL,
      ctaUrl: env.NEXT_PUBLIC_CTA_URL,
    },
    rateLimit: {
      perIp: env.RATE_LIMIT_PER_IP,
    },
    supabase,
  }
}

function formatZodError(error: z.ZodError): string {
  const issues = error.issues.map((issue) => {
    const path = issue.path.join('.')
    return `  - ${path}: ${issue.message}`
  })
  return `Missing or invalid required env vars:\n${issues.join('\n')}`
}

let cachedConfig: AppConfig | null = null

export function getConfig(): AppConfig {
  if (cachedConfig) return cachedConfig

  const result = envSchema.safeParse(process.env)

  if (!result.success) {
    throw new Error(formatZodError(result.error))
  }

  cachedConfig = buildConfig(result.data)
  return cachedConfig
}

// Exported for testing — allows cache reset
export function _resetConfigCache(): void {
  cachedConfig = null
}
