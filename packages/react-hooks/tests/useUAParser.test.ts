import { renderHook } from '@testing-library/react-hooks';
import { useUAParser } from '../src';

describe('useUAParser', () => {
  it('解析 ua', () => {
    const ua =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36';
    vi.spyOn(global.navigator, 'userAgent', 'get').mockReturnValue(ua);

    const { result } = renderHook(() => {
      return useUAParser();
    });
    const { current } = result;

    expect(current.getOS()).toEqual({
      name: 'Windows',
      version: '10',
    });
    expect(current.getBrowser()).toEqual({
      major: '121',
      name: 'Chrome',
      version: '121.0.0.0',
    });
    expect(current.getUA()).toEqual(ua);
  });
});
