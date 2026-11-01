# Apexmall

A static storefront built with HTML, CSS, and JavaScript. The product catalog is local, the cart is saved in the visitor's browser, and order requests and product enquiries are sent through WhatsApp. This project does not use a customer account, admin dashboard, or backend service.

## Add products, images, and videos

Put product photos and video files in the root [product](./product/) folder, then add product records to the `PRODUCTS` array in [js/app.js](./js/app.js). Media paths are relative to the project root. Videos should be MP4 or WebM files; for large videos, use a video host and provide a direct link to the video file.

Add another product object inside the existing array (keep its surrounding `export const PRODUCTS = [ ... ];`):

```js
{
    id: "sample-item",
    name: "Sample item",
    category: { id: "accessories", name: "Accessories", image: "product/accessories.jpg" },
    price: 45,
    stock: 8,
    description: "A short product description.",
    image: "product/sample-item.jpg",
    gallery: [],
    videos: ["product/sample-item-video.mp4"],
    is_featured: true,
    created_at: "2026-10-31"
},
```

Use a unique `id`, a numeric `price` and `stock`, and an image path beginning with `product/`. Set `category.image` to the image you want shown on the home-page category tile; products in the same category share that image, so set it consistently. Add extra images to `gallery` and videos to `videos`; both are optional arrays, so use `[]` when you have none. Videos appear with playback controls on the product page. If a product image is unavailable, the storefront shows `product/placeholder.svg`. Product order and enquiry messages use the WhatsApp number configured in `js/app.js`.

## Homepage banners

The homepage banner carousel and its text, images, and links are configured in the `BANNERS` array in [js/app.js](./js/app.js). Upload banner images to `product/` and set each banner's `image`, `alt`, `eyebrow`, `title`, `description`, `ctaLabel`, and `ctaHref`. Add more objects to create more slides. The banner pauses while a visitor hovers over it or uses its controls, and it does not auto-rotate when reduced motion is enabled.

## Customer review and dispatch stories

The homepage Stories row is configured in the `STORIES` array in [js/app.js](./js/app.js). Add a story object with a `label`, `type`, `headline`, and `text`; set `image` to a photo path or an array of photo paths for multiple tap-through slides, with `alt` text describing them. Put story photos in `product/`. Stories are manually maintained static content: they do not expire automatically, accept customer uploads, or update without publishing the site again. Get permission before publishing customer messages or identifiable information.

## Orders and enquiries

Customers add items and quantities to their browser cart, then submit their name, phone number, delivery area, and any optional note. The site opens WhatsApp with a prefilled message; the customer must send it to contact Apexmall. Availability, delivery charges, and final prices are confirmed in the chat. The site does not store or submit orders to a server.

Product cards and product pages also include a WhatsApp enquiry link.

## Run locally

Serve this folder over HTTP with XAMPP, for example `http://localhost/ApexMall2ndOri/`. The storefront uses JavaScript modules, so opening the files directly with `file://` may not work correctly.

## Deploy

The GitHub Actions workflow in `.github/workflows/pages.yml` publishes the static storefront to GitHub Pages when changes are pushed to `main` or `master`.

## Existing cloud account

Removing the Appwrite integration from this project does not delete a remote Appwrite project or account. If you want that cloud account and its data deleted, do so in the Appwrite Console; this local codebase has no project credentials or access to perform remote deletion.
