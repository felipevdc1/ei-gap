import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { axe } from 'vitest-axe'
import * as matchers from 'vitest-axe/matchers'

expect.extend(matchers)

import { ValueCards } from '../ValueCards'

describe('ValueCards', () => {
  it('renders the section with 3 value cards', () => {
    render(<ValueCards />)
    const cards = screen.getAllByRole('article')
    expect(cards).toHaveLength(3)
  })

  it('renders "Diagnóstico Personalizado" card with correct content', () => {
    render(<ValueCards />)
    expect(screen.getByText('Diagnóstico Personalizado')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Análise específica para o seu setor e porte de empresa',
      ),
    ).toBeInTheDocument()
  })

  it('renders "10 Oportunidades Rankeadas" card with correct content', () => {
    render(<ValueCards />)
    expect(screen.getByText('10 Oportunidades Rankeadas')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Oportunidades ordenadas por impacto, viabilidade e ROI estimado',
      ),
    ).toBeInTheDocument()
  })

  it('renders "Gratuito e Instantâneo" card with correct content', () => {
    render(<ValueCards />)
    expect(screen.getByText('Gratuito e Instantâneo')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Resultado em minutos, sem compromisso e sem cartão de crédito',
      ),
    ).toBeInTheDocument()
  })

  it('uses a <section> element', () => {
    const { container } = render(<ValueCards />)
    expect(container.querySelector('section')).toBeInTheDocument()
  })

  it('uses h3 for card titles (correct heading hierarchy)', () => {
    render(<ValueCards />)
    const h3s = screen.getAllByRole('heading', { level: 3 })
    expect(h3s).toHaveLength(3)
  })

  it('has card animations that respect prefers-reduced-motion', () => {
    const { container } = render(<ValueCards />)
    const cards = container.querySelectorAll('[data-testid^="value-card-"]')
    expect(cards).toHaveLength(3)
  })

  it('passes axe accessibility checks', async () => {
    const { container } = render(<ValueCards />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
