import { addToCart, createProductCard, formatMoney, getAvailableStock, getCart, getProductById, getProducts, productEnquiryUrl, productImageTag, shuffleProducts, updateCartCount } from "./app.js";

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
    const imagePaths = [...new Set([product.image, ...(product.gallery || [])].filter(Boolean))];
    let activeImageIndex = 0;
    const mainImage = productImageTag({
        ...product,
        image: imagePaths[activeImageIndex]
    });
    imageContainer.appendChild(mainImage);

    const imageControls = document.createElement("div");
    imageControls.className = "product-image-controls";
    imageControls.setAttribute("aria-label", "Product image controls");

    const previousImage = document.createElement("button");
    previousImage.type = "button";
    previousImage.className = "product-image-arrow";
    previousImage.setAttribute("aria-label", "Previous product image");
    previousImage.textContent = "‹";

    const nextImage = document.createElement("button");
    nextImage.type = "button";
    nextImage.className = "product-image-arrow";
    nextImage.setAttribute("aria-label", "Next product image");
    nextImage.textContent = "›";

    const imageIndicator = document.createElement("span");
    imageIndicator.className = "product-image-indicator";
    imageIndicator.setAttribute("aria-live", "polite");

    function showImage(index) {
        activeImageIndex = (index + imagePaths.length) % imagePaths.length;
        mainImage.src = imagePaths[activeImageIndex];
        mainImage.alt = `${product.name}, image ${activeImageIndex + 1} of ${imagePaths.length}`;
        imageIndicator.textContent = `${activeImageIndex + 1} / ${imagePaths.length}`;
        gallery.querySelectorAll(".product-gallery-thumb").forEach((button, buttonIndex) => {
            button.setAttribute("aria-pressed", String(buttonIndex === activeImageIndex));
        });
    }

    previousImage.addEventListener("click", () => showImage(activeImageIndex - 1));
    nextImage.addEventListener("click", () => showImage(activeImageIndex + 1));
    imageControls.append(previousImage, imageIndicator, nextImage);
    if (imagePaths.length > 1) {
        imageContainer.appendChild(imageControls);
    }
    media.appendChild(imageContainer);

    let gallery = null;
    if (imagePaths.length > 1) {
        gallery = document.createElement("div");
        gallery.className = "product-gallery";
        imagePaths.forEach((path, index) => {
            const thumbnail = document.createElement("button");
            thumbnail.type = "button";
            thumbnail.className = "product-gallery-thumb";
            thumbnail.setAttribute("aria-label", `Show product image ${index + 1}`);
            thumbnail.setAttribute("aria-pressed", String(index === activeImageIndex));
            const image = productImageTag({ image: path, name: `${product.name}, image ${index + 1}` });
            thumbnail.appendChild(image);
            thumbnail.addEventListener("click", () => showImage(index));
            gallery.appendChild(thumbnail);
        });
        media.appendChild(gallery);
        showImage(activeImageIndex);

        let pointerStart = null;
        imageContainer.addEventListener("pointerdown", event => {
            if (event.pointerType !== "touch") return;
            pointerStart = { id: event.pointerId, x: event.clientX, y: event.clientY };
        });
        window.addEventListener("pointerup", event => {
            if (!pointerStart || event.pointerType !== "touch" || pointerStart.id !== event.pointerId) return;
            const deltaX = event.clientX - pointerStart.x;
            const deltaY = event.clientY - pointerStart.y;
            pointerStart = null;
            if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY)) {
                showImage(activeImageIndex + (deltaX < 0 ? 1 : -1));
            }
        });
        window.addEventListener("pointercancel", () => {
            pointerStart = null;
        });
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
    price.textContent = product.pairsPerCarton
        ? `Carton price: ${formatMoney(product.price)}`
        : formatMoney(product.price);

    const pairPrice = product.pairsPerCarton
        ? document.createElement("p")
        : null;
    if (pairPrice) {
        pairPrice.className = "pair-price-reference";
        pairPrice.textContent = `Pair price: ${formatMoney(product.pairPrice)} (reference only; pairs are not sold individually)`;
    }

    const wholesaleNote = product.pairsPerCarton
        ? document.createElement("p")
        : null;
    if (wholesaleNote) {
        wholesaleNote.className = "wholesale-note";
        wholesaleNote.textContent = "Wholesale only. Add to cart and order by full carton; the carton price is charged.";
    }

    const description = document.createElement("div");
    description.className = "product-description";
    description.textContent = product.description || "Contact us on WhatsApp if you have a question about this product.";

    const inCart = getCart()
        .find(item => item.id === product.id)?.quantity || 0;
    const available = getAvailableStock(product, inCart);
    const stock = document.createElement("div");
    stock.className = "stock";
    stock.textContent = available > 0 ? `${available} available` : "Out of stock";

    const quantitySelector = document.createElement("div");
    quantitySelector.className = "quantity-selector";
    if (product.pairsPerCarton) {
        const quantityLabel = document.createElement("span");
        quantityLabel.className = "quantity-unit";
        quantityLabel.textContent = "Cartons";
        quantitySelector.appendChild(quantityLabel);
    }
    const minus = document.createElement("button");
    minus.type = "button";
    minus.setAttribute("aria-label", `Decrease ${product.pairsPerCarton ? "carton" : "quantity"}`);
    minus.textContent = "−";
    const quantityDisplay = document.createElement("span");
    quantityDisplay.textContent = "1";
    const plus = document.createElement("button");
    plus.type = "button";
    plus.setAttribute("aria-label", `Increase ${product.pairsPerCarton ? "carton" : "quantity"}`);
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
    addButton.textContent = available > 0
        ? product.pairsPerCarton ? "Add Carton to Cart" : "Add to Cart"
        : "Out of Stock";
    addButton.addEventListener("click", () => {
        if (addToCart(product.id, quantity)) {
            quantity = 1;
            quantityDisplay.textContent = "1";
            const newAvailable = getAvailableStock(product, getCart()
                .find(item => item.id === product.id)?.quantity || 0);
            stock.textContent = newAvailable > 0 ? `${newAvailable} available` : "Out of stock";
            addButton.disabled = newAvailable <= 0;
            addButton.textContent = newAvailable > 0
                ? product.pairsPerCarton ? "Add Carton to Cart" : "Add to Cart"
                : "Out of Stock";
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

    const productDetails = [];
    if (product.sizeRange) {
        productDetails.push(`Sizes: ${product.sizeRange}`);
    }
    if (product.pairsPerCarton) {
        productDetails.push(`Pairs per carton: ${product.pairsPerCarton}`);
    }
    const detailElements = productDetails.map(text => {
        const detail = document.createElement("p");
        detail.className = "product-description";
        detail.textContent = text;
        return detail;
    });

    content.append(
        category,
        name,
        price,
        ...(pairPrice ? [pairPrice] : []),
        ...(wholesaleNote ? [wholesaleNote] : []),
        ...(!product.pairsPerCarton ? [description] : []),
        ...(Number.isFinite(product.stock) ? [stock] : []),
        ...detailElements,
        quantitySelector,
        addButton,
        viewCart,
        enquiry
    );
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
    const related = shuffleProducts(products.filter(item =>
        categoryName(item) === categoryName(product) && item.id !== product.id
    )).slice(0, 4);
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
