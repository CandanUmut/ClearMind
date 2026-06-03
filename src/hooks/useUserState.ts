import { useCallback, useEffect, useRef, useState } from 'react';
import type { UserState } from '../types';
import { defaultState, loadState, saveState } from '../lib/storage';

/**
 * Single source of truth for persisted user state. Reads once on mount, and
 * persists (debounced via microtask coalescing through React state) on change.
 */
export function useUserState() {
  const [state, setState] = useState<UserState>(() =>
    typeof window === 'undefined' ? defaultState() : loadState(),
  );
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return; // don't re-write the freshly-loaded state
    }
    saveState(state);
  }, [state]);

  // Keep the document theme attribute in sync with settings.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', state.settings.theme);
  }, [state.settings.theme]);

  const update = useCallback((fn: (prev: UserState) => UserState) => {
    setState((prev) => fn(prev));
  }, []);

  return { state, setState, update };
}
