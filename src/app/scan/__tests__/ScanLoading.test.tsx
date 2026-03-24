import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import * as matchers from 'vitest-axe/matchers'
import { ScanLoading } from '../components/ScanLoading'

expect.extend(matchers)

// ---------------------------------------------------------------------------
// Mock next/navigation
// ---------------------------------------------------------------------------

const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Creates a mock ReadableStream that emits SSE events.
 * Each event is an object with type, phase, name, and optional fields.
 */
function createMockSSEResponse(events: Array<Record<string, unknown>>): Response {
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    start(controller) {
      for (const event of events) {
        const payload = `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`
        controller.enqueue(encoder.encode(payload))
      }
      controller.close()
    },
  })

  return new Response(stream, {
    status: 200,
    headers: { 'Content-Type': 'text/event-stream' },
  })
}

function createMockFetchForSSE(events: Array<Record<string, unknown>>) {
  return vi.fn().mockResolvedValue(createMockSSEResponse(events))
}

const defaultFormData = {
  sector: 'varejo',
  company_name: 'Acme Corp',
  company_size: '11-50' as const,
  tech_maturity: 'medium' as const,
  current_tools: 'Slack',
  sector_answers: { q0: 'answer' },
  processes: [
    { name: 'Process 1', time_per_week: 10, pain_level: 3 as const },
    { name: 'Process 2', time_per_week: 5, pain_level: 2 as const },
    { name: 'Process 3', time_per_week: 8, pain_level: 4 as const },
  ],
}

function renderLoading(overrides: { onRetry?: () => void; formData?: typeof defaultFormData } = {}) {
  const onRetry = overrides.onRetry ?? vi.fn()
  return {
    ...render(
      <ScanLoading formData={overrides.formData ?? defaultFormData} onRetry={onRetry} />,
    ),
    onRetry,
  }
}

// ---------------------------------------------------------------------------
// Setup / Teardown
// ---------------------------------------------------------------------------

let originalFetch: typeof globalThis.fetch

beforeEach(() => {
  originalFetch = globalThis.fetch
  mockPush.mockClear()
})

afterEach(() => {
  globalThis.fetch = originalFetch
})

// ---------------------------------------------------------------------------
// 1. Submit calls API and starts SSE
// ---------------------------------------------------------------------------

describe('ScanLoading — API Call & SSE', () => {
  it('calls POST /api/scan on mount with form data', async () => {
    const mockFetch = createMockFetchForSSE([
      { type: 'phase_start', phase: 1, name: 'intake' },
      { type: 'scan_complete', phase: 5, name: 'report', reportId: 'abc123' },
    ])
    globalThis.fetch = mockFetch

    renderLoading()

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(defaultFormData),
      })
    })
  })

  it('shows initial loading state', () => {
    globalThis.fetch = vi.fn().mockReturnValue(new Promise(() => {})) // never resolves
    renderLoading()

    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// 2. Progress updates with SSE events
// ---------------------------------------------------------------------------

describe('ScanLoading — Progress Updates', () => {
  it('shows phase message for phase 1', async () => {
    const mockFetch = createMockFetchForSSE([
      { type: 'phase_start', phase: 1, name: 'intake' },
    ])
    globalThis.fetch = mockFetch

    renderLoading()

    await waitFor(() => {
      expect(screen.getByText(/Analisando seu negócio/i)).toBeInTheDocument()
    })
  })

  it('shows phase message for phase 2', async () => {
    const mockFetch = createMockFetchForSSE([
      { type: 'phase_start', phase: 1, name: 'intake' },
      { type: 'phase_complete', phase: 1, name: 'intake' },
      { type: 'phase_start', phase: 2, name: 'extraction' },
    ])
    globalThis.fetch = mockFetch

    renderLoading()

    await waitFor(() => {
      expect(screen.getByText(/Mapeando processos/i)).toBeInTheDocument()
    })
  })

  it('updates progress percentage as phases complete', async () => {
    const mockFetch = createMockFetchForSSE([
      { type: 'phase_start', phase: 1, name: 'intake' },
      { type: 'phase_complete', phase: 1, name: 'intake' },
      { type: 'phase_start', phase: 2, name: 'extraction' },
      { type: 'phase_complete', phase: 2, name: 'extraction' },
      { type: 'phase_start', phase: 3, name: 'scoring' },
    ])
    globalThis.fetch = mockFetch

    renderLoading()

    await waitFor(() => {
      const progressbar = screen.getByRole('progressbar')
      const value = Number(progressbar.getAttribute('aria-valuenow'))
      expect(value).toBeGreaterThanOrEqual(40) // 2 of 5 phases complete = 40%
    })
  })

  it('has aria-live="polite" on progress region', async () => {
    globalThis.fetch = createMockFetchForSSE([
      { type: 'phase_start', phase: 1, name: 'intake' },
    ])

    renderLoading()

    await waitFor(() => {
      const liveRegion = screen.getByRole('progressbar').closest('[aria-live="polite"]')
        ?? screen.getByRole('progressbar')
      // Check if the progressbar itself or its parent has aria-live
      const hasAriaLive =
        liveRegion.getAttribute('aria-live') === 'polite' ||
        liveRegion.parentElement?.getAttribute('aria-live') === 'polite'
      expect(hasAriaLive).toBe(true)
    })
  })
})

// ---------------------------------------------------------------------------
// 3. Redirect on complete
// ---------------------------------------------------------------------------

describe('ScanLoading — Redirect', () => {
  it('redirects to /report/{id} on scan_complete event', async () => {
    const mockFetch = createMockFetchForSSE([
      { type: 'phase_start', phase: 1, name: 'intake' },
      { type: 'phase_complete', phase: 1, name: 'intake' },
      { type: 'phase_start', phase: 2, name: 'extraction' },
      { type: 'phase_complete', phase: 2, name: 'extraction' },
      { type: 'phase_start', phase: 3, name: 'scoring' },
      { type: 'phase_complete', phase: 3, name: 'scoring' },
      { type: 'phase_start', phase: 4, name: 'ranking' },
      { type: 'phase_complete', phase: 4, name: 'ranking' },
      { type: 'phase_start', phase: 5, name: 'report' },
      { type: 'phase_complete', phase: 5, name: 'report' },
      { type: 'scan_complete', phase: 5, name: 'report', reportId: 'rpt-xyz-123' },
    ])
    globalThis.fetch = mockFetch

    renderLoading()

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/report/rpt-xyz-123')
    })
  })
})

// ---------------------------------------------------------------------------
// 4. Error shows friendly message + retry
// ---------------------------------------------------------------------------

describe('ScanLoading — Error Handling', () => {
  it('shows friendly error message on scan_error event', async () => {
    const mockFetch = createMockFetchForSSE([
      { type: 'phase_start', phase: 1, name: 'intake' },
      { type: 'scan_error', phase: 1, name: 'intake', error: 'LLM timeout' },
    ])
    globalThis.fetch = mockFetch

    renderLoading()

    await waitFor(() => {
      expect(screen.getByText(/Ocorreu um erro/i)).toBeInTheDocument()
    })
  })

  it('shows "Tentar novamente" button on error', async () => {
    const mockFetch = createMockFetchForSSE([
      { type: 'scan_error', phase: 0, name: 'stream', error: 'fail' },
    ])
    globalThis.fetch = mockFetch

    renderLoading()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /tentar novamente/i })).toBeInTheDocument()
    })
  })

  it('calls onRetry when clicking "Tentar novamente"', async () => {
    const mockFetch = createMockFetchForSSE([
      { type: 'scan_error', phase: 0, name: 'stream', error: 'fail' },
    ])
    globalThis.fetch = mockFetch

    const { onRetry } = renderLoading()
    const user = userEvent.setup()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /tentar novamente/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /tentar novamente/i }))
    expect(onRetry).toHaveBeenCalled()
  })

  it('shows friendly message on fetch network error', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

    renderLoading()

    await waitFor(() => {
      expect(screen.getByText(/Ocorreu um erro/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /tentar novamente/i })).toBeInTheDocument()
    })
  })
})

// ---------------------------------------------------------------------------
// 5. Phase messages mapping
// ---------------------------------------------------------------------------

describe('ScanLoading — Phase Messages', () => {
  const phaseMessages: Array<{ phase: number; name: string; expected: RegExp }> = [
    { phase: 1, name: 'intake', expected: /Analisando seu negócio/i },
    { phase: 2, name: 'extraction', expected: /Mapeando processos/i },
    { phase: 3, name: 'scoring', expected: /Avaliando oportunidades/i },
    { phase: 4, name: 'ranking', expected: /Rankeando por impacto/i },
    { phase: 5, name: 'report', expected: /Gerando seu diagnóstico/i },
  ]

  for (const { phase, name, expected } of phaseMessages) {
    it(`shows "${expected.source}" for phase ${phase}`, async () => {
      const events: Array<Record<string, unknown>> = []
      for (let p = 1; p <= phase; p++) {
        if (p < phase) {
          events.push({ type: 'phase_start', phase: p, name: `phase-${p}` })
          events.push({ type: 'phase_complete', phase: p, name: `phase-${p}` })
        } else {
          events.push({ type: 'phase_start', phase: p, name })
        }
      }
      globalThis.fetch = createMockFetchForSSE(events)

      renderLoading()

      await waitFor(() => {
        expect(screen.getByText(expected)).toBeInTheDocument()
      })
    })
  }
})

// ---------------------------------------------------------------------------
// 6. Accessibility
// ---------------------------------------------------------------------------

describe('ScanLoading — Accessibility', () => {
  it('has no a11y violations in loading state', async () => {
    globalThis.fetch = createMockFetchForSSE([
      { type: 'phase_start', phase: 1, name: 'intake' },
    ])

    const { container } = renderLoading()

    await waitFor(() => {
      expect(screen.getByText(/Analisando seu negócio/i)).toBeInTheDocument()
    })

    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('has no a11y violations in error state', async () => {
    globalThis.fetch = createMockFetchForSSE([
      { type: 'scan_error', phase: 0, name: 'stream', error: 'fail' },
    ])

    const { container } = renderLoading()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /tentar novamente/i })).toBeInTheDocument()
    })

    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
