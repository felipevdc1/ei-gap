import { describe, it, expect } from 'vitest'
import intakeFixture from '@/test/fixtures/intake.json'
import extractionFixture from '@/test/fixtures/extraction.json'
import scoringFixture from '@/test/fixtures/scoring.json'
import rankingFixture from '@/test/fixtures/ranking.json'
import reportFixture from '@/test/fixtures/report.json'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

async function callOpenRouter(systemPrompt: string) {
  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'openai/gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Analyze this business.' },
      ],
    }),
  })

  return response.json()
}

describe('MSW OpenRouter mock', () => {
  it('intercepts OpenRouter call and returns valid response structure', async () => {
    const data = await callOpenRouter('scanner-chief-intake: analyze the business profile')

    expect(data).toHaveProperty('id')
    expect(data).toHaveProperty('choices')
    expect(data.choices).toHaveLength(1)
    expect(data.choices[0].message).toHaveProperty('content')
    expect(data.choices[0].message.role).toBe('assistant')
    expect(data.choices[0].finish_reason).toBe('stop')
  })

  it('returns intake fixture for scanner-chief-intake phase', async () => {
    const data = await callOpenRouter('scanner-chief-intake: analyze the business profile')
    expect(data).toEqual(intakeFixture)

    const content = JSON.parse(data.choices[0].message.content)
    expect(content).toHaveProperty('company_name')
    expect(content).toHaveProperty('sector')
    expect(content).toHaveProperty('size')
    expect(content).toHaveProperty('tech_maturity')
    expect(content).toHaveProperty('processes')
  })

  it('returns extraction fixture for business-analyst phase', async () => {
    const data = await callOpenRouter('business-analyst: extract process map')
    expect(data).toEqual(extractionFixture)

    const content = JSON.parse(data.choices[0].message.content)
    expect(content).toHaveProperty('processes')
    expect(content.processes).toHaveLength(5)
    expect(content.processes[0]).toHaveProperty('name')
    expect(content.processes[0]).toHaveProperty('time_per_week')
    expect(content.processes[0]).toHaveProperty('pain_level')
    expect(content.processes[0]).toHaveProperty('opportunities')
  })

  it('returns scoring fixture for process-architect phase', async () => {
    const data = await callOpenRouter('process-architect: score opportunities')
    expect(data).toEqual(scoringFixture)

    const content = JSON.parse(data.choices[0].message.content)
    expect(content).toHaveProperty('opportunities')
    expect(content.opportunities[0]).toHaveProperty('impact')
    expect(content.opportunities[0]).toHaveProperty('feasibility')
    expect(content.opportunities[0]).toHaveProperty('effort')
    expect(content.opportunities[0]).toHaveProperty('roi')
  })

  it('returns ranking fixture for growth-strategist phase', async () => {
    const data = await callOpenRouter('growth-strategist: rank and prioritize')
    expect(data).toEqual(rankingFixture)

    const content = JSON.parse(data.choices[0].message.content)
    expect(content).toHaveProperty('ranked')
    expect(content).toHaveProperty('roi_ranges')
    expect(content).toHaveProperty('loss_aversion')
    expect(content.ranked[0]).toHaveProperty('rank')
    expect(content.ranked[0]).toHaveProperty('roi')
    expect(content.ranked[0]).toHaveProperty('category')
  })

  it('returns report fixture for scanner-chief-report phase', async () => {
    const data = await callOpenRouter('scanner-chief-report: generate final report')
    expect(data).toEqual(reportFixture)

    const content = JSON.parse(data.choices[0].message.content)
    expect(content).toHaveProperty('executive_summary')
    expect(content).toHaveProperty('opportunities')
    expect(content.opportunities).toHaveLength(10)
    expect(content).toHaveProperty('total_roi')
    expect(content).toHaveProperty('cost_of_inaction')
  })

  it('falls back to intake fixture for unknown system prompts', async () => {
    const data = await callOpenRouter('unknown-agent: do something')
    expect(data).toEqual(intakeFixture)
  })
})
