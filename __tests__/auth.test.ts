import { describe, test, expect } from 'vitest';
import { safeRedirect, validatePasswordStrength } from '@/lib/auth';

describe('safeRedirect', () => {
  test('allows same-origin path', () => {
    expect(safeRedirect('/listings')).toBe('/listings');
  });
  test('allows nested path', () => {
    expect(safeRedirect('/listings/abc?x=1')).toBe('/listings/abc?x=1');
  });
  test('rejects absolute URLs', () => {
    expect(safeRedirect('https://evil.example/x')).toBe('/');
  });
  test('rejects protocol-relative URLs', () => {
    expect(safeRedirect('//evil.example/x')).toBe('/');
  });
  test('rejects backslash trick', () => {
    expect(safeRedirect('/\\evil.example')).toBe('/');
  });
  test('rejects non-string', () => {
    expect(safeRedirect(undefined)).toBe('/');
    expect(safeRedirect(null)).toBe('/');
  });
  test('respects provided fallback', () => {
    expect(safeRedirect('https://evil', '/home')).toBe('/home');
  });
});

describe('validatePasswordStrength', () => {
  test('rejects short passwords', () => {
    expect(validatePasswordStrength('short')).toMatch(/8 characters/);
  });
  test('rejects very long passwords', () => {
    expect(validatePasswordStrength('a'.repeat(200))).toMatch(/128 characters/);
  });
  test('rejects low-entropy lowercase-only', () => {
    expect(validatePasswordStrength('abcdefghij')).toMatch(/mix/);
  });
  test('accepts mixed-class', () => {
    expect(validatePasswordStrength('Abcdef12')).toBeNull();
    expect(validatePasswordStrength('Hello123!')).toBeNull();
  });
});
