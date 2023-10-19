import { isString } from '../src';

describe('isString', () => {
  it('以下是字符串的情况', () => {
    expect(isString('a')).toBe(true);
    expect(isString('')).toBe(true);
  });

  it('以下不是字符串的情况', () => {
    expect(isString(new String('str'))).toBe(false);
    expect(isString([1, 2, 3])).toBe(false);
    expect(isString(undefined)).toBe(false);
    expect(isString(null)).toBe(false);
    expect(isString(true)).toBe(false);
    expect(isString(new Date())).toBe(false);
    expect(isString(new Error())).toBe(false);
    expect(isString({ 0: 1, length: 1 })).toBe(false);
    expect(isString(1)).toBe(false);
    expect(isString(/x/)).toBe(false);
  });
});
