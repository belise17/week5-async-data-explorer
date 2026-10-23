
const BASE_URL = "https://dummyjson.com";

export async function getJSON(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`);
  }

  return response.json();
}

export async function getProducts() {
  const categories = ["beauty", "skin-care", "fragrances"];

  const results = await Promise.all(
    categories.map((category) =>
      getJSON(
        `${BASE_URL}/products/category/${category}?limit=100`
      )
    )
  );

  const products = results.flatMap(({ products }) => products);

  return {
    products: [...new Map(
      products.map((product) => [product.id, product])
    ).values()],
  };
}

export async function getProduct(id) {
  return getJSON(`${BASE_URL}/products/${id}`);
}

export async function getCategories() {
  return getJSON(`${BASE_URL}/products/category-list`);
}
