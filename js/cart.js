import { formatMoney, getAvailableStock, getCart, getProductById, getProductsByIds, productImageTag, saveCart, updateCartCount } from "./app.js";

const container = document.getElementById("cart-container");

function textElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    element.textContent = text;
    return element;
}

function renderEmptyCart(message = "You haven't added anything to your cart yet.") {
    const empty = document.createElement("div");
    empty.className = "empty-cart";
    empty.append(
        textElement("div", "empty-cart-icon", "🛒"),
        textElement("h2", "", "Your cart is empty"),
        textElement("p", "", message)
    );
    const shopLink = textElement("a", "btn btn-primary", "Start Shopping");
    shopLink.href = "shop.html";
    empty.appendChild(shopLink);
    container.replaceChildren(empty);
}

function renderCartItem(product, quantity) {
    const item = document.createElement("article");
    item.className = "cart-item";
    item.dataset.id = product.id;

    const imageContainer = document.createElement("div");
    imageContainer.className = "cart-item-image";
    const productLink = document.createElement("a");
    productLink.href = `product.html?id=${encodeURIComponent(product.id)}`;
    productLink.appendChild(productImageTag(product));
    imageContainer.appendChild(productLink);

    const details = document.createElement("div");
    details.className = "cart-item-info";
    details.append(
        textElement("p", "product-category", typeof product.category === "string" ? product.category : product.category?.name || ""),
        textElement("h3", "", product.name),
        textElement("p", "", product.pairsPerCarton
            ? `Carton price: ${formatMoney(product.price)}`
            : formatMoney(product.price))
    );
    if (product.pairsPerCarton) {
        details.append(
            textElement("p", "pair-price-reference", `Pair price: ${formatMoney(product.pairPrice)} (reference only)`),
            textElement("p", "wholesale-note", "Wholesale only. Sold by full carton; pairs are not sold individually.")
        );
    }

    const quantityControls = document.createElement("div");
    quantityControls.className = "cart-quantity";
    const decrease = textElement("button", "quantity-minus", "−");
    decrease.type = "button";
    decrease.dataset.id = product.id;
    decrease.setAttribute("aria-label", `Remove one ${product.pairsPerCarton ? "carton of " : ""}${product.name}`);
    const count = textElement("span", "", product.pairsPerCarton
        ? `${quantity} ${quantity === 1 ? "carton" : "cartons"} (${quantity * product.pairsPerCarton} pairs)`
        : String(quantity));
    const increase = textElement("button", "quantity-plus", "+");
    increase.type = "button";
    increase.dataset.id = product.id;
    increase.disabled = quantity >= getAvailableStock(product);
    increase.setAttribute("aria-label", `Add one ${product.pairsPerCarton ? "carton of " : ""}${product.name}`);
    quantityControls.append(decrease, count, increase);

    const total = textElement("div", "cart-item-total", product.pairsPerCarton
        ? `Carton total: ${formatMoney(product.price * quantity)}`
        : formatMoney(product.price * quantity));
    const remove = textElement("button", "remove-item", "Remove");
    remove.type = "button";
    remove.dataset.id = product.id;

    item.append(imageContainer, details, quantityControls, total, remove);
    return item;
}

async function displayCart() {
    updateCartCount();
    const cart = getCart();

    if (!cart.length) {
        renderEmptyCart();
        return;
    }

    container.innerHTML = '<p class="loading-note">Loading your cart…</p>';
    const products = await getProductsByIds(cart.map(item => item.id));
    const productById = new Map(products.map(product => [product.id, product]));
    const availableCart = cart
        .filter(item => productById.has(item.id))
        .map(item => {
            const product = productById.get(item.id);
            return { id: item.id, quantity: Math.min(item.quantity, getAvailableStock(product)) };
        })
        .filter(item => item.quantity > 0);

    if (JSON.stringify(availableCart) !== JSON.stringify(cart)) saveCart(availableCart);
    if (!availableCart.length) {
        renderEmptyCart("Items in your previous cart are no longer available.");
        return;
    }

    const subtotal = availableCart.reduce((sum, item) => {
        return sum + productById.get(item.id).price * item.quantity;
    }, 0);

    const layout = document.createElement("div");
    layout.className = "cart-layout";
    const items = document.createElement("div");
    items.className = "cart-items";
    availableCart.forEach(item => items.appendChild(renderCartItem(productById.get(item.id), item.quantity)));

    const summary = document.createElement("aside");
    summary.className = "cart-summary";
    summary.appendChild(textElement("h2", "", "Summary"));

    const subtotalRow = document.createElement("div");
    subtotalRow.className = "summary-row";
    subtotalRow.append(textElement("span", "", "Subtotal"), textElement("strong", "", formatMoney(subtotal)));

    const deliveryRow = document.createElement("div");
    deliveryRow.className = "summary-row";
    deliveryRow.append(textElement("span", "", "Delivery"), textElement("span", "", "Confirmed on WhatsApp"));

    const divider = document.createElement("div");
    divider.className = "summary-divider";

    const totalRow = document.createElement("div");
    totalRow.className = "summary-row total";
    totalRow.append(textElement("span", "", "Estimated subtotal"), textElement("strong", "", formatMoney(subtotal)));

    const checkout = textElement("a", "btn btn-primary checkout-button", "Continue to Checkout");
    checkout.href = "checkout.html";
    const continueLink = textElement("a", "continue-shopping", "← Continue Shopping");
    continueLink.href = "shop.html";
    summary.append(subtotalRow, deliveryRow, divider, totalRow, checkout, continueLink);
    layout.append(items, summary);
    container.replaceChildren(layout);

    container.querySelectorAll(".quantity-plus").forEach(button => {
        button.addEventListener("click", () => changeQuantity(button.dataset.id, 1));
    });
    container.querySelectorAll(".quantity-minus").forEach(button => {
        button.addEventListener("click", () => changeQuantity(button.dataset.id, -1));
    });
    container.querySelectorAll(".remove-item").forEach(button => {
        button.addEventListener("click", () => removeItem(button.dataset.id));
    });
}

async function changeQuantity(productId, amount) {
    const cart = getCart();
    const item = cart.find(entry => entry.id === productId);
    if (!item) return;

    try {
        const product = await getProductById(productId);
        if (!product) {
            removeItem(productId);
            return;
        }

        const quantity = item.quantity + amount;
        if (Number.isFinite(product.stock) && quantity > product.stock) return;

        if (quantity <= 0) {
            cart.splice(cart.indexOf(item), 1);
        } else {
            item.quantity = quantity;
        }

        saveCart(cart);
        await displayCart();
    } catch (error) {
        showCartError(error);
    }
}

function removeItem(productId) {
    saveCart(getCart().filter(item => item.id !== productId));
    displayCart().catch(showCartError);
}

function showCartError(error) {
    console.error("Could not update the cart:", error);
    container.textContent = "We couldn't update your cart. Please refresh the page to try again.";
}

displayCart().catch(showCartError);
