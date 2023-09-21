import { act, renderHook } from '@testing-library/react-hooks';
import useUpdate from './useUpdate';

describe('useUpdate', () => {
  it('useUpdate 的返回值应该是一个方法', () => {
    const { result } = renderHook(() => useUpdate());

    expect(typeof result.current).toBe('function');
  });

  it('每次调用 update ，应该会重新渲染', () => {
    let renders = 0;
    const { result } = renderHook(() => {
      renders++;
      return useUpdate();
    });
    const { current: update } = result;

    expect(renders).toBe(1);

    act(() => update());
    expect(renders).toBe(2);

    act(() => update());
    expect(renders).toBe(3);
  });
});
