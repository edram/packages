import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export const useCurrentUrl = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [url, setUrl] = useState<URL>();

  useEffect(() => {
    let url = pathname;
    if (searchParams.size > 0) {
      url = `${url}?${searchParams}`;
    }

    setUrl(new URL(url, globalThis.location.origin));
  }, [pathname, searchParams]);

  return url;
};
