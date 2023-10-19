import { isString } from '@edram/utils';
import type { MutableRefObject } from 'react';

export type TargetType = string | MutableRefObject<Element> | Element;

export function getTargetElement(target: string): Element[];
export function getTargetElement(target: Element): Element;
export function getTargetElement(target: MutableRefObject<Element>): Element;
export function getTargetElement(
  target: TargetType,
): null | Element | Element[];

export function getTargetElement(target: TargetType) {
  if (isString(target)) {
    return Array.from(document.querySelectorAll(target));
  }

  if ('current' in target) {
    return target.current;
  }

  return target;
}
