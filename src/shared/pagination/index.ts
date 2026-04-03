export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    pagination: PaginationMeta;
    requestId?: string;
  };
}

export const DEFAULT_PAGE_SIZE = 25;
export const MAX_PAGE_SIZE = 100;

export function normalizePagination(params: Partial<PaginationParams>): PaginationParams {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, params.pageSize ?? DEFAULT_PAGE_SIZE));
  return { page, pageSize };
}

export function buildPaginationMeta(
  page: number,
  pageSize: number,
  totalCount: number
): PaginationMeta {
  return {
    page,
    pageSize,
    totalCount,
    totalPages: Math.ceil(totalCount / pageSize),
  };
}
