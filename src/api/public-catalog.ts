import { api } from './client.js';
import { dataOf } from './data.js';
import type * as Models from './generated-models.js';

export interface PublicCatalogCategory {
  name: string;
  description: string;
  slug: string;
}

export interface PublicCatalogProduct {
  id?: number;
  productName?: string;
  price?: Models.Money;
  period?: string;
  productType?: 'TEASPEAK' | 'AUDIO_BOT' | string;
  categoryName?: string;
  categorySlug?: string;
  orderedResources?: number;
  maxClients?: number;
  enabled?: boolean;
  presentation?: Models.ProductPresentation;
}

let categoriesCache: PublicCatalogCategory[] | undefined;
let categoriesInFlight: Promise<PublicCatalogCategory[]> | undefined;
const productsCache = new Map<string, PublicCatalogProduct[]>();
const productRequests = new Map<string, Promise<PublicCatalogProduct[]>>();

function recordOf(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function listOf<T>(value: unknown): T[] {
  return Array.isArray(value) ? value as T[] : [];
}

export async function getPublicCategories(force = false): Promise<PublicCatalogCategory[]> {
  if (!force && categoriesCache) return categoriesCache;
  if (!force && categoriesInFlight) return categoriesInFlight;

  categoriesInFlight = (async () => {
    const response = await api.call('getCategories', {});
    const categories = dataOf(response) ?? [];
    categoriesCache = categories.flatMap((category) => {
      const name = category.name?.trim();
      const slug = category.slug?.trim();
      if (!name || !slug) return [];
      return [{ name, slug, description: category.description?.trim() ?? '' }];
    });
    return categoriesCache;
  })();

  try {
    return await categoriesInFlight;
  } finally {
    categoriesInFlight = undefined;
  }
}

export async function getPublicProducts(categorySlug: string, force = false): Promise<PublicCatalogProduct[]> {
  const slug = categorySlug.trim();
  if (!slug) return [];
  if (!force && productsCache.has(slug)) return productsCache.get(slug) ?? [];
  if (!force && productRequests.has(slug)) return productRequests.get(slug) ?? Promise.resolve([]);

  const request = (async () => {
    const response = await api.call('getProductByCategorySlug_1', { path: { categorySlug: slug } });
    const data = recordOf(response).data;
    const products = listOf<PublicCatalogProduct>(data).filter((product) => product.enabled !== false);
    productsCache.set(slug, products);
    return products;
  })();
  productRequests.set(slug, request);

  try {
    return await request;
  } finally {
    productRequests.delete(slug);
  }
}

export function invalidatePublicCatalog(): void {
  categoriesCache = undefined;
  productsCache.clear();
}
