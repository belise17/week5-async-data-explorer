
import { getVisibleItems } from "./utils.js";

const app = document.querySelector("#app");

export function render(state) {
  if (!app) return;

  const activeId = document.activeElement?.id;
  const cursorPosition =
    activeId === "search-input"
      ? document.activeElement.selectionStart
      : null;

  if (state.status === "loading") {
    app.innerHTML = `
      <p class="status" role="status" aria-live="polite">
        Loading beauty products...
      </p>
      <div class="product-grid">
        ${Array.from({ length: 6 }, () =>
          '<div class="skeleton animate-pulse"></div>'
        ).join("")}
      </div>
    `;
    return;
  }

  if (state.status === "error") {
    app.innerHTML = `
      <section class="status" role="alert">
        <h2>We couldn't load the products</h2>
        <p>${escapeHTML(state.error || "Please try again.")}</p>
        <button id="retry-button" type="button">Retry</button>
      </section>
    `;
    return;
  }

  const items = getVisibleItems(state);

  const totalValue = state.items.reduce(
    (total, item) => total + Number(item.price || 0),
    0
  );

  const averageRating = state.items.length
    ? state.items.reduce(
        (total, item) => total + Number(item.rating || 0),
        0
      ) / state.items.length
    : 0;

  app.innerHTML = `
    <section class="stats-bar" aria-label="Product statistics">
      <div class="stat">
        <span>Total products</span>
        <strong>${state.items.length}</strong>
      </div>
      <div class="stat">
        <span>Average rating</span>
        <strong>⭐ ${averageRating.toFixed(1)}</strong>
      </div>
      <div class="stat">
        <span>Combined listed prices</span>
        <strong>$${totalValue.toFixed(2)}</strong>
      </div>
      <div class="stat">
        <span>Favorites</span>
        <strong>${state.favorites.length}</strong>
      </div>
    </section>

    <section class="explorer-controls" aria-label="Product controls">
      <label for="search-input">Search beauty products</label>
      <input
        id="search-input"
        class="search-input"
        type="search"
        placeholder="Search products..."
        value="${escapeHTML(state.query)}"
      />

      <label for="category-filter">Category</label>
      <select id="category-filter" class="filter-select">
        <option value="all" ${state.filter === "all" ? "selected" : ""}>
          All categories
        </option>
        ${state.categories.map((category) => `
          <option
            value="${escapeHTML(category)}"
            ${state.filter === category ? "selected" : ""}
          >
            ${escapeHTML(category.replaceAll("-", " "))}
          </option>
        `).join("")}
      </select>

      <label for="sort-select">Sort products</label>
      <select id="sort-select" class="sort-select">
        <option value="default" ${state.sort === "default" ? "selected" : ""}>
          Default order
        </option>
        <option value="price-asc" ${state.sort === "price-asc" ? "selected" : ""}>
          Price: low to high
        </option>
        <option value="price-desc" ${state.sort === "price-desc" ? "selected" : ""}>
          Price: high to low
        </option>
        <option value="name" ${state.sort === "name" ? "selected" : ""}>
          Name: A to Z
        </option>
      </select>
    </section>

    <p class="status" role="status" aria-live="polite">
      Showing ${items.length} of ${state.items.length} products
    </p>

    ${items.length === 0 ? `
      <section class="status" role="status">
        <h2>No products found</h2>
        <p>Try another search term or choose a different category.</p>
      </section>
    ` : `
      <div class="product-grid">
        ${items.map(({ id, title, price, category, thumbnail, rating }) => {
          const isFavorite = state.favorites.includes(Number(id));

          return `
            <article class="product-card">
              <button
                class="favorite-button"
                type="button"
                data-favorite-id="${Number(id)}"
                aria-label="${isFavorite ? "Remove from favorites" : "Add to favorites"}"
                aria-pressed="${isFavorite}"
              >
                ${isFavorite ? "❤️" : "♡"}
              </button>

              <button
                class="product-details-button"
                type="button"
                data-id="${Number(id)}"
                aria-label="View details for ${escapeHTML(title)}"
              >
                <img
                  src="${escapeHTML(thumbnail || "")}"
                  alt="${escapeHTML(title || "Beauty product")}"
                  loading="lazy"
                  onerror="this.style.display='none'"
                />

                <div class="product-info">
                  <h2>${escapeHTML(title || "Untitled product")}</h2>
                  <p class="category">${escapeHTML(
                    (category || "Other").replaceAll("-", " ")
                  )}</p>
                  <p class="price">$${Number(price || 0).toFixed(2)}</p>
                  <p>⭐ ${Number(rating || 0).toFixed(1)}</p>
                  <span>View details</span>
                </div>
              </button>
            </article>
          `;
        }).join("")}
      </div>
    `}

    ${renderDetails(state)}
  `;

  if (activeId === "search-input") {
    const searchInput = document.querySelector("#search-input");
    searchInput?.focus();

    if (cursorPosition !== null) {
      searchInput?.setSelectionRange(cursorPosition, cursorPosition);
    }
  }
}

function renderDetails(state) {
  if (state.detailsStatus === "idle") return "";

  if (state.detailsStatus === "loading") {
    return `
      <section class="details-panel" role="status" aria-live="polite">
        Loading product details...
      </section>
    `;
  }

  if (state.detailsStatus === "error") {
    return `
      <section class="details-panel" role="alert">
        <p>We couldn't load these product details.</p>
        <p>${escapeHTML(state.error || "Please try again.")}</p>
        <button id="close-details" type="button">Close</button>
      </section>
    `;
  }

  const product = state.selectedProduct;
  if (!product) return "";

  return `
    <section class="details-panel" aria-labelledby="details-title">
      <button id="close-details" type="button">Close details ✕</button>
      <h2 id="details-title">${escapeHTML(product.title)}</h2>
      <img
        src="${escapeHTML(product.thumbnail || "")}"
        alt="${escapeHTML(product.title)}"
        loading="lazy"
        onerror="this.style.display='none'"
      />
      <p>${escapeHTML(product.description || "No description available.")}</p>
      <p>Category: ${escapeHTML(
        (product.category || "Other").replaceAll("-", " ")
      )}</p>
      <p class="price">$${Number(product.price || 0).toFixed(2)}</p>
      <p>⭐ ${Number(product.rating || 0).toFixed(1)}</p>
    </section>
  `;
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}
