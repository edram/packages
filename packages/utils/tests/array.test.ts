import { isArray } from '../src';

describe('isArray', () => {
  it('以下是数组的情况', () => {
    expect(isArray([])).toBe(true);
    expect(isArray([1, 2, 3])).toBe(true);
    expect(isArray(new Array(0))).toBe(true);
    expect(isArray(new Array('2'))).toBe(true);
  });

  it('以下不是数组的情况', () => {
    expect(isArray(new String('str'))).toBe(false);
    expect(isArray(undefined)).toBe(false);
    expect(isArray(null)).toBe(false);
    expect(isArray(true)).toBe(false);
    expect(isArray(new Date())).toBe(false);
    expect(isArray(new Error())).toBe(false);
    expect(isArray({})).toBe(false);
    expect(isArray(1)).toBe(false);
    expect(isArray(/x/)).toBe(false);
  });
});
