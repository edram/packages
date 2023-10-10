import { createRef } from 'react';
import { assignRef } from '../src';

describe('ref', () => {
  it('test assignRef', () => {
    const ref = createRef<number>();

    expect(ref.current).toBe(null);
    assignRef(ref, 1);
    expect(ref.current).toBe(1);
    assignRef(ref, 10);
    expect(ref.current).toBe(10);
  });

  it('test assignRef function', () => {
    const ref = createRef() as React.MutableRefObject<number>;
    const handleRef = (value: number) => {
      ref.current = value;
    };

    expect(ref.current).toBe(null);
    assignRef(handleRef, 1);
    expect(ref.current).toBe(1);
    assignRef(handleRef, 10);
    expect(ref.current).toBe(10);
  });
});
