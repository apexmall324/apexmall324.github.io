import { createProductCard, getCategories, getProducts, updateCartCount } from "./app.js";

const productContainer = document.getElementById("shop-products");
const searchInput = document.getElementById("product-search");
const categoryFilter = document.getElementById("category-filter");
const sortSelect = document.getElementById("sort-products");
const productCount = document.getElementById("product-count");
let allProducts = [];

function categoryName(product) {
    return typeof product.category === "string" ? product.category : product.category?.name || "";
}

function loadCategoryOptions(categories) {
    categories.forEach(category => {
        const option = document.createElement("option");
        option.value = category.name;
        option.textContent = category.name;
        categoryFilter.appendChild(option);
    });
}

function displayProducts() {
    const search = searchInput.value.trim().toLocaleLowerCase();
    const category = categoryFilter.value;
    const products = allProducts.filter(product => {
        const matchesSearch = !search ||
            product.name.toLocaleLowerCase().includes(search) ||
            categoryName(product).toLocaleLowerCase().includes(search);
        const matchesCategory = category === "all" || categoryName(product) === category;
        return matchesSearch && matchesCategory;
    });

    switch (sortSelect.value) {
        case "newest":
            products.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            break;
        case "price-low":
            products.sort((a, b) => a.price - b.price);
            break;
        case "price-high":
            products.sort((a, b) => b.price - a.price);
            break;
        case "name":
            products.sort((a, b) => a.name.localeCompare(b.name));
            break;
    }

    productContainer.replaceChildren();
    productCount.textContent = `${products.length} ${products.length === 1 ? "product" : "products"}`;

    if (!products.length) {
        const empty = document.createElement("div");
        empty.className = "no-products";
        const heading = document.createElement("h3");
        heading.textContent = allProducts.length ? "No products found" : "Our collection is coming soon";
        const description = document.createElement("p");
        description.textContent = allProducts.length
            ? "Try another search or category."
            : "Please check back soon for new products.";
        empty.append(heading, description);
        productContainer.appendChild(empty);
        return;
    }

    products.forEach(product => productContainer.appendChild(createProductCard(product)));
}

async function init() {
    productContainer.innerHTML = '<p class="loading-note">Loading products…</p>';
    const [products, categories] = await Promise.all([getProducts(), getCategories()]);
    allProducts = products;
    loadCategoryOptions(categories);

    const params = new URLSearchParams(window.location.search);
    const requestedCategory = params.get("category");
    const requestedSort = params.get("sort");
    if ([...categoryFilter.options].some(option => option.value === requestedCategory)) {
        categoryFilter.value = requestedCategory;
    }
    if ([...sortSelect.options].some(option => option.value === requestedSort)) {
        sortSelect.value = requestedSort;
    }

    searchInput.addEventListener("input", displayProducts);
    categoryFilter.addEventListener("change", displayProducts);
    sortSelect.addEventListener("change", displayProducts);
    displayProducts();
    updateCartCount();
}

init().catch(error => {
    console.error("Could not load the shop:", error);
    productContainer.textContent = "We couldn't load the shop. Please refresh the page to try again.";
});
