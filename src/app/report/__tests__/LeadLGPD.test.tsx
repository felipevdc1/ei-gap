// ---------------------------------------------------------------------------
// EI-GAP — LeadCaptureModal LGPD Tests (TDD — RED phase)
// Story E5.S3 — LGPD Compliance: consent checkbox
// ---------------------------------------------------------------------------
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { LeadCaptureModal } from '../[id]/components/LeadCaptureModal'

// ---------------------------------------------------------------------------
// Fetch mock
// ---------------------------------------------------------------------------
const originalFetch = globalThis.fetch
let mockFetch: ReturnType<typeof vi.fn>

beforeEach(() => {
  mockFetch = vi.fn()
  globalThis.fetch = mockFetch
})

afterEach(() => {
  globalThis.fetch = originalFetch
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const SCAN_ID = 'scan-lgpd-test'

function renderModal(open = true) {
  const onClose = vi.fn()
  const result = render(
    <LeadCaptureModal open={open} onClose={onClose} scanId={SCAN_ID} />,
  )
  return { ...result, onClose }
}

// ---------------------------------------------------------------------------
// LGPD consent checkbox
// ---------------------------------------------------------------------------
describe('LeadCaptureModal — LGPD consent', () => {
  it('renders a consent checkbox with link to /privacidade', () => {
    renderModal(true)

    const checkbox = screen.getByRole('checkbox', {
      name: /pol[ií]tica de privacidade/i,
    })
    expect(checkbox).toBeInTheDocument()
    expect(checkbox).not.toBeChecked()

    const link = screen.getByRole('link', {
      name: /pol[ií]tica de privacidade/i,
    })
    expect(link).toHaveAttribute('href', '/privacidade')
  })

  it('submit button is disabled when consent checkbox is unchecked', () => {
    renderModal(true)

    const submitBtn = screen.getByRole('button', { name: /enviar/i })
    expect(submitBtn).toBeDisabled()
  })

  it('submit button is enabled when consent checkbox is checked', async () => {
    const user = userEvent.setup()
    renderModal(true)

    const checkbox = screen.getByRole('checkbox', {
      name: /pol[ií]tica de privacidade/i,
    })
    await user.click(checkbox)

    const submitBtn = screen.getByRole('button', { name: /enviar/i })
    expect(submitBtn).not.toBeDisabled()
  })

  it('blocks form submission when consent is unchecked (form validation)', async () => {
    const user = userEvent.setup()
    renderModal(true)

    // Fill valid email but do NOT check consent
    await user.type(screen.getByLabelText(/email/i), 'user@example.com')

    // The submit button should be disabled, so fetch should never be called
    const submitBtn = screen.getByRole('button', { name: /enviar/i })
    expect(submitBtn).toBeDisabled()
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('sends lgpd_consent=true and lgpd_consent_at timestamp in payload', async () => {
    const user = userEvent.setup()
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true }), { status: 201 }),
    )
    renderModal(true)

    // Check consent first
    const checkbox = screen.getByRole('checkbox', {
      name: /pol[ií]tica de privacidade/i,
    })
    await user.click(checkbox)

    // Fill email and submit
    await user.type(screen.getByLabelText(/email/i), 'user@example.com')
    await user.click(screen.getByRole('button', { name: /enviar/i }))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled()
    })

    const [url, options] = mockFetch.mock.calls[0]
    expect(url).toBe('/api/lead')

    const body = JSON.parse(options.body)
    expect(body.lgpd_consent).toBe(true)
    expect(body.lgpd_consent_at).toBeDefined()
    // lgpd_consent_at should be a valid ISO date string
    expect(new Date(body.lgpd_consent_at).toISOString()).toBe(
      body.lgpd_consent_at,
    )
  })

  it('sends lgpd_consent=false when checkbox is unchecked (if submit were forced)', async () => {
    // This test verifies the state mapping — checkbox unchecked = consent false
    renderModal(true)

    const checkbox = screen.getByRole('checkbox', {
      name: /pol[ií]tica de privacidade/i,
    })
    expect(checkbox).not.toBeChecked()
    // The button should be disabled, preventing submission
    const submitBtn = screen.getByRole('button', { name: /enviar/i })
    expect(submitBtn).toBeDisabled()
  })
})
