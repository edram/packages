import { RefObject, useEffect } from 'react';

export default function useClickAway(
  onClickAway: (event: MouseEvent) => void,
  target: RefObject<HTMLElement> | HTMLElement,
): void {
  useEffect(() => {
    const fn = (event: MouseEvent) => {
      let element: HTMLElement | null = null;
      if ('current' in target) {
        element = target.current;
      } else {
        element = target;
      }

      if (!element) {
        return;
      }
      if (element.contains(event.target as Node)) {
        return;
      }

      onClickAway(event);
    };

    document.addEventListener('click', fn);

    return () => {
      document.removeEventListener('click', fn);
    };
  }, [onClickAway, target]);
}
