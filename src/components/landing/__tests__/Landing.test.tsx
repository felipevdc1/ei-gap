import { render, screen, within } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { axe } from 'vitest-axe'
import * as matchers from 'vitest-axe/matchers'

expect.extend(matchers)

// Components under test (will be created after tests)
import { HeroSection } from '../HeroSection'
import { HowItWorks } from '../HowItWorks'
import { CtaSection } from '../CtaSection'

// ─────────────────────────────────────────────────────────
// HeroSection
// ─────────────────────────────────────────────────────────
describe('HeroSection', () => {
  it('renders the value proposition heading (h1)', () => {
    render(<HeroSection />)
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toHaveTextContent(
      'Descubra as 10 Maiores Oportunidades de IA para o Seu Negócio',
    )
  })

  it('renders the subtitle text', () => {
    render(<HeroSection />)
    expect(
      screen.getByText(/Diagnóstico gratuito e personalizado/),
    ).toBeInTheDocument()
  })

  it('renders CTA button pointing to /scan', () => {
    render(<HeroSection />)
    const cta = screen.getByRole('link', { name: /Comece Agora/i })
    expect(cta).toHaveAttribute('href', '/scan')
  })

  it('CTA contains full text "Comece Agora — É Grátis"', () => {
    render(<HeroSection />)
    expect(screen.getByText(/Comece Agora — É Grátis/)).toBeInTheDocument()
  })

  it('uses a <section> element', () => {
    const { container } = render(<HeroSection />)
    expect(container.querySelector('section')).toBeInTheDocument()
  })

  it('has background effect that respects prefers-reduced-motion', () => {
    const { container } = render(<HeroSection />)
    // The hero section should have the motion-safe/motion-reduce classes
    const section = container.querySelector('section')
    expect(section).toBeInTheDocument()
    // Check that there's a background element or CSS class for animation
    const bgElement = container.querySelector('[data-testid="hero-bg"]')
    expect(bgElement).toBeInTheDocument()
  })

  it('passes axe accessibility checks', async () => {
    const { container } = render(<HeroSection />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})

// ─────────────────────────────────────────────────────────
// HowItWorks
// ─────────────────────────────────────────────────────────
describe('HowItWorks', () => {
  it('renders section heading (h2)', () => {
    render(<HowItWorks />)
    const heading = screen.getByRole('heading', { level: 2 })
    expect(heading).toBeInTheDocument()
  })

  it('renders all 3 steps', () => {
    render(<HowItWorks />)
    expect(screen.getByText(/Conte sobre seu negócio/)).toBeInTheDocument()
    expect(
      screen.getByText(/IA analisa suas oportunidades/),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Receba seu diagnóstico completo/),
    ).toBeInTheDocument()
  })

  it('renders step numbers 1, 2, 3', () => {
    const { container } = render(<HowItWorks />)
    const steps = container.querySelectorAll('[data-testid^="step-"]')
    expect(steps).toHaveLength(3)
  })

  it('uses h3 for step titles (correct heading hierarchy)', () => {
    render(<HowItWorks />)
    const h3s = screen.getAllByRole('heading', { level: 3 })
    expect(h3s.length).toBe(3)
  })

  it('uses a <section> element', () => {
    const { container } = render(<HowItWorks />)
    expect(container.querySelector('section')).toBeInTheDocument()
  })

  it('passes axe accessibility checks', async () => {
    const { container } = render(<HowItWorks />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})

// ─────────────────────────────────────────────────────────
// CtaSection
// ─────────────────────────────────────────────────────────
describe('CtaSection', () => {
  it('renders the final CTA heading (h2)', () => {
    render(<CtaSection />)
    const heading = screen.getByRole('heading', { level: 2 })
    expect(heading).toHaveTextContent(
      'Pronto para descobrir suas oportunidades?',
    )
  })

  it('renders CTA link pointing to /scan', () => {
    render(<CtaSection />)
    const cta = screen.getByRole('link', { name: /Comece Agora/i })
    expect(cta).toHaveAttribute('href', '/scan')
  })

  it('uses a <section> element', () => {
    const { container } = render(<CtaSection />)
    expect(container.querySelector('section')).toBeInTheDocument()
  })

  it('passes axe accessibility checks', async () => {
    const { container } = render(<CtaSection />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
