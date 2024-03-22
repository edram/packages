export type NextAppRouterPage<
  Params extends Record<string, string> = Record<string, string>,
  Search extends Record<string, string> = Record<string, string>,
> = {
  params: Params;
  searchParams: Search;
};
