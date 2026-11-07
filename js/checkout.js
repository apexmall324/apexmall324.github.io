import { createWhatsAppUrl, formatMoney, getAvailableStock, getCart, getProductsByIds, productImageTag, saveCart, updateCartCount } from "./app.js";

const form = document.getElementById("checkout-form");
const itemsContainer = document.getElementById("checkout-items");
const subtotalElement = document.getElementById("checkout-subtotal");
const message = document.getElementById("checkout-message");
const placeOrderButton = document.getElementById("place-order");
let orderLines = [];
let subtotal = 0;

function showMessage(text, isError = false) {
    message.textContent = text;
    message.style.color = isError ? "crimson" : "";
}

async function loadCheckout() {
    const cart = getCart();
    updateCartCount();

    if (!cart.length) {
        window.location.replace("cart.html");
        return;
    }

    const products = await getProductsByIds(cart.map(item => item.id));
    const productById = new Map(products.map(product => [product.id, product]));
    orderLines = cart
        .filter(item => productById.has(item.id))
        .map(item => {
            const product = productById.get(item.id);
            return { product, quantity: Math.min(item.quantity, getAvailableStock(product)) };
        })
        .filter(item => item.quantity > 0);

    if (JSON.stringify(orderLines.map(line => ({
        id: line.product.id,
        quantity: line.quantity
    }))) !== JSON.stringify(cart)) {
        saveCart(orderLines.map(line => ({ id: line.product.id, quantity: line.quantity })));
    }

    if (!orderLines.length) {
        itemsContainer.textContent = "Your cart has no available products.";
        placeOrderButton.disabled = true;
        return;
    }

    itemsContainer.replaceChildren();
    orderLines.forEach(({ product, quantity }) => {
        const item = document.createElement("div");
        item.className = "checkout-item";
        const image = document.createElement("div");
        image.className = "checkout-item-image";
        image.appendChild(productImageTag(product));

        const details = document.createElement("div");
        details.className = "checkout-item-info";
        const name = document.createElement("strong");
        name.textContent = product.name;
        const count = document.createElement("span");
        count.textContent = product.pairsPerCarton
            ? `Quantity: ${quantity} ${quantity === 1 ? "carton" : "cartons"} (${quantity * product.pairsPerCarton} pairs)`
            : `Quantity: ${quantity}`;
        details.append(name, count);
        if (product.pairsPerCarton) {
            const pairPrice = document.createElement("span");
            pairPrice.className = "pair-price-reference";
            pairPrice.textContent = `Pair price: ${formatMoney(product.pairPrice)} (reference only)`;
            const wholesaleNote = document.createElement("span");
            wholesaleNote.className = "wholesale-note";
            wholesaleNote.textContent = "Wholesale only; full cartons only, no individual pairs.";
            details.append(pairPrice, wholesaleNote);
        }

        const lineTotal = document.createElement("strong");
        lineTotal.textContent = product.pairsPerCarton
            ? `Carton total: ${formatMoney(product.price * quantity)}`
            : formatMoney(product.price * quantity);
        item.append(image, details, lineTotal);
        itemsContainer.appendChild(item);
    });

    subtotal = orderLines.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
    subtotalElement.textContent = formatMoney(subtotal);

    form.addEventListener("submit", event => {
        event.preventDefault();
        const customerName = document.getElementById("customer-name").value.trim();
        const phone = document.getElementById("customer-phone").value.trim();
        const address = document.getElementById("delivery-address").value.trim();
        const enquiry = document.getElementById("order-enquiry").value.trim();

        const lines = orderLines.map(({ product, quantity }) =>
            `- ${quantity}${product.pairsPerCarton
                ? ` ${quantity === 1 ? "carton" : "cartons"} (${quantity * product.pairsPerCarton} pairs; pair price ${formatMoney(product.pairPrice)} is reference only, full cartons only)`
                : ""} x ${product.name} (${formatMoney(product.price * quantity)})`
        );
        const orderMessage = [
            "Hello Apexmall, I would like to place an order:",
            ...(orderLines.some(line => line.product.pairsPerCarton)
                ? ["Footwear is wholesale only and sold by full carton; individual pairs are not sold."]
                : []),
            "",
            ...lines,
            "",
            `Estimated subtotal: ${formatMoney(subtotal)}`,
            `Name: ${customerName}`,
            `Phone: ${phone}`,
            `Delivery area/address: ${address}`,
            ...(enquiry ? [`Question or request: ${enquiry}`] : []),
            "",
            "Please confirm availability, delivery fee, and the final total."
        ].join("\n");

        showMessage("Opening WhatsApp with your order details...");
        placeOrderButton.disabled = true;
        window.location.href = createWhatsAppUrl(orderMessage);
    });
}

loadCheckout().catch(error => {
    console.error("Could not load checkout:", error);
    showMessage("We couldn't load your cart. Please return to your cart and try again.", true);
    placeOrderButton.disabled = true;
});
