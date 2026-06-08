import type { UserRole } from './authorization.js';

export interface IdentityState {
  status: 'checking' | 'guest' | 'authenticated';
  userId: number | null;
  role: UserRole | null;
  raw?: unknown;
}

export interface ProductCategoryNavItem {
  name: string;
  slug: string;
}

export interface AppState {
  identity: IdentityState;
  sidebarOpen: boolean;
  productCategories: ProductCategoryNavItem[];
  productSubtreeOpen: boolean;
}

type Listener = (state: Readonly<AppState>) => void;

class Store {
  private state: AppState = {
    identity: { status: 'guest', userId: null, role: null },
    sidebarOpen: false,
    productCategories: [],
    productSubtreeOpen: false,
  };
  private listeners = new Set<Listener>();

  get(): Readonly<AppState> { return this.state; }
  set(patch: Partial<AppState>): void {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((listener) => listener(this.state));
  }
  setIdentity(identity: IdentityState): void { this.set({ identity }); }
  setProductCategories(categories: ProductCategoryNavItem[]): void {
    const normalized = categories
      .filter((category) => category.name.trim() && category.slug.trim())
      .map((category) => ({ name: category.name.trim(), slug: category.slug.trim() }));
    const previous = JSON.stringify(this.state.productCategories);
    const next = JSON.stringify(normalized);
    if (previous !== next) this.set({ productCategories: normalized });
  }
  subscribe(listener: Listener): () => void { this.listeners.add(listener); return () => this.listeners.delete(listener); }
}

export const store = new Store();
