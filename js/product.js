import { addToCart, createProductCard, formatMoney, getCart, getProductById, getProducts, productEnquiryUrl, productImageTag, updateCartCount } from "./app.js";

const productDetail = document.getElementById("product-detail");
const relatedContainer = document.getElementById("related-products");

function categoryName(product) {
    return typeof product.category === "string" ? product.category : product.category?.name || "";
}

function renderNotFound() {
    const section = document.createElement("div");
    section.className = "product-not-found";

    const heading = document.createElement("h1");
    heading.textContent = "Product not found";
    const description = document.createElement("p");
    description.textContent = "Sorry, this product doesn't exist or is no longer available.";
    const back = document.createElement("a");
    back.href = "shop.html";
    back.className = "btn btn-primary";
    back.textContent = "Back to Shop";

    section.append(heading, description, back);
    productDetail.replaceChildren(section);
}

function renderProduct(product) {
    const layout = document.createElement("div");
    layout.className = "product-detail";

    const media = document.createElement("div");
    media.className = "product-detail-image";
    const imageContainer = document.createElement("div");
    imageContainer.className = "product-image";
    imageContainer.appendChild(productImageTag(product));
    media.appendChild(imageContainer);

    if (product.gallery?.length) {
        const gallery = document.createElement("div");
        gallery.className = "product-gallery";
        [product.image, ...product.gallery].filter(Boolean).forEach(path => {
            const image = productImageTag({ image: path, name: product.name });
            gallery.appendChild(image);
        });
        media.appendChild(gallery);
    }

    if (product.videos?.length) {
        const videos = document.createElement("div");
        videos.className = "product-videos";
        product.videos.filter(Boolean).forEach(path => {
            const video = document.createElement("video");
            video.controls = true;
            video.playsInline = true;
            video.preload = "metadata";
            video.setAttribute("aria-label", `${product.name} product video`);
            const source = document.createElement("source");
            source.src = path;
            video.appendChild(source);
            videos.appendChild(video);
        });
        if (videos.childElementCount) media.appendChild(videos);
    }

    const content = document.createElement("div");
    content.className = "product-detail-content";

    const category = document.createElement("p");
    category.className = "eyebrow";
    category.textContent = categoryName(product);

    const name = document.createElement("h1");
    name.textContent = product.name;

    const price = document.createElement("div");
    price.className = "product-detail-price";
    price.textContent = formatMoney(product.price);

    const description = document.createElement("div");
    description.className = "product-description";
    description.textContent = product.description || "Contact us on WhatsApp if you have a question about this product.";

    const inCart = getCart()
        .find(item => item.id === product.id)?.quantity || 0;
    const available = Math.max(0, product.stock - inCart);
    const stock = document.createElement("div");
    stock.className = "stock";
    stock.textContent = available > 0 ? `${available} available` : "Out of stock";

    const quantitySelector = document.createElement("div");
    quantitySelector.className = "quantity-selector";
    const minus = document.createElement("button");
    minus.type = "button";
    minus.setAttribute("aria-label", "Decrease quantity");
    minus.textContent = "−";
    const quantityDisplay = document.createElement("span");
    quantityDisplay.textContent = "1";
    const plus = document.createElement("button");
    plus.type = "button";
    plus.setAttribute("aria-label", "Increase quantity");
    plus.textContent = "+";
    quantitySelector.append(minus, quantityDisplay, plus);

    let quantity = 1;
    minus.addEventListener("click", () => {
        quantity = Math.max(1, quantity - 1);
        quantityDisplay.textContent = String(quantity);
    });
    plus.addEventListener("click", () => {
        if (quantity >= available) return;
        quantity += 1;
        quantityDisplay.textContent = String(quantity);
    });

    const addButton = document.createElement("button");
    addButton.type = "button";
    addButton.className = "btn btn-primary product-add-button";
    addButton.disabled = available <= 0;
    addButton.textContent = available > 0 ? "Add to Cart" : "Out of Stock";
    addButton.addEventListener("click", () => {
        if (addToCart(product.id, quantity)) {
            quantity = 1;
            quantityDisplay.textContent = "1";
            const newAvailable = Math.max(0, product.stock - (getCart()
                .find(item => item.id === product.id)?.quantity || 0));
            stock.textContent = newAvailable > 0 ? `${newAvailable} available` : "Out of stock";
            addButton.disabled = newAvailable <= 0;
            addButton.textContent = newAvailable > 0 ? "Add to Cart" : "Out of Stock";
        }
    });

    const viewCart = document.createElement("a");
    viewCart.href = "cart.html";
    viewCart.className = "btn btn-secondary";
    viewCart.textContent = "View Cart";

    const enquiry = document.createElement("a");
    enquiry.href = productEnquiryUrl(product);
    enquiry.className = "btn btn-secondary";
    enquiry.target = "_blank";
    enquiry.rel = "noopener";
    enquiry.textContent = "Ask about this product on WhatsApp";

    content.append(category, name, price, description, stock, quantitySelector, addButton, viewCart, enquiry);
    layout.append(media, content);
    productDetail.replaceChildren(layout);
}

async function init() {
    const productId = new URLSearchParams(window.location.search).get("id");
    const product = productId ? await getProductById(productId) : null;
    if (!product) {
        renderNotFound();
        return;
    }

    document.title = `${product.name} | Apexmall`;
    renderProduct(product);

    const products = await getProducts();
    const related = products.filter(item =>
        categoryName(item) === categoryName(product) && item.id !== product.id
    ).slice(0, 4);
    relatedContainer.replaceChildren();
    related.forEach(item => relatedContainer.appendChild(createProductCard(item)));
    if (!related.length) {
        const message = document.createElement("p");
        message.className = "loading-note";
        message.textContent = "More products coming soon.";
        relatedContainer.appendChild(message);
    }
    updateCartCount();
}

init().catch(error => {
    console.error("Could not load the product:", error);
    productDetail.textContent = "We couldn't load this product. Please refresh the page to try again.";
});
