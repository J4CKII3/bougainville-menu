# Bougainville menu

The site is a static 3D menu with no build step or runtime packages. Keep the menu page list in
[`menu-pages.js`](./menu-pages.js); the cover links and page navigation are
generated from that list.

## Add or replace a menu page

1. Put a JPG, PNG, or WebP page image in `menu-assets/`.
2. Add an entry to `pages` in `menu-pages.js` with a unique lowercase `id`, a
   visitor-facing `title`, and the image filename.
3. Open `bg.html` and check the new cover link and page in the book.

The six current images are rendered from `menu-bougainville.pdf`. If you replace
the source menu, update the PDF and its page images together. The cover page
numbers and navigation update automatically when the page list changes.

Open `bg.html` locally or host the folder as a static site. Keep `menu.css`,
`menu.js`, `menu-pages.js`, `menu-assets/`, the welcome photos, and the original
PDF beside the HTML file.
