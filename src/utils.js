
export function getVisibleItems({ items, query, filter, sort }) {
  const searchTerm = query.trim().toLowerCase();

  const filtered = items
    .filter(({ title, description, category }) => {
      const searchableText = [
        title || "",
        description || "",
        category || "",
      ].join(" ").toLowerCase();

      return searchableText.includes(searchTerm);
    })
    .filter(({ category }) => {
      return filter === "all" || category === filter;
    });

  const sorters = {
    "price-asc": (a, b) => a.price - b.price,
    "price-desc": (a, b) => b.price - a.price,
    name: (a, b) => a.title.localeCompare(b.title),
  };

  return sorters[sort]
    ? filtered.toSorted(sorters[sort])
    : filtered;
}
