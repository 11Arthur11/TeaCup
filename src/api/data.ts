export const dataOf = <T>(response: { data?: T } | undefined | null): T | undefined => response?.data;
export const contentOf = <T>(response: { data?: { content?: T[] } } | undefined | null): T[] => response?.data?.content ?? [];
export const pageOf = (response: { data?: { page?: { number?: number; totalPages?: number; totalElements?: number; size?: number } } } | undefined | null) => ({
  number: Number(response?.data?.page?.number ?? 0),
  totalPages: Number(response?.data?.page?.totalPages ?? 0),
  totalElements: Number(response?.data?.page?.totalElements ?? 0),
  size: Number(response?.data?.page?.size ?? 20),
});
