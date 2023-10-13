import { assignRef } from '@edram/react-utils';
import type { Ref } from 'react';
import { useCallback } from 'react';

type PossibleRef<T> = Ref<T> | undefined;

export function mergeRefs<T>(...refs: PossibleRef<T>[]) {
  return (node: T | null) => {
    refs.forEach((ref) => assignRef(ref, node));
  };
}

export default function useMergeRefs<T>(...refs: PossibleRef<T>[]) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback(mergeRefs(...refs), refs);
}
