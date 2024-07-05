import { currentUrl } from './currentUrl';

export function pathname(): string {
  const url = currentUrl();

  return url.pathname;
}
