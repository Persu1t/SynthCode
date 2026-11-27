import { describe, expect, it } from 'vitest';
import { highlight } from './highlight';

describe('highlight', () => {
  it('never drops or changes characters', () => {
    const line = 'export const total = items.reduce((sum, n) => sum + n, 0); // add up';
    expect(highlight(line).map(t => t.text).join('')).toBe(line);
  });

  it('classifies keywords, strings, numbers and comments', () => {
    const tokens = highlight('const a = "x" + 42; // note');
    const find = (text: string) => tokens.find(t => t.text === text)?.type;

    expect(find('const')).toBe('keyword');
    expect(find('"x"')).toBe('string');
    expect(find('42')).toBe('number');
    expect(find('// note')).toBe('comment');
  });

  it('marks calls as functions and capitalised names as types', () => {
    const tokens = highlight('hits.set(key, new Map())');

    expect(tokens.find(t => t.text === 'set')?.type).toBe('fn');
    expect(tokens.find(t => t.text === 'Map')?.type).toBe('type');
  });

  it('keeps a template literal as one string token', () => {
    const tokens = highlight('const m = `HTTP ${res.status}`;');
    expect(tokens.filter(t => t.type === 'string')).toHaveLength(1);
  });
});
