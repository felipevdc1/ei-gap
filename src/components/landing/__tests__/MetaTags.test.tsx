import { describe, it, expect } from 'vitest'

// Test metadata export from page
import { metadata } from '@/app/page'

describe('Page Metadata (SEO)', () => {
  it('has a title', () => {
    expect(metadata.title).toBeDefined()
    expect(typeof metadata.title === 'string' ? metadata.title : '').toBeTruthy()
  })

  it('has a description', () => {
    expect(metadata.description).toBeDefined()
    expect(metadata.description).toBeTruthy()
  })

  it('has OpenGraph metadata', () => {
    expect(metadata.openGraph).toBeDefined()
    const og = metadata.openGraph as Record<string, unknown>
    expect(og.title).toBeDefined()
    expect(og.description).toBeDefined()
    expect(og.images).toBeDefined()
  })

  it('has OpenGraph image', () => {
    const og = metadata.openGraph as Record<string, unknown>
    const images = og.images as Array<Record<string, unknown>>
    expect(images.length).toBeGreaterThan(0)
    expect(images[0].url).toBeDefined()
  })
})

describe('JSON-LD Structured Data', () => {
  it('jsonLd export has correct schema.org type', async () => {
    const { jsonLd } = await import('@/app/page')
    expect(jsonLd).toBeDefined()
    expect(jsonLd['@context']).toBe('https://schema.org')
    expect(jsonLd['@type']).toBe('WebApplication')
  })

  it('jsonLd has required fields', async () => {
    const { jsonLd } = await import('@/app/page')
    expect(jsonLd.name).toBeDefined()
    expect(jsonLd.description).toBeDefined()
    expect(jsonLd.url).toBeDefined()
  })
})
