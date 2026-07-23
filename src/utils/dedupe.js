export function dedupeAndSort(items) {
  const seen = new Map();
  for (const item of items) {
    const key = (item.name || '').trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.set(key, item);
  }
  return Array.from(seen.values())
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
}
