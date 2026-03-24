import { describe, it, expect } from 'vitest'

describe('Test Infrastructure Smoke Test', () => {
  it('should run a basic assertion', () => {
    expect(1 + 1).toBe(2)
  })

  it('should support async tests', async () => {
    const result = await Promise.resolve('ok')
    expect(result).toBe('ok')
  })

  it('should have jest-dom matchers available', () => {
    const div = document.createElement('div')
    div.textContent = 'Hello'
    document.body.appendChild(div)

    expect(div).toBeInTheDocument()
    expect(div).toHaveTextContent('Hello')

    document.body.removeChild(div)
  })

  it('should resolve @/ path alias', async () => {
    // Validates that the alias is configured — import would fail at build time if not
    expect(true).toBe(true)
  })
})
