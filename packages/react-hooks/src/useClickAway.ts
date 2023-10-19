import type { TargetType } from '@edram/react-utils';
import { getTargetElement } from '@edram/react-utils';
import { useEffect } from 'react';

export default function useClickAway(
  onClickAway: (event: MouseEvent) => void,
  target: TargetType | TargetType[],
): void {
  useEffect(() => {
    const fn = (event: MouseEvent) => {
      let includeTarget: boolean = false;
      const targets = Array.isArray(target) ? target : [target];
      for (const item of targets) {
        const element = getTargetElement(item);

        if (!element) {
          continue;
        }
        const elements = Array.isArray(element) ? element : [element];

        for (const element of elements) {
          if (!element.contains(event.target as Node)) {
            continue;
          }

          includeTarget = true;
          break;
        }

        if (!includeTarget) {
          continue;
        }
        break;
      }

      if (includeTarget) {
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
