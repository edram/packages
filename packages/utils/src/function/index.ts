export const isFunction = (value: any): value is () => any => {
  return typeof value === 'function';
};
