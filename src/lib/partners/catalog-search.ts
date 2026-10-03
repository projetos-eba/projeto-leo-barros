export function normalizeCatalogSearch(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
}

export function indexCatalog<T>(items: T[], text: (item: T) => string) {
  return items.map((item) => ({ item, searchText: normalizeCatalogSearch(text(item)) }));
}

export function searchCatalog<T>(index: { item: T; searchText: string }[], query: string, limit: number, predicate: (item: T) => boolean = () => true): T[] {
  const normalized = normalizeCatalogSearch(query);
  const results: T[] = [];
  for (const entry of index) {
    if (entry.searchText.includes(normalized) && predicate(entry.item)) {
      results.push(entry.item);
      if (results.length >= limit) break;
    }
  }
  return results;
}
