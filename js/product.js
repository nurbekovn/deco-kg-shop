/* Логика страницы товара */

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("product-page");
  if (!container) return;

  const params = new URLSearchParams(window.location.search);
  const product = getProductById(params.get("id"));

  if (!product) {
    container.innerHTML = `
      <div class="not-found">
        <h1>Товар не найден</h1>
        <p>Возможно, товар был удалён или ссылка неверна.</p>
        <a class="btn btn-primary" href="catalog.html">Вернуться в каталог</a>
      </div>`;
    return;
  }

  document.title = `${product.name} — Deco_kg`;
  const category = getCategoryById(product.categoryId);
  const priceHTML = product.oldPrice
    ? `<span class="price-old">${formatPrice(product.oldPrice, product.currency)}</span> <span class="price price-large">${formatPrice(product.price, product.currency)}</span>`
    : `<span class="price price-large">${formatPrice(product.price, product.currency)}</span>`;

  container.innerHTML = `
    <nav class="breadcrumbs">
      <a href="index.html">Главная</a> /
      <a href="catalog.html?category=${product.categoryId}">${category ? category.name : "Каталог"}</a> /
      <span>${product.name}</span>
    </nav>
    <div class="product-detail">
      <div class="product-detail-thumb">${productThumbHTML(product)}</div>
      <div class="product-detail-info">
        <h1>${product.name}</h1>
        <div class="product-price">${priceHTML}<span class="unit">/ ${product.unit}</span></div>
        <div class="qty-control">
          <button type="button" id="qty-minus" class="qty-btn">−</button>
          <input type="number" id="product-qty" value="1" min="1">
          <button type="button" id="qty-plus" class="qty-btn">+</button>
        </div>
        <button class="btn btn-primary btn-add-cart btn-large" data-id="${product.id}" data-use-qty-input="true">В корзину</button>
        <p class="product-description">Качественный товар для строительства и ремонта. Доступен к заказу с доставкой по Бишкеку.</p>
      </div>
    </div>
    <section class="related-section">
      <h2>Похожие товары</h2>
      <div class="product-grid" id="related-grid"></div>
    </section>
  `;

  const qtyInput = document.getElementById("product-qty");
  document.getElementById("qty-minus").addEventListener("click", () => {
    qtyInput.value = Math.max(1, Number(qtyInput.value) - 1);
  });
  document.getElementById("qty-plus").addEventListener("click", () => {
    qtyInput.value = Number(qtyInput.value) + 1;
  });

  const related = PRODUCTS.filter((p) => p.categoryId === product.categoryId && p.id !== product.id).slice(0, 4);
  document.getElementById("related-grid").innerHTML = related.map(renderProductCard).join("");
});
