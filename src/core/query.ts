export async function parallelSettled<T extends Record<string, Promise<unknown>>>(queries: T): Promise<{ [K in keyof T]: Awaited<T[K]> | undefined }> {
  const entries = Object.entries(queries);
  const settled = await Promise.allSettled(entries.map(([, promise]) => promise));
  return Object.fromEntries(settled.map((result, index) => [entries[index]?.[0], result.status === 'fulfilled' ? result.value : undefined])) as { [K in keyof T]: Awaited<T[K]> | undefined };
}
