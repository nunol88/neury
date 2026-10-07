import { describe, expect, test } from 'bun:test';
import { validateExtraInput, extrasNet } from '../hooks/useExtras';

describe('extras', () => {
  test('mes_key follows the date (setembro -> outubro)', () => {
    expect(validateExtraInput(728.44, '2026-09-30').mesKey).toBe('september');
    expect(validateExtraInput(728.44, '2026-10-01').mesKey).toBe('october');
    expect(validateExtraInput(10, '2025-12-05').mesKey).toBe('december');
    expect(validateExtraInput(10, '2026-12-05').mesKey).toBe('december2026');
  });
  test('rejects invalid input', () => {
    expect(() => validateExtraInput(0, '2026-10-01')).toThrow();
    expect(() => validateExtraInput(10, '2026-02-30')).toThrow();
    expect(() => validateExtraInput(10, '2027-01-01')).toThrow();
  });
  test('receita 100 + despesa 20 = 80', () => {
    expect(extrasNet([{ valor: 100, tipo: 'receita' }, { valor: 20, tipo: 'despesa' }])).toBe(80);
  });
});
