import { useCallback, useState } from 'react';
import copy from 'copy-to-clipboard';

export type CopyToClipboardState = {
  value?: string;
  error?: Error;
};

const useCopyToClipboard = (): [
  CopyToClipboardState,
  (value: string) => void,
] => {
  const [state, setState] = useState<CopyToClipboardState>({
    value: undefined,
    error: undefined,
  });

  const copyToClipboard = useCallback((value: string) => {
    try {
      copy(value);
      setState({
        value: value,
        error: undefined,
      });
    } catch (error) {
      let err: Error;
      if (error instanceof Error) {
        err = error;
      } else {
        err = new Error(`${error}`);
      }

      setState({
        value: value,
        error: err,
      });
    }
  }, []);

  return [state, copyToClipboard];
};

export default useCopyToClipboard;
