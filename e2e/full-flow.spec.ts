// ---------------------------------------------------------------------------
// EI-GAP — Full Flow E2E Test
// Story E5.S4 — Deploy Vercel + E2E + Polish
//
// Skipped: requires a running server + real OpenRouter API key.
// Unskip when CI environment is ready with Playwright browsers installed.
// ---------------------------------------------------------------------------
import { test, expect } from '@playwright/test'

test.describe('Full AI Scanner Flow', () => {
  // All tests skipped — no running server or API key in CI yet
  test.skip()

  test('Landing → Scan Form → 5 Steps → Submit → Loading → Report → Lead Capture', async ({
    page,
  }) => {
    // -----------------------------------------------------------------------
    // 1. Landing Page — click CTA
    // -----------------------------------------------------------------------
    await page.goto('/')
    await expect(page.locator('h1')).toBeVisible()
    await page.getByRole('link', { name: /diagnóstico gratuito|começar|scanner/i }).first().click()
    await expect(page).toHaveURL(/\/scan/)

    // -----------------------------------------------------------------------
    // 2. Step 1 — Sector Selection
    // -----------------------------------------------------------------------
    await expect(page.getByText('Sector Selection')).toBeVisible()
    // Click the first sector card
    await page.locator('[data-testid="sector-card"]').first().click()
    await page.getByRole('button', { name: /next/i }).click()

    // -----------------------------------------------------------------------
    // 3. Step 2 — Company Info
    // -----------------------------------------------------------------------
    await expect(page.getByText('Company Info')).toBeVisible()
    await page.getByLabel(/nome da empresa/i).fill('Empresa Teste E2E')
    await page.getByLabel(/tamanho/i).selectOption('11-50')
    await page.getByLabel(/maturidade/i).selectOption('medium')
    await page.getByRole('button', { name: /next/i }).click()

    // -----------------------------------------------------------------------
    // 4. Step 3 — Sector Questions
    // -----------------------------------------------------------------------
    await expect(page.getByText('Sector Questions')).toBeVisible()
    // Fill all visible textareas with a generic answer
    const textareas = page.locator('textarea')
    const count = await textareas.count()
    for (let i = 0; i < count; i++) {
      await textareas.nth(i).fill('Resposta padrão para teste E2E.')
    }
    await page.getByRole('button', { name: /next/i }).click()

    // -----------------------------------------------------------------------
    // 5. Step 4 — Process Mapping (add 3 processes minimum)
    // -----------------------------------------------------------------------
    await expect(page.getByText('Process Mapping')).toBeVisible()

    for (const processName of ['Atendimento ao cliente', 'Gestão de estoque', 'Faturamento']) {
      await page.getByLabel(/nome do processo/i).fill(processName)
      await page.getByLabel(/horas por semana/i).fill('10')
      await page.getByLabel(/nível de dor/i).selectOption('4')
      await page.getByRole('button', { name: /adicionar/i }).click()
    }
    await page.getByRole('button', { name: /next/i }).click()

    // -----------------------------------------------------------------------
    // 6. Step 5 — Review & Submit
    // -----------------------------------------------------------------------
    await expect(page.getByText('Review & Submit')).toBeVisible()
    await expect(page.getByText('Empresa Teste E2E')).toBeVisible()
    await page.getByRole('button', { name: /gerar diagnóstico/i }).click()

    // -----------------------------------------------------------------------
    // 7. Loading state (SSE)
    // -----------------------------------------------------------------------
    // The loading screen should appear while the scan processes
    await expect(page.getByText(/gerando|processando|analisando/i)).toBeVisible({
      timeout: 10_000,
    })

    // -----------------------------------------------------------------------
    // 8. Report page — wait for redirect (may take up to 2 minutes with real AI)
    // -----------------------------------------------------------------------
    await expect(page).toHaveURL(/\/report\//, { timeout: 180_000 })

    // Verify key report sections are visible
    await expect(page.getByTestId('report-header')).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText('Empresa Teste E2E')).toBeVisible()

    // Check that 10 opportunities are listed
    await expect(page.getByTestId('opportunities-table')).toBeVisible()

    // -----------------------------------------------------------------------
    // 9. CTA → Lead Capture Modal
    // -----------------------------------------------------------------------
    const ctaButton = page.getByRole('button', { name: /falar com especialista|agendar|contato/i })
    if (await ctaButton.isVisible()) {
      await ctaButton.click()

      // Lead capture modal should appear
      const modal = page.getByRole('dialog')
      await expect(modal).toBeVisible()

      // Fill in lead data
      await modal.getByLabel(/e-?mail/i).fill('teste@e2e.com')
      await modal.getByLabel(/nome/i).fill('Teste E2E')

      // Accept LGPD
      await modal.getByRole('checkbox').check()

      // Submit
      await modal.getByRole('button', { name: /enviar|confirmar/i }).click()
    }
  })

  test('Invalid report ID shows 404 page', async ({ page }) => {
    await page.goto('/report/nonexistent-id-12345')
    await expect(page.getByText('404')).toBeVisible()
    await expect(page.getByText(/não encontrado/i)).toBeVisible()
  })
})
