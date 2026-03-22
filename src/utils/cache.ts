interface CacheEntry<T> {
  d: T;
  exp: string; // ISO 8601 date string
}

export default class LocalStorageCache<T> {
  private key: string;

  private expirationMs: number;

  constructor(key: string, expirationMs: number) {
    this.key = key;
    this.expirationMs = expirationMs;
  }

  get(id: string): T | undefined {
    try {
      const raw = window.localStorage.getItem(this.key);
      if (raw == null) return undefined;

      const cache = JSON.parse(raw) as Record<string, CacheEntry<T>>;
      const entry = cache[id];
      if (entry == null) return undefined;

      const now = new Date().toISOString();
      if (now >= entry.exp) return undefined;

      return entry.d;
    } catch {
      return undefined;
    }
  }

  set(id: string, value: T): void {
    try {
      const raw = window.localStorage.getItem(this.key);
      const cache: Record<string, CacheEntry<T>> = raw != null
        ? (JSON.parse(raw) as Record<string, CacheEntry<T>>)
        : {};

      const exp = new Date(Date.now() + this.expirationMs).toISOString();
      cache[id] = { d: value, exp };

      window.localStorage.setItem(this.key, JSON.stringify(cache));
    } catch {
      // Ignore
    }
  }

  getMany(ids: string[]): Record<string, T | undefined> {
    try {
      const raw = window.localStorage.getItem(this.key);
      if (raw == null) return {};

      const cache = JSON.parse(raw) as Record<string, CacheEntry<T>>;
      const now = new Date().toISOString();
      const results: Record<string, T | undefined> = {};

      for (const id of ids) {
        const entry = cache[id];
        if (entry != null && now < entry.exp) {
          results[id] = entry.d;
        }
      }
      return results;
    } catch {
      return {};
    }
  }

  setMany(entries: Record<string, T>): void {
    try {
      const raw = window.localStorage.getItem(this.key);
      const cache: Record<string, CacheEntry<T>> = raw != null
        ? (JSON.parse(raw) as Record<string, CacheEntry<T>>)
        : {};

      const exp = new Date(Date.now() + this.expirationMs).toISOString();

      for (const [id, value] of Object.entries(entries)) {
        cache[id] = { d: value, exp };
      }

      window.localStorage.setItem(this.key, JSON.stringify(cache));
    } catch {
      // Ignore
    }
  }
}
