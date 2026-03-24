/* eslint-disable @typescript-eslint/no-empty-object-type */
import type { AxeResults } from 'axe-core'

declare module 'vitest-axe' {
  export function axe(
    html: Element | string,
    options?: Record<string, unknown>,
  ): Promise<AxeResults>
}

declare module 'vitest-axe/matchers' {
  export function toHaveNoViolations(
    results: AxeResults,
  ): { pass: boolean; message: () => string | undefined; actual: unknown }
}

interface CustomMatchers<R = unknown> {
  toHaveNoViolations(): R
}

declare module 'vitest' {
  interface Assertion<T = unknown> extends CustomMatchers<T> {}
  interface AsymmetricMatchersContaining extends CustomMatchers {}
}
