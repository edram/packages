import { UAParser } from 'ua-parser-js';

const useUAParser = (userAgent?: string) => {
  const parser = new UAParser(userAgent ?? global.navigator.userAgent);

  return parser;
};

const useUAOS = (userAgent?: string) => {
  const parser = useUAParser(userAgent);

  return parser.getOS();
};

export default useUAParser;

export { useUAOS };
