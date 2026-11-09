import { PRODUCTS } from "./footwear-products.js";

export const WHATSAPP_NUMBER = "233597323795";
const CART_KEY = "cart";

const BANNERS = [
    {
        eyebrow: "NEW COLLECTION",
        title: "Discover products you'll love.",
        description: "Explore our latest collection and find something made just for you.",
        image: "product/banner-watch-collection.png",
        alt: "Apexmall shopping collection",
        ctaLabel: "Shop Now",
        ctaHref: "shop.html"
    },
    {
        eyebrow: "A LITTLE EVERYDAY LUXURY",
        title: "Find a piece that feels like you.",
        description: "Explore the watch and bracelet set, and browse the collection at Apexmall.",
        image: "product/banner-bag-collection.png",
        alt: "Ladies gold watch and bracelet set",
        ctaLabel: "Shop Watches",
        ctaHref: "shop.html?category=Watches"
    }
];

const STORIES = [
    {
        label: "Customer review",
        type: "review",
        image: ["product/reviews/review1.jpeg", "product/reviews/review2.jpeg", "product/reviews/review3.jpeg"],
        alt: "Customer message sharing a photo of their watch and saying it is pretty",
        headline: "Another satisfied purchase",
        text: "A customer shared a photo of their watch and said, “So pretty!”"
    },
    {
        label: "Packages sent out",
        type: "dispatch",
        image: ["product/reviews/review2.jpeg", "product/reviews/review3.jpeg"],
        alt: "Customer message sharing a photo of their package and saying it arrived safely",
        headline: "Order dispatch updates",
        text: "Parcel photos and dispatch updates will be shared here."
    }
];

export async function getProducts() {
    return PRODUCTS;
}

export function shuffleProducts(products) {
    const shuffled = [...products];
    for (let index = shuffled.length - 1; index > 0; index--) {
        const randomIndex = Math.floor(Math.random() * (index + 1));
        [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
    }
    return shuffled;
}

export function getProductById(id) {
    return PRODUCTS.find(product => product.id === id) || null;
}

export async function getProductsByIds(ids) {
    const requestedIds = new Set(ids);
    return PRODUCTS.filter(product => requestedIds.has(product.id));
}

export function getAvailableStock(product, inCart = 0) {
    return Number.isFinite(product.stock)
        ? Math.max(0, product.stock - inCart)
        : Infinity;
}

export async function getCategories() {
    const categories = new Map();
    PRODUCTS.forEach(product => {
        const categoryName = typeof product.category === "string"
            ? product.category
            : product.category?.name;
        if (categoryName) {
            const existing = categories.get(categoryName);
            const image = typeof product.category === "string" ? "" : product.category?.image;
            categories.set(categoryName, {
                id: categoryName,
                name: categoryName,
                image: existing?.image || image
            });
        }
    });
    return [...categories.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function createWhatsAppUrl(message) {
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export function productEnquiryUrl(product) {
    return createWhatsAppUrl(`Hello Apexmall, I have an enquiry about ${product.name}.`);
}

export function formatMoney(amount) {
    return `GH₵${Number(amount).toLocaleString("en-GH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
}

export function productImageTag(product, className = "") {
    const image = document.createElement("img");
    image.className = className;
    image.src = product.image || "product/placeholder.svg";
    image.alt = product.name;
    image.loading = "lazy";
    image.addEventListener("error", () => {
        image.src = "product/placeholder.svg";
    }, { once: true });
    return image;
}

export function getCart() {
    const savedCart = localStorage.getItem(CART_KEY);
    if (!savedCart) return [];

    try {
        const cart = JSON.parse(savedCart);
        if (!Array.isArray(cart)) throw new TypeError("Saved cart must be a list.");

        return cart.filter(item =>
            item &&
            typeof item.id === "string" &&
            Number.isInteger(item.quantity) &&
            item.quantity > 0
        );
    } catch (error) {
        console.error("Could not read the saved cart:", error);
        localStorage.removeItem(CART_KEY);
        return [];
    }
}

export function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartCount();
}

export function updateCartCount() {
    const cart = getCart();
    const total = cart.reduce((sum, item) => sum + item.quantity, 0);

    document.querySelectorAll("#cart-count").forEach(element => {
        element.textContent = String(total);
    });

    document.querySelectorAll("[data-stock-product]").forEach(button => {
        const product = getProductById(button.dataset.stockProduct);
        const inCart = cart.find(item => item.id === button.dataset.stockProduct)?.quantity || 0;
        const available = product ? getAvailableStock(product, inCart) : 0;
        button.disabled = available <= 0;
        button.textContent = available > 0 ? "Add to Cart" : "Out of Stock";
    });
}

export function addToCart(productId, quantity = 1) {
    const product = getProductById(productId);
    if (!product || !Number.isInteger(quantity) || quantity < 1) return false;

    const cart = getCart();
    const existing = cart.find(item => item.id === productId);
    const currentQuantity = existing?.quantity || 0;

    if (Number.isFinite(product.stock) && currentQuantity + quantity > product.stock) {
        showToast(currentQuantity >= product.stock
            ? "This product is out of stock."
            : `Only ${product.stock - currentQuantity} more available.`);
        return false;
    }

    if (existing) {
        existing.quantity += quantity;
    } else {
        cart.push({ id: productId, quantity });
    }

    saveCart(cart);
    showToast(product.pairsPerCarton
        ? `${quantity} ${quantity === 1 ? "carton" : "cartons"} of ${product.name} added at the carton price.`
        : `${product.name} added to your cart.`);
    return true;
}

function showToast(message) {
    let toast = document.getElementById("store-toast");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "store-toast";
        toast.className = "store-toast";
        toast.setAttribute("role", "status");
        document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(showToast.timeout);
    showToast.timeout = window.setTimeout(() => toast.classList.remove("is-visible"), 2600);
}

export function createProductCard(product) {
    const card = document.createElement("article");
    card.className = "product-card";

    const link = document.createElement("a");
    link.href = `product.html?id=${encodeURIComponent(product.id)}`;

    const imageContainer = document.createElement("div");
    imageContainer.className = "product-image";
    imageContainer.appendChild(productImageTag(product));

    const name = document.createElement("h3");
    name.textContent = product.name;

    const price = document.createElement("p");
    price.className = "product-price";
    price.textContent = product.pairsPerCarton
        ? `${formatMoney(product.pairPrice)} / pair · ${formatMoney(product.price)} / carton`
        : formatMoney(product.price);

    link.append(imageContainer, name, price);

    const addButton = document.createElement("button");
    addButton.type = "button";
    addButton.className = "add-to-cart";
    addButton.textContent = "Add to Cart";
    addButton.setAttribute("aria-label", product.pairsPerCarton
        ? `Add one full carton of ${product.name} to cart`
        : `Add ${product.name} to cart`);
    addButton.dataset.stockProduct = product.id;
    addButton.addEventListener("click", () => addToCart(product.id));

    card.append(link, addButton);
    return card;
}

function renderCards(container, products, emptyMessage) {
    if (!container) return;
    container.replaceChildren();

    if (!products.length) {
        const message = document.createElement("p");
        message.className = "loading-note";
        message.textContent = emptyMessage;
        container.appendChild(message);
        return;
    }

    products.forEach(product => container.appendChild(createProductCard(product)));
    updateCartCount();
}

async function displayFeaturedProducts() {
    const container = document.getElementById("featured-products");
    if (!container) return;

    const products = await getProducts();
    const featured = shuffleProducts(products.filter(product => product.is_featured)).slice(0, 8);
    const featuredIds = new Set(featured.map(product => product.id));
    const remaining = shuffleProducts(products.filter(product => !featuredIds.has(product.id)));
    const selection = [...featured, ...remaining].slice(0, 4);
    renderCards(
        container,
        selection,
        "Our product collection is being prepared. Please check back soon."
    );
}

async function displayStorefrontCollections() {
    const newContainer = document.getElementById("new-products");
    const limitedContainer = document.getElementById("limited-products");
    if (!newContainer && !limitedContainer) return;

    const products = await getProducts();
    const newest = [...products].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    renderCards(newContainer, shuffleProducts(newest).slice(0, 4), "New products are coming soon.");
    renderCards(
        limitedContainer,
        shuffleProducts(products.filter(product => product.stock > 0 && product.stock <= 10)).slice(0, 4),
        "No limited-stock products at the moment."
    );
}

async function displayCategoryRail() {
    const container = document.getElementById("category-rail");
    if (!container) return;

    const categories = await getCategories();
    container.replaceChildren();

    categories.forEach(category => {
        const link = document.createElement("a");
        link.href = `shop.html?category=${encodeURIComponent(category.name)}`;
        link.className = "category-card";

        const image = document.createElement("div");
        image.className = "category-image";
        if (category.image) {
            image.appendChild(productImageTag({ image: category.image, name: `${category.name} category` }));
        } else {
            image.innerHTML = '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><polygon points="50,15 85,80 15,80" fill="none" stroke="currentColor" stroke-width="3"/></svg>';
        }

        const title = document.createElement("h3");
        title.textContent = category.name;
        link.append(image, title);
        container.appendChild(link);
    });

    const viewAll = document.createElement("a");
    viewAll.href = "shop.html";
    viewAll.className = "category-card";
    viewAll.innerHTML = '<div class="category-image"><svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><polygon points="50,15 85,80 15,80" fill="none" stroke="currentColor" stroke-width="3"/></svg></div><h3>View All</h3>';
    container.appendChild(viewAll);
}

function setupMobileNav() {
    const header = document.querySelector(".header");
    const nav = header?.querySelector(".navigation");
    if (!header || !nav || header.querySelector(".mobile-nav-toggle")) return;

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "mobile-nav-toggle";
    toggle.setAttribute("aria-label", "Open menu");
    toggle.setAttribute("aria-expanded", "false");
    toggle.textContent = "☰";

    const actions = header.querySelector(".header-actions");
    header.insertBefore(toggle, actions || null);
    toggle.addEventListener("click", () => {
        const isOpen = nav.classList.toggle("mobile-open");
        toggle.textContent = isOpen ? "✕" : "☰";
        toggle.setAttribute("aria-expanded", String(isOpen));
        toggle.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
    });
}

function setupBackToTop() {
    if (document.querySelector(".back-to-top")) return;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "back-to-top";
    button.setAttribute("aria-label", "Back to top");
    button.title = "Back to top";
    button.textContent = "↑";
    document.body.appendChild(button);

    const updateVisibility = () => {
        button.classList.toggle("is-visible", window.scrollY > 420);
    };

    window.addEventListener("scroll", updateVisibility, { passive: true });
    button.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
    updateVisibility();
}

function setupHomeReveals() {
    const sections = document.querySelectorAll(".home-page [data-reveal]");
    if (
        !sections.length ||
        !("IntersectionObserver" in window) ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
        sections.forEach(section => section.classList.add("is-visible"));
        return;
    }

    document.body.classList.add("home-reveal-ready");
    const observer = new IntersectionObserver((entries, currentObserver) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("is-visible");
                currentObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12 });

    sections.forEach(section => observer.observe(section));
}

function showLoadError(containerId, error) {
    console.error(`Could not load ${containerId}:`, error);
    const container = document.getElementById(containerId);
    if (container) container.textContent = "We couldn't load this section. Please refresh the page to try again.";
}

function setupHeroBanners() {
    const hero = document.querySelector(".hero");
    const image = document.getElementById("hero-image");
    const eyebrow = document.getElementById("hero-eyebrow");
    const title = document.getElementById("hero-title");
    const description = document.getElementById("hero-description");
    const cta = document.getElementById("hero-cta");
    const dots = document.getElementById("hero-dots");
    const previous = document.getElementById("hero-previous");
    const next = document.getElementById("hero-next");
    if (!hero || !image || !eyebrow || !title || !description || !cta || !dots || !previous || !next) return;

    let activeIndex = 0;
    let intervalId;
    const dotButtons = BANNERS.map((banner, index) => {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = "hero-dot";
        dot.setAttribute("aria-label", `Show banner ${index + 1}: ${banner.title}`);
        dot.addEventListener("click", () => showBanner(index));
        dots.appendChild(dot);
        return dot;
    });

    function showBanner(index) {
        activeIndex = (index + BANNERS.length) % BANNERS.length;
        const banner = BANNERS[activeIndex];
        image.classList.add("is-changing");
        image.src = banner.image;
        image.alt = banner.alt;
        eyebrow.textContent = banner.eyebrow;
        title.textContent = banner.title;
        description.textContent = banner.description;
        cta.textContent = banner.ctaLabel;
        cta.href = banner.ctaHref;
        dotButtons.forEach((dot, dotIndex) => {
            dot.setAttribute("aria-current", String(dotIndex === activeIndex));
        });
        window.requestAnimationFrame(() => image.classList.remove("is-changing"));
    }

    function stopRotation() {
        window.clearInterval(intervalId);
        intervalId = undefined;
    }

    function startRotation() {
        stopRotation();
        if (
            BANNERS.length > 1 &&
            !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
            !document.hidden &&
            !hero.matches(":hover") &&
            !hero.contains(document.activeElement)
        ) {
            intervalId = window.setInterval(() => showBanner(activeIndex + 1), 6500);
        }
    }

    previous.addEventListener("click", () => {
        showBanner(activeIndex - 1);
        startRotation();
    });
    next.addEventListener("click", () => {
        showBanner(activeIndex + 1);
        startRotation();
    });
    hero.addEventListener("mouseenter", stopRotation);
    hero.addEventListener("mouseleave", startRotation);
    hero.addEventListener("focusin", stopRotation);
    hero.addEventListener("focusout", event => {
        if (!hero.contains(event.relatedTarget)) startRotation();
    });
    document.addEventListener("visibilitychange", startRotation);
    showBanner(activeIndex);
    startRotation();
}

function setupStories() {
    const rail = document.getElementById("stories-rail");
    if (!rail) return;

    const viewer = document.createElement("dialog");
    viewer.className = "story-viewer";
    viewer.setAttribute("aria-label", "Customer reviews and order updates");

    const progress = document.createElement("div");
    progress.className = "story-progress";
    progress.setAttribute("aria-hidden", "true");

    const header = document.createElement("div");
    header.className = "story-viewer-header";
    const label = document.createElement("p");
    label.className = "story-viewer-label";
    const close = document.createElement("button");
    close.type = "button";
    close.className = "story-close";
    close.setAttribute("aria-label", "Close story");
    close.textContent = "×";
    close.addEventListener("click", () => viewer.close());
    header.append(label, close);

    const content = document.createElement("div");
    content.className = "story-viewer-content";
    const image = document.createElement("img");
    image.className = "story-viewer-image";
    image.hidden = true;
    const message = document.createElement("div");
    message.className = "story-viewer-message";
    const icon = document.createElement("span");
    icon.className = "story-viewer-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = "📦";
    const headline = document.createElement("h3");
    const text = document.createElement("p");
    message.append(icon, headline, text);
    content.append(image, message);

    const navigation = document.createElement("div");
    navigation.className = "story-viewer-navigation";
    const previous = document.createElement("button");
    previous.type = "button";
    previous.setAttribute("aria-label", "Previous story");
    previous.textContent = "‹";
    const next = document.createElement("button");
    next.type = "button";
    next.setAttribute("aria-label", "Next story");
    next.textContent = "›";
    navigation.append(previous, next);
    viewer.append(progress, header, content, navigation);
    document.body.appendChild(viewer);

    let activeIndex = 0;
    let activeImageIndex = 0;
    const storyImages = story => {
        if (Array.isArray(story.image)) return story.image.filter(Boolean);
        return story.image ? [story.image] : [];
    };

    const showStory = (index, imageIndex = 0) => {
        activeIndex = (index + STORIES.length) % STORIES.length;
        const story = STORIES[activeIndex];
        const images = storyImages(story);
        activeImageIndex = images.length ? (imageIndex + images.length) % images.length : 0;
        const hasImages = images.length > 0;
        label.textContent = story.label;
        headline.textContent = story.headline;
        text.textContent = story.text;
        image.hidden = !hasImages;
        message.hidden = hasImages;
        content.classList.toggle("has-image", hasImages);
        if (hasImages) {
            image.src = images[activeImageIndex];
            image.alt = story.alt || story.label;
        } else {
            icon.textContent = story.type === "dispatch" ? "📦" : "•";
        }

        progress.replaceChildren(...images.map((_, index) => {
            const segment = document.createElement("span");
            segment.className = "story-progress-segment";
            segment.classList.toggle("is-viewed", index <= activeImageIndex);
            return segment;
        }));
    };

    previous.addEventListener("click", () => {
        if (activeImageIndex > 0) {
            showStory(activeIndex, activeImageIndex - 1);
        } else {
            const previousStoryIndex = (activeIndex - 1 + STORIES.length) % STORIES.length;
            showStory(previousStoryIndex, storyImages(STORIES[previousStoryIndex]).length - 1);
        }
    });
    next.addEventListener("click", () => {
        const images = storyImages(STORIES[activeIndex]);
        if (activeImageIndex < images.length - 1) {
            showStory(activeIndex, activeImageIndex + 1);
        } else {
            showStory(activeIndex + 1);
        }
    });

    STORIES.forEach((story, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = `story-item story-item-${story.type}`;
        button.setAttribute("aria-label", `View story: ${story.label}`);

        const ring = document.createElement("span");
        ring.className = "story-ring";
        const images = storyImages(story);
        if (images.length) {
            const thumbnail = document.createElement("img");
            thumbnail.src = images[0];
            thumbnail.alt = "";
            thumbnail.loading = "lazy";
            ring.appendChild(thumbnail);
        } else {
            const thumbnailLabel = document.createElement("span");
            thumbnailLabel.className = "story-placeholder";
            thumbnailLabel.setAttribute("aria-hidden", "true");
            thumbnailLabel.textContent = "📦";
            ring.appendChild(thumbnailLabel);
        }

        const caption = document.createElement("span");
        caption.className = "story-item-label";
        caption.textContent = story.label;
        button.append(ring, caption);
        button.addEventListener("click", () => {
            showStory(index);
            viewer.showModal();
            close.focus();
        });
        rail.appendChild(button);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    updateCartCount();
    setupMobileNav();
    setupBackToTop();
    setupHomeReveals();
    setupHeroBanners();
    setupStories();
    displayFeaturedProducts().catch(error => showLoadError("featured-products", error));
    displayStorefrontCollections().catch(error => {
        showLoadError("new-products", error);
        showLoadError("limited-products", error);
    });
    displayCategoryRail().catch(error => showLoadError("category-rail", error));
});
