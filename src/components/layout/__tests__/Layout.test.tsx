import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { axe } from 'vitest-axe'
import * as matchers from 'vitest-axe/matchers'

expect.extend(matchers)

import { Header } from '../Header'
import { Footer } from '../Footer'

// ─────────────────────────────────────────────────────────
// Header
// ─────────────────────────────────────────────────────────
describe('Header', () => {
  it('renders a <header> element', () => {
    const { container } = render(<Header />)
    expect(container.querySelector('header')).toBeInTheDocument()
  })

  it('renders the logo/brand text', () => {
    render(<Header />)
    expect(screen.getByText('EI-GAP')).toBeInTheDocument()
  })

  it('renders a nav element', () => {
    render(<Header />)
    expect(screen.getByRole('navigation')).toBeInTheDocument()
  })

  it('renders CTA link pointing to /scan', () => {
    render(<Header />)
    const cta = screen.getByRole('link', { name: /Comece Agora/i })
    expect(cta).toHaveAttribute('href', '/scan')
  })

  it('renders skip navigation link pointing to #main-content', () => {
    render(<Header />)
    const skipLink = screen.getByText('Pular para o conteúdo')
    expect(skipLink).toHaveAttribute('href', '#main-content')
    // Should have sr-only class for screen-reader-only visibility
    expect(skipLink.className).toMatch(/sr-only/)
  })

  it('passes axe accessibility checks', async () => {
    const { container } = render(<Header />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})

// ─────────────────────────────────────────────────────────
// Footer
// ─────────────────────────────────────────────────────────
describe('Footer', () => {
  it('renders a <footer> element', () => {
    const { container } = render(<Footer />)
    expect(container.querySelector('footer')).toBeInTheDocument()
  })

  it('renders at least one link', () => {
    render(<Footer />)
    const links = screen.getAllByRole('link')
    expect(links.length).toBeGreaterThanOrEqual(1)
  })

  it('passes axe accessibility checks', async () => {
    const { container } = render(<Footer />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
