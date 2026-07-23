export type LooseQueryResult = {
  data: unknown;
  error: { message: string } | null;
};

export type LooseQuery = PromiseLike<LooseQueryResult> & {
  delete(): LooseQuery;
  eq(column: string, value: unknown): LooseQuery;
  in(column: string, values: unknown[]): LooseQuery;
  insert(values: unknown): LooseQuery;
  limit(value: number): LooseQuery;
  maybeSingle(): LooseQuery;
  neq(column: string, value: unknown): LooseQuery;
  order(column: string, options?: { ascending?: boolean; referencedTable?: string }): LooseQuery;
  select(columns?: string): LooseQuery;
  single(): LooseQuery;
  update(values: unknown): LooseQuery;
  upsert(values: unknown, options?: { onConflict?: string }): LooseQuery;
};

export type LooseDb = {
  from(table: string): LooseQuery;
};
