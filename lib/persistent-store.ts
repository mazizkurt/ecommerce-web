"use client";

import { useSyncExternalStore } from "react";

/**
 * localStorage'da tutulan, sekmeler arası senkronize küçük bir store.
 * Sunucu render'ında her zaman `fallback` döner, böylece hydration uyuşmazlığı olmaz.
 */
export function createPersistentStore<T>(
  key: string,
  fallback: T,
  sanitize: (raw: unknown) => T,
) {
  let value = fallback;
  let hydrated = false;
  let bound = false;
  const listeners = new Set<() => void>();

  const read = () => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? sanitize(JSON.parse(raw)) : fallback;
    } catch {
      return fallback;
    }
  };
  const notify = () => listeners.forEach((l) => l());

  const get = () => {
    if (!hydrated && typeof window !== "undefined") {
      hydrated = true;
      value = read();
    }
    return value;
  };

  const set = (next: T) => {
    value = next;
    hydrated = true;
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // gizli sekme vb. durumlarda yalnızca bellekte tutulur
    }
    notify();
  };

  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    if (!bound && typeof window !== "undefined") {
      bound = true;
      window.addEventListener("storage", (e) => {
        if (e.key === key) {
          value = read();
          notify();
        }
      });
    }
    return () => {
      listeners.delete(listener);
    };
  };

  const getServerSnapshot = () => fallback;
  const useValue = () => useSyncExternalStore(subscribe, get, getServerSnapshot);

  return { get, set, useValue };
}
