import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { axe } from 'vitest-axe'
import * as matchers from 'vitest-axe/matchers'

expect.extend(matchers)

import Home from '../page'

// ─────────────────────────────────────────────────────────
// Landing Page Composition (page.tsx)
// ─────────────────────────────────────────────────────────
describe('Landing Page (page.tsx)', () => {
  it('renders Header', () => {
    render(<Home />)
    expect(screen.getByRole('banner')).toBeInTheDocument()
  })

  it('renders main content area with id="main-content"', () => {
    const { container } = render(<Home />)
    const main = container.querySelector('main#main-content')
    expect(main).toBeInTheDocument()
  })

  it('renders HeroSection with h1', () => {
    render(<Home />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      /Descubra as 10 Maiores Oportunidades/,
    )
  })

  it('renders HowItWorks section', () => {
    render(<Home />)
    expect(screen.getByText(/Conte sobre seu negócio/)).toBeInTheDocument()
  })

  it('renders CtaSection', () => {
    render(<Home />)
    expect(
      screen.getByText(/Pronto para descobrir suas oportunidades/),
    ).toBeInTheDocument()
  })

  it('renders Footer', () => {
    render(<Home />)
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
  })

  it('all CTA links point to /scan', () => {
    render(<Home />)
    const ctaLinks = screen.getAllByRole('link', { name: /Comece Agora/i })
    expect(ctaLinks.length).toBeGreaterThanOrEqual(2) // Header + Hero + CtaSection
    ctaLinks.forEach((link) => {
      expect(link).toHaveAttribute('href', '/scan')
    })
  })

  it('heading hierarchy is correct: only one h1, h2s follow', () => {
    render(<Home />)
    const h1s = screen.getAllByRole('heading', { level: 1 })
    expect(h1s).toHaveLength(1)

    const h2s = screen.getAllByRole('heading', { level: 2 })
    expect(h2s.length).toBeGreaterThanOrEqual(2) // HowItWorks + CtaSection
  })

  it('passes axe accessibility checks', async () => {
    const { container } = render(<Home />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
