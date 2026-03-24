// ---------------------------------------------------------------------------
// EI-GAP — LeadCaptureModal Tests (TDD — RED phase)
// Story E4b.S3 — Modal de captura de lead pós-report
// ---------------------------------------------------------------------------
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import * as matchers from 'vitest-axe/matchers'

expect.extend(matchers)

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
const SCAN_ID = 'scan-abc123'

function renderModal(open = true) {
  const onClose = vi.fn()
  const result = render(
    <LeadCaptureModal open={open} onClose={onClose} scanId={SCAN_ID} />,
  )
  return { ...result, onClose }
}

// ---------------------------------------------------------------------------
// Modal open/close
// ---------------------------------------------------------------------------
describe('LeadCaptureModal — open/close', () => {
  it('renders the modal when open=true', () => {
    renderModal(true)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('does not render content when open=false', () => {
    renderModal(false)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('closes when Escape key is pressed', async () => {
    const user = userEvent.setup()
    const { onClose } = renderModal(true)

    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('closes when clicking the backdrop', async () => {
    const user = userEvent.setup()
    const { onClose } = renderModal(true)

    const backdrop = screen.getByTestId('modal-backdrop')
    await user.click(backdrop)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does NOT close when clicking inside the modal content', async () => {
    const user = userEvent.setup()
    const { onClose } = renderModal(true)

    const dialog = screen.getByRole('dialog')
    await user.click(dialog)
    expect(onClose).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// Focus trap
// ---------------------------------------------------------------------------
describe('LeadCaptureModal — focus trap', () => {
  it('traps focus within the modal (Tab wraps to first element)', async () => {
    const user = userEvent.setup()
    renderModal(true)

    // Get all focusable elements inside the dialog
    const dialog = screen.getByRole('dialog')
    const focusables = dialog.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    )
    expect(focusables.length).toBeGreaterThanOrEqual(2)

    const first = focusables[0]
    const last = focusables[focusables.length - 1]

    // Focus the last element, then Tab should wrap to first
    last.focus()
    expect(document.activeElement).toBe(last)

    await user.tab()
    expect(document.activeElement).toBe(first)
  })

  it('traps focus within the modal (Shift+Tab wraps to last element)', async () => {
    const user = userEvent.setup()
    renderModal(true)

    const dialog = screen.getByRole('dialog')
    const focusables = dialog.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    )

    const first = focusables[0]
    const last = focusables[focusables.length - 1]

    // Focus the first element, then Shift+Tab should wrap to last
    first.focus()
    expect(document.activeElement).toBe(first)

    await user.tab({ shift: true })
    expect(document.activeElement).toBe(last)
  })
})

// ---------------------------------------------------------------------------
// Accessibility attributes
// ---------------------------------------------------------------------------
describe('LeadCaptureModal — a11y attributes', () => {
  it('has aria-modal="true" and role="dialog"', () => {
    renderModal(true)
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
  })

  it('has aria-labelledby pointing to the title', () => {
    renderModal(true)
    const dialog = screen.getByRole('dialog')
    const labelId = dialog.getAttribute('aria-labelledby')
    expect(labelId).toBeTruthy()
    const title = document.getElementById(labelId!)
    expect(title).toBeInTheDocument()
    expect(title!.textContent).toBeTruthy()
  })

  it('passes axe-core with zero violations', async () => {
    const { container } = renderModal(true)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------
describe('LeadCaptureModal — validation', () => {
  it('shows error for empty email on submit', async () => {
    const user = userEvent.setup()
    renderModal(true)

    // Enable submit by checking LGPD consent
    await user.click(screen.getByRole('checkbox'))

    const submitBtn = screen.getByRole('button', { name: /enviar/i })
    await user.click(submitBtn)

    expect(await screen.findByText(/email.*obrigatório|informe.*email|email.*válido/i)).toBeInTheDocument()
  })

  it('shows error for invalid email format', async () => {
    const user = userEvent.setup()
    renderModal(true)

    await user.click(screen.getByRole('checkbox'))

    const emailInput = screen.getByLabelText(/email/i)
    await user.type(emailInput, 'not-an-email')

    const submitBtn = screen.getByRole('button', { name: /enviar/i })
    await user.click(submitBtn)

    expect(await screen.findByText(/email.*válido|email.*inválido/i)).toBeInTheDocument()
  })

  it('does NOT show error for valid email', async () => {
    const user = userEvent.setup()
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true }), { status: 201 }),
    )
    renderModal(true)

    await user.click(screen.getByRole('checkbox'))

    const emailInput = screen.getByLabelText(/email/i)
    await user.type(emailInput, 'user@example.com')

    const submitBtn = screen.getByRole('button', { name: /enviar/i })
    await user.click(submitBtn)

    await waitFor(() => {
      expect(screen.queryByText(/email.*válido|email.*inválido|email.*obrigatório/i)).not.toBeInTheDocument()
    })
  })
})

// ---------------------------------------------------------------------------
// Submit flow
// ---------------------------------------------------------------------------
describe('LeadCaptureModal — submit', () => {
  it('calls POST /api/lead with correct payload on valid submit', async () => {
    const user = userEvent.setup()
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true }), { status: 201 }),
    )
    renderModal(true)

    await user.click(screen.getByRole('checkbox'))
    await user.type(screen.getByLabelText(/email/i), 'user@example.com')
    await user.type(screen.getByLabelText(/nome/i), 'João Silva')
    await user.type(screen.getByLabelText(/empresa/i), 'Acme Corp')

    await user.click(screen.getByRole('button', { name: /enviar/i }))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled()
    })

    const [url, options] = mockFetch.mock.calls[0]
    expect(url).toBe('/api/lead')
    const body = JSON.parse(options.body)
    expect(body.email).toBe('user@example.com')
    expect(body.scan_id).toBe(SCAN_ID)
    expect(body.lgpd_consent).toBe(true)
    expect(body.lgpd_consent_at).toBeDefined()
    expect(body.name).toBe('João Silva')
    expect(body.company).toBe('Acme Corp')
  })

  it('shows success message after successful submit', async () => {
    const user = userEvent.setup()
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true }), { status: 201 }),
    )
    renderModal(true)

    await user.click(screen.getByRole('checkbox'))
    await user.type(screen.getByLabelText(/email/i), 'user@example.com')
    await user.click(screen.getByRole('button', { name: /enviar/i }))

    expect(await screen.findByText(/obrigado/i)).toBeInTheDocument()
  })

  it('shows error message on API failure', async () => {
    const user = userEvent.setup()
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'fail' }), { status: 500 }),
    )
    renderModal(true)

    await user.click(screen.getByRole('checkbox'))
    await user.type(screen.getByLabelText(/email/i), 'user@example.com')
    await user.click(screen.getByRole('button', { name: /enviar/i }))

    expect(await screen.findByText(/erro|tente novamente/i)).toBeInTheDocument()
  })

  it('shows error message on network failure', async () => {
    const user = userEvent.setup()
    mockFetch.mockRejectedValueOnce(new Error('Network error'))
    renderModal(true)

    await user.click(screen.getByRole('checkbox'))
    await user.type(screen.getByLabelText(/email/i), 'user@example.com')
    await user.click(screen.getByRole('button', { name: /enviar/i }))

    expect(await screen.findByText(/erro|tente novamente/i)).toBeInTheDocument()
  })

  it('sends only email and scan_id when name/company are empty', async () => {
    const user = userEvent.setup()
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true }), { status: 201 }),
    )
    renderModal(true)

    await user.click(screen.getByRole('checkbox'))
    await user.type(screen.getByLabelText(/email/i), 'user@example.com')
    await user.click(screen.getByRole('button', { name: /enviar/i }))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled()
    })

    const [url, options] = mockFetch.mock.calls[0]
    expect(url).toBe('/api/lead')
    const body = JSON.parse(options.body)
    expect(body.email).toBe('user@example.com')
    expect(body.scan_id).toBe(SCAN_ID)
    expect(body.lgpd_consent).toBe(true)
    expect(body.lgpd_consent_at).toBeDefined()
    expect(body.name).toBeUndefined()
    expect(body.company).toBeUndefined()
  })
})
