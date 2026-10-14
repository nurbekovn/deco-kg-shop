/* Избранное через localStorage. Не зависит от конкретной страницы. */

const WISHLIST_STORAGE_KEY = "deco_kg_wishlist_v1";

const Wishlist = {
  getIds() {
    try {
      const raw = localStorage.getItem(WISHLIST_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  },

  save(ids) {
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(ids));
  },

  has(productId) {
    return this.getIds().includes(String(productId));
  },

  toggle(productId) {
    const id = String(productId);
    let ids = this.getIds();
    const willAdd = !ids.includes(id);
    ids = willAdd ? [...ids, id] : ids.filter((x) => x !== id);
    this.save(ids);
    this.updateBadge();
    return willAdd;
  },

  getItems() {
    return this.getIds()
      .map((id) => getProductById(id))
      .filter(Boolean);
  },

  updateBadge() {
    const count = this.getIds().length;
    document.querySelectorAll(".wishlist-badge").forEach((el) => {
      el.textContent = count;
      el.classList.toggle("is-empty", count === 0);
    });
  }
};

document.addEventListener("DOMContentLoaded", () => Wishlist.updateBadge());
