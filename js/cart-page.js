/* Логика страницы корзины */

const STORE_WHATSAPP_NUMBER = "996705230401"; // без "+" и пробелов, формат для wa.me

function renderCartPage() {
  const list = document.getElementById("cart-list");
  const emptyState = document.getElementById("cart-empty");
  const summary = document.getElementById("cart-summary");
  if (!list) return;

  const items = Cart.getItems();

  if (items.length === 0) {
    list.innerHTML = "";
    if (emptyState) emptyState.style.display = "block";
    if (summary) summary.style.display = "none";
    return;
  }

  if (emptyState) emptyState.style.display = "none";
  if (summary) summary.style.display = "block";

  list.innerHTML = items
    .map(
      (item) => `
    <div class="cart-row" data-id="${item.product.id}">
      <div class="cart-row-thumb">${productThumbHTML(item.product)}</div>
      <div class="cart-row-info">
        <a href="product.html?id=${item.product.id}">${item.product.name}</a>
        <div class="cart-row-price">${formatPrice(item.product.price, item.product.currency)} / ${item.product.unit}</div>
      </div>
      <div class="qty-control">
        <button type="button" class="qty-btn cart-qty-minus">−</button>
        <input type="number" class="cart-qty-input" value="${item.qty}" min="1">
        <button type="button" class="qty-btn cart-qty-plus">+</button>
      </div>
      <div class="cart-row-subtotal">${formatPrice(item.subtotal, item.product.currency)}</div>
      <button type="button" class="cart-row-remove" title="Удалить">✕</button>
    </div>`
    )
    .join("");

  const totalEl = document.getElementById("cart-total");
  if (totalEl) {
    const totals = Cart.getTotalsByCurrency();
    totalEl.textContent = Object.keys(totals)
      .map((cur) => formatPrice(totals[cur], cur))
      .join(" + ");
  }
}

function buildWhatsappOrderText() {
  const items = Cart.getItems();
  const lines = items.map(
    (item, i) => `${i + 1}. ${item.product.name} — ${item.qty} ${item.product.unit} x ${formatPrice(item.product.price, item.product.currency)} = ${formatPrice(item.subtotal, item.product.currency)}`
  );
  const totals = Cart.getTotalsByCurrency();
  const totalLine = Object.keys(totals)
    .map((cur) => formatPrice(totals[cur], cur))
    .join(" + ");
  lines.push("", `Итого: ${totalLine}`);
  return `Здравствуйте! Хочу оформить заказ:\n\n${lines.join("\n")}`;
}

document.addEventListener("DOMContentLoaded", () => {
  const list = document.getElementById("cart-list");
  if (!list) return;

  renderCartPage();

  list.addEventListener("click", (e) => {
    const row = e.target.closest(".cart-row");
    if (!row) return;
    const id = row.dataset.id;

    if (e.target.closest(".cart-row-remove")) {
      Cart.remove(id);
      renderCartPage();
      return;
    }

    if (e.target.closest(".cart-qty-minus") || e.target.closest(".cart-qty-plus")) {
      const input = row.querySelector(".cart-qty-input");
      let qty = Number(input.value) || 1;
      qty = e.target.closest(".cart-qty-plus") ? qty + 1 : qty - 1;
      if (qty <= 0) {
        Cart.remove(id);
      } else {
        Cart.setQty(id, qty);
      }
      renderCartPage();
    }
  });

  list.addEventListener("change", (e) => {
    const row = e.target.closest(".cart-row");
    if (!row || !e.target.classList.contains("cart-qty-input")) return;
    const qty = Math.max(1, Number(e.target.value) || 1);
    Cart.setQty(row.dataset.id, qty);
    renderCartPage();
  });

  document.getElementById("checkout-btn")?.addEventListener("click", () => {
    const text = encodeURIComponent(buildWhatsappOrderText());
    window.open(`https://wa.me/${STORE_WHATSAPP_NUMBER}?text=${text}`, "_blank");
  });
});
