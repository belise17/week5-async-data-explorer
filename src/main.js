
import "./style.css";
import {
  getProducts,
  getCategories,
  getProduct,
} from "./api.js";
import { render } from "./render.js";

// Load saved favorites from the browser.
function loadFavorites() {
  try {
    const saved = JSON.parse(
      localStorage.getItem("belise-beauty-favorites") || "[]"
    );

    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

const state = {
  items: [],
  categories: [],
  status: "loading",
  error: null,
  query: "",
  filter: "all",
  sort: "default",
  selectedProduct: null,
  detailsStatus: "idle",
  favorites: loadFavorites(),
};

async function load() {
  state.status = "loading";
  state.error = null;
  render(state);

  try {
    const [productData, categories] = await Promise.all([
      getProducts(),
      getCategories(),
    ]);

    state.items = productData.products;
    state.categories = categories;
    state.status = "success";
  } catch (error) {
    state.status = "error";
    state.error = error.message;
  }

  render(state);
}

function updateState(key, value) {
  state[key] = value;
  render(state);
}

function toggleFavorite(id) {
  const productId = Number(id);

  if (state.favorites.includes(productId)) {
    state.favorites = state.favorites.filter(
      (favoriteId) => favoriteId !== productId
    );
  } else {
    state.favorites = [...state.favorites, productId];
  }

  try {
    localStorage.setItem(
      "belise-beauty-favorites",
      JSON.stringify(state.favorites)
    );
  } catch (error) {
    console.error("Could not save favorites:", error);
  }

  render(state);
}

// Live search.
document.addEventListener("input", (event) => {
  if (event.target.id === "search-input") {
    updateState("query", event.target.value);
  }
});

// Category and sorting controls.
document.addEventListener("change", (event) => {
  if (event.target.id === "category-filter") {
    updateState("filter", event.target.value);
  }

  if (event.target.id === "sort-select") {
    updateState("sort", event.target.value);
  }
});

// Handle buttons and product clicks.
document.addEventListener("click", async (event) => {
  // Retry loading products.
  const retryButton = event.target.closest("#retry-button");

  if (retryButton) {
    await load();
    return;
  }

  // Add or remove a favorite.
  const favoriteButton = event.target.closest("[data-favorite-id]");

  if (favoriteButton) {
    toggleFavorite(favoriteButton.dataset.favoriteId);
    return;
  }

  // Open product details.
  const productCard = event.target.closest("[data-id]");

  if (productCard) {
    state.selectedProduct = null;
    state.detailsStatus = "loading";
    state.error = null;
    render(state);

    try {
      state.selectedProduct = await getProduct(
        productCard.dataset.id
      );

      state.detailsStatus = "success";
    } catch (error) {
      console.error("Product details error:", error);
      state.detailsStatus = "error";
      state.error = error.message;
    }

    render(state);
    return;
  }

  // Close product details.
  if (event.target.closest("#close-details")) {
    state.selectedProduct = null;
    state.detailsStatus = "idle";
    render(state);
  }
});

// Start the application.
load();
