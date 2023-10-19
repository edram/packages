import { isFunction } from '../src';

describe('function', () => {
  it('以下是方法的情况', () => {
    expect(isFunction(isFunction)).toBeTruthy();
    expect(isFunction(Array)).toBeTruthy();
    expect(isFunction(Date)).toBeTruthy();
    expect(isFunction(Object)).toBeTruthy();
    expect(isFunction(Number)).toBeTruthy();
    expect(isFunction(String)).toBeTruthy();
    expect(isFunction(Symbol)).toBeTruthy();

    expect(isFunction(() => {})).toBeTruthy();
    expect(isFunction(function () {})).toBeTruthy();
    expect(isFunction(() => 1)).toBeTruthy();
    expect(isFunction(async () => 1)).toBeTruthy();
  });

  it('以下不是方法的情况', () => {
    expect(isFunction(1)).toBeFalsy();
    expect(isFunction({})).toBeFalsy();
    expect(isFunction([])).toBeFalsy();
    expect(isFunction('function')).toBeFalsy();
    expect(isFunction(true)).toBeFalsy();
  });
});
