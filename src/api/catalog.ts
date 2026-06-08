import { api } from './client.js';
import { dataOf } from './data.js';
import { store } from '../core/store.js';

let loaded = false;
let inFlight: Promise<void> | undefined;

/** Load the product category tree once after a successful authenticated profile response. */
export async function primeProductCategoryNavigation(force = false): Promise<void> {
  if (loaded && !force) return;
  if (inFlight) return inFlight;
  inFlight = (async () => {
    const response = await api.call('getCategories_1', {});
    const categories = dataOf(response) ?? [];
    store.setProductCategories(categories.flatMap((category) =>
      category.name && category.slug ? [{ name: category.name, slug: category.slug }] : []));
    loaded = true;
  })();
  try { await inFlight; }
  finally { inFlight = undefined; }
}
