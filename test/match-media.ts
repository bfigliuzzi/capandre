// jsdom n'implémente pas `matchMedia` : on le simule, requête par requête.

let matching = new Set<string>();

function fakeMatchMedia(query: string): MediaQueryList {
  return {
    matches: matching.has(query),
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  };
}

/** Les requêtes données répondent `true`, toutes les autres `false`. */
export function simulateMediaQueries(queries: readonly string[]): void {
  matching = new Set(queries);
}

export function resetMatchMedia(): void {
  matching = new Set();
  window.matchMedia = fakeMatchMedia;
}
