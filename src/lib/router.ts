import { writable } from 'svelte/store';

interface RouteState {
  path: string;
  params: Record<string, string>;
}

function createRouter() {
  const { subscribe, set } = writable<RouteState>({
    path: '/',
    params: {}
  });

  function handleHashChange() {
    let hash = window.location.hash.slice(1);
    if (!hash) hash = '/';

    // Simple pattern matching
    // Support: /, /thread/:id, /series/:id
    const threadMatch = hash.match(/^\/thread\/([^/]+)$/);
    const seriesMatch = hash.match(/^\/series\/([^/]+)$/);
    
    if (threadMatch) {
      set({ path: '/thread', params: { id: threadMatch[1] } });
    } else if (seriesMatch) {
      set({ path: '/series', params: { id: seriesMatch[1] } });
    } else {
      set({ path: hash, params: {} });
    }
  }

  return {
    subscribe,
    init: () => {
      window.addEventListener('hashchange', handleHashChange);
      handleHashChange(); // Initial check
    },
    navigate: (path: string) => {
      window.location.hash = path;
    }
  };
}

export const router = createRouter();
