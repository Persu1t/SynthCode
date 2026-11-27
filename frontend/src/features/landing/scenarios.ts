export interface Scenario {
  id: string;
  file: string;
  caption: string;
  /** What the developer has already written. */
  prefix: string;
  /** What SynthCode suggests next. */
  suggestion: string;
}

const text = (lines: string[]) => lines.join('\n');

export const scenarios: Scenario[] = [
  {
    id: 'rate-limiter',
    file: 'rateLimiter.ts',
    caption: 'Completing the body of a rate limiter from its signature and comment.',
    prefix: text([
      'import type { Request, Response, NextFunction } from "express";',
      '',
      '// Allow each IP 100 requests per minute.',
      'export function rateLimiter(limit = 100, windowMs = 60_000) {',
      '  const hits = new Map<string, { count: number; resetAt: number }>();',
      '',
      '  return (req: Request, res: Response, next: NextFunction) => {',
    ]),
    suggestion: text([
      '    const now = Date.now();',
      '    const key = req.ip ?? "unknown";',
      '    const entry = hits.get(key);',
      '',
      '    if (!entry || entry.resetAt <= now) {',
      '      hits.set(key, { count: 1, resetAt: now + windowMs });',
      '      return next();',
      '    }',
      '',
      '    if (entry.count >= limit) {',
      '      res.setHeader("Retry-After", Math.ceil((entry.resetAt - now) / 1000));',
      '      return res.status(429).json({ error: "Too many requests" });',
      '    }',
      '',
      '    entry.count += 1;',
      '    next();',
      '  };',
      '}',
    ]),
  },
  {
    id: 'slugify-tests',
    file: 'slugify.test.ts',
    caption: 'Writing unit tests for a function that lives in the next file over.',
    prefix: text([
      'import { describe, expect, it } from "vitest";',
      'import { slugify } from "./slugify";',
      '',
      'describe("slugify", () => {',
    ]),
    suggestion: text([
      '  it("lowercases and joins words with hyphens", () => {',
      '    expect(slugify("Hello World")).toBe("hello-world");',
      '  });',
      '',
      '  it("removes characters that are not URL safe", () => {',
      '    expect(slugify("Ship it! (v2)")).toBe("ship-it-v2");',
      '  });',
      '',
      '  it("collapses repeated separators", () => {',
      '    expect(slugify("a  --  b")).toBe("a-b");',
      '  });',
      '});',
    ]),
  },
  {
    id: 'fetch-retry',
    file: 'fetchWithRetry.ts',
    caption: 'Turning a one-line comment into a working retry helper.',
    prefix: text([
      '// Retry a request up to 3 times with exponential backoff.',
      'export async function fetchWithRetry(url: string, attempts = 3) {',
    ]),
    suggestion: text([
      '  let lastError: unknown;',
      '',
      '  for (let i = 0; i < attempts; i++) {',
      '    try {',
      '      const res = await fetch(url);',
      '      if (res.ok) return res;',
      '      lastError = new Error(`HTTP ${res.status}`);',
      '    } catch (err) {',
      '      lastError = err;',
      '    }',
      '    await new Promise(resolve => setTimeout(resolve, 2 ** i * 250));',
      '  }',
      '',
      '  throw lastError;',
      '}',
    ]),
  },
];
