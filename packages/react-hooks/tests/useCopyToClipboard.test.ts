import copy from 'copy-to-clipboard';
import type { RenderHookResult } from '@testing-library/react-hooks';
import { act, renderHook } from '@testing-library/react-hooks';
import { useCopyToClipboard } from '../src';

vi.mock('copy-to-clipboard', () => {
  return {
    default: vi.fn(),
  };
});

describe('useCopyToClipboard', () => {
  let hook: RenderHookResult<unknown, ReturnType<typeof useCopyToClipboard>>;
  beforeEach(() => {
    hook = renderHook(() => useCopyToClipboard());
  });

  it('可以复制内容到剪切板', () => {
    const { result } = hook;
    const testValue = '';
    let [state, copyToClipboard] = result.current;

    act(() => {
      copyToClipboard(testValue);
    });

    [state, copyToClipboard] = result.current;
    expect(state.value).toBe(testValue);
    // 只要调用 copy 方法即可
    expect(copy).toBeCalled();
    // @ts-expect-error mock
    expect(copy.mock.lastCall).toEqual([testValue]);
  });
});
