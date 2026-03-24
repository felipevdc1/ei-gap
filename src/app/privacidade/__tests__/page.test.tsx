// ---------------------------------------------------------------------------
// EI-GAP — Privacy Policy Page Tests (TDD — RED phase)
// Story E5.S3 — LGPD Compliance
// ---------------------------------------------------------------------------
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

import PrivacidadePage from '../page'

describe('Privacidade Page — content', () => {
  it('renders the page title', () => {
    render(<PrivacidadePage />)
    expect(
      screen.getByRole('heading', {
        name: /pol[ií]tica de privacidade/i,
      }),
    ).toBeInTheDocument()
  })

  it('renders "Dados Coletados" section', () => {
    render(<PrivacidadePage />)
    expect(
      screen.getByRole('heading', { name: /dados coletados/i }),
    ).toBeInTheDocument()
    expect(screen.getByText(/nome da empresa/i)).toBeInTheDocument()
    expect(screen.getByText(/setor/i)).toBeInTheDocument()
    expect(screen.getByText(/maturidade tecnol[oó]gica/i)).toBeInTheDocument()
  })

  it('renders "Finalidade" section', () => {
    render(<PrivacidadePage />)
    expect(
      screen.getByRole('heading', { name: /finalidade/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/diagn[oó]stico personalizado/i),
    ).toBeInTheDocument()
  })

  it('renders "Compartilhamento" section', () => {
    render(<PrivacidadePage />)
    expect(
      screen.getByRole('heading', { name: /compartilhamento/i }),
    ).toBeInTheDocument()
    expect(screen.getByText(/openrouter/i)).toBeInTheDocument()
  })

  it('renders "Reten\u00e7\u00e3o" section with both retention policies', () => {
    render(<PrivacidadePage />)
    expect(
      screen.getByRole('heading', { name: /reten[çc][aã]o/i }),
    ).toBeInTheDocument()
    expect(screen.getByText(/90 dias/i)).toBeInTheDocument()
    expect(
      screen.getByText(/solicita[çc][aã]o de exclus[aã]o/i),
    ).toBeInTheDocument()
  })

  it('renders "Seus Direitos" section with DPO contact', () => {
    render(<PrivacidadePage />)
    expect(
      screen.getByRole('heading', { name: /seus direitos/i }),
    ).toBeInTheDocument()
    expect(screen.getByText(/privacidade@ei-gap\.com\.br/i)).toBeInTheDocument()
  })

  it('renders "Base Legal" section referencing LGPD', () => {
    render(<PrivacidadePage />)
    expect(
      screen.getByRole('heading', { name: /base legal/i }),
    ).toBeInTheDocument()
    expect(screen.getByText(/art\.\s*7/i)).toBeInTheDocument()
    expect(screen.getByText(/lgpd/i)).toBeInTheDocument()
  })
})
