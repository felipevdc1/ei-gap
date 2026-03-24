import { http, HttpResponse } from 'msw'

import intakeFixture from '@/test/fixtures/intake.json'
import extractionFixture from '@/test/fixtures/extraction.json'
import scoringFixture from '@/test/fixtures/scoring.json'
import rankingFixture from '@/test/fixtures/ranking.json'
import reportFixture from '@/test/fixtures/report.json'

/**
 * Maps system prompt keywords to the appropriate LLM phase fixture.
 * Each phase of the EI-GAP pipeline uses a distinct system prompt
 * that identifies which agent/role is active.
 */
const phaseFixtureMap: Record<string, object> = {
  'scanner-chief-intake': intakeFixture,
  'business-analyst': extractionFixture,
  'process-architect': scoringFixture,
  'growth-strategist': rankingFixture,
  'scanner-chief-report': reportFixture,
}

/**
 * Resolves the correct fixture based on the system prompt content.
 * Falls back to intake fixture if no phase keyword matches.
 */
function resolveFixture(systemPrompt: string): object {
  for (const [keyword, fixture] of Object.entries(phaseFixtureMap)) {
    if (systemPrompt.includes(keyword)) {
      return fixture
    }
  }
  return intakeFixture
}

export const handlers = [
  http.post('https://openrouter.ai/api/v1/chat/completions', async ({ request }) => {
    const body = (await request.json()) as {
      messages?: Array<{ role: string; content: string }>
    }

    const systemMessage = body.messages?.find((m) => m.role === 'system')
    const systemPrompt = systemMessage?.content ?? ''

    const fixture = resolveFixture(systemPrompt)

    return HttpResponse.json(fixture)
  }),
]
