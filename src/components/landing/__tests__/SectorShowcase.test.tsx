import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { axe } from 'vitest-axe'
import * as matchers from 'vitest-axe/matchers'

expect.extend(matchers)

import { SectorShowcase } from '../SectorShowcase'

// The 8 sector names from YAML
const SECTOR_NAMES = [
  'E-commerce',
  'Agencia de Marketing Digital',
  'SaaS / Tech',
  'Servicos Profissionais',
  'Varejo Fisico',
  'Industria / Manufatura',
  'Educacao / Infoprodutos',
  'Saude / Clinicas',
]

describe('SectorShowcase', () => {
  it('renders the section heading "Setores Atendidos"', () => {
    render(<SectorShowcase sectors={SECTOR_NAMES} />)
    expect(
      screen.getByRole('heading', { name: /Setores Atendidos/i }),
    ).toBeInTheDocument()
  })

  it('renders exactly 8 sectors', () => {
    render(<SectorShowcase sectors={SECTOR_NAMES} />)
    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(8)
  })

  it('renders all sector names from YAML data', () => {
    render(<SectorShowcase sectors={SECTOR_NAMES} />)
    for (const name of SECTOR_NAMES) {
      expect(screen.getByText(name)).toBeInTheDocument()
    }
  })

  it('uses a <section> element', () => {
    const { container } = render(<SectorShowcase sectors={SECTOR_NAMES} />)
    expect(container.querySelector('section')).toBeInTheDocument()
  })

  it('uses a <ul> list for sectors', () => {
    const { container } = render(<SectorShowcase sectors={SECTOR_NAMES} />)
    expect(container.querySelector('ul')).toBeInTheDocument()
  })

  it('passes axe accessibility checks', async () => {
    const { container } = render(<SectorShowcase sectors={SECTOR_NAMES} />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
