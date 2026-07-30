/* Управление корзиной через localStorage. Не зависит от конкретной страницы. */

const CART_STORAGE_KEY = "deco_kg_cart_v1";

const Cart = {
  getRaw() {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  },

  saveRaw(cart) {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  },

  add(productId, qty = 1) {
    const cart = this.getRaw();
    const id = String(productId);
    cart[id] = (cart[id] || 0) + qty;
    this.saveRaw(cart);
    this.updateBadge();
  },

  setQty(productId, qty) {
    const cart = this.getRaw();
    const id = String(productId);
    if (qty <= 0) {
      delete cart[id];
    } else {
      cart[id] = qty;
    }
    this.saveRaw(cart);
    this.updateBadge();
  },

  remove(productId) {
    this.setQty(productId, 0);
  },

  getItems() {
    const cart = this.getRaw();
    return Object.keys(cart)
      .map((id) => {
        const product = getProductById(id);
        if (!product) return null;
        const qty = cart[id];
        return { product, qty, subtotal: product.price * qty };
      })
      .filter(Boolean);
  },

  getCount() {
    const cart = this.getRaw();
    return Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  },

  getTotal() {
    return this.getItems().reduce((sum, item) => sum + item.subtotal, 0);
  },

  getTotalsByCurrency() {
    const totals = {};
    this.getItems().forEach((item) => {
      const cur = item.product.currency || "KGS";
      totals[cur] = (totals[cur] || 0) + item.subtotal;
    });
    return totals;
  },

  clear() {
    this.saveRaw({});
    this.updateBadge();
  },

  updateBadge() {
    const count = this.getCount();
    document.querySelectorAll(".cart-badge").forEach((el) => {
      el.textContent = count;
      el.classList.toggle("is-empty", count === 0);
    });
  }
};

document.addEventListener("DOMContentLoaded", () => Cart.updateBadge());
