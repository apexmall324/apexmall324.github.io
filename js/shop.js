import { createProductCard, getCategories, getProducts, shuffleProducts, updateCartCount } from "./app.js";

const productContainer = document.getElementById("shop-products");
const searchInput = document.getElementById("product-search");
const categoryFilter = document.getElementById("category-filter");
const sortSelect = document.getElementById("sort-products");
const minimumPriceInput = document.getElementById("minimum-price");
const maximumPriceInput = document.getElementById("maximum-price");
const sizeFilter = document.getElementById("size-filter");
const colorFilter = document.getElementById("color-filter");
const clearFiltersButton = document.getElementById("clear-filters");
const productCount = document.getElementById("product-count");
let allProducts = [];
const COLOR_OPTIONS = [
    ["beige", "Beige"],
    ["black", "Black"],
    ["blue", "Blue"],
    ["brown", "Brown"],
    ["burgundy", "Burgundy"],
    ["cream", "Cream"],
    ["gold", "Gold"],
    ["green", "Green"],
    ["grey", "Grey"],
    ["multicolor", "Multicolor"],
    ["orange", "Orange"],
    ["pink", "Pink"],
    ["purple", "Purple"],
    ["red", "Red"],
    ["silver", "Silver"],
    ["tan", "Tan"],
    ["white", "White"]
];

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

function productColors(product) {
    const text = `${product.name} ${product.description || ""}`.toLocaleLowerCase();
    return COLOR_OPTIONS
        .filter(([color]) => {
            if (color === "grey") return /\b(?:grey|gray)\b/.test(text);
            if (color === "multicolor") return /\bmulti[- ]colou?r\b/.test(text);
            return new RegExp(`\\b${color}\\b`).test(text);
        })
        .map(([color]) => color);
}

function productHasSize(product, size) {
    if (!product.sizeRange) return false;
    const match = product.sizeRange.match(/(\d+)\s*-\s*(\d+)/);
    if (!match) return product.sizeRange.split(/[,\s]+/).includes(size);
    const first = Number(match[1]);
    const last = Number(match[2]);
    const value = Number(size);
    return value >= Math.min(first, last) && value <= Math.max(first, last);
}

function loadFacetOptions() {
    const sizes = new Set();
    const colors = new Set();

    allProducts.forEach(product => {
        const range = product.sizeRange?.match(/(\d+)\s*-\s*(\d+)/);
        if (range) {
            const first = Number(range[1]);
            const last = Number(range[2]);
            for (let size = Math.min(first, last); size <= Math.max(first, last); size++) {
                sizes.add(size);
            }
        } else if (product.sizeRange) {
            product.sizeRange.split(/[,\s]+/).forEach(size => {
                if (size) sizes.add(size);
            });
        }
        productColors(product).forEach(color => colors.add(color));
    });

    [...sizes].sort((a, b) => Number(a) - Number(b)).forEach(size => {
        const option = document.createElement("option");
        option.value = String(size);
        option.textContent = `Size ${size}`;
        sizeFilter.appendChild(option);
    });

    COLOR_OPTIONS.filter(([color]) => colors.has(color)).forEach(([color, label]) => {
        const option = document.createElement("option");
        option.value = color;
        option.textContent = label;
        colorFilter.appendChild(option);
    });
}

function displayProducts() {
    const search = searchInput.value.trim().toLocaleLowerCase();
    const category = categoryFilter.value;
    const minimumPrice = minimumPriceInput.value === "" ? null : Number(minimumPriceInput.value);
    const maximumPrice = maximumPriceInput.value === "" ? null : Number(maximumPriceInput.value);
    const size = sizeFilter.value;
    const color = colorFilter.value;
    const products = allProducts.filter(product => {
        const matchesSearch = !search ||
            product.name.toLocaleLowerCase().includes(search) ||
            categoryName(product).toLocaleLowerCase().includes(search) ||
            (product.description || "").toLocaleLowerCase().includes(search);
        const matchesCategory = category === "all" || categoryName(product) === category;
        const matchesMinimumPrice = minimumPrice === null || product.price >= minimumPrice;
        const matchesMaximumPrice = maximumPrice === null || product.price <= maximumPrice;
        const matchesSize = size === "all" || productHasSize(product, size);
        const matchesColor = color === "all" || productColors(product).includes(color);
        return matchesSearch && matchesCategory && matchesMinimumPrice &&
            matchesMaximumPrice && matchesSize && matchesColor;
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
            ? "Try adjusting your search or filters."
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
    allProducts = shuffleProducts(products);
    loadCategoryOptions(categories);
    loadFacetOptions();

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
    minimumPriceInput.addEventListener("input", displayProducts);
    maximumPriceInput.addEventListener("input", displayProducts);
    sizeFilter.addEventListener("change", displayProducts);
    colorFilter.addEventListener("change", displayProducts);
    clearFiltersButton.addEventListener("click", () => {
        searchInput.value = "";
        categoryFilter.value = "all";
        sortSelect.value = "default";
        minimumPriceInput.value = "";
        maximumPriceInput.value = "";
        sizeFilter.value = "all";
        colorFilter.value = "all";
        displayProducts();
    });
    displayProducts();
    updateCartCount();
}

init().catch(error => {
    console.error("Could not load the shop:", error);
    productContainer.textContent = "We couldn't load the shop. Please refresh the page to try again.";
});
