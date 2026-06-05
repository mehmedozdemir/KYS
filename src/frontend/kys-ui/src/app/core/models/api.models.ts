export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface ProblemDetails {
  status: number;
  title: string;
  detail: string;
  instance?: string;
  errors?: Record<string, string[]>;
}
