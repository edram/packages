import { Ref } from 'react';

type PossibleRef<T> = Ref<T> | undefined;

const assignRef = <T>(ref: PossibleRef<T>, value: T) => {
  if (typeof ref === 'function') {
    ref(value);
  } else if (typeof ref === 'object' && ref !== null && 'current' in ref) {
    (ref as React.MutableRefObject<T>).current = value;
  }
};

export { assignRef };
