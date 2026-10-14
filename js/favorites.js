/* Логика страницы избранного */

function renderFavoritesPage() {
  const grid = document.getElementById("favorites-grid");
  const empty = document.getElementById("favorites-empty");
  if (!grid) return;

  const items = Wishlist.getItems();
  grid.innerHTML = items.map(renderProductCard).join("");
  if (empty) empty.style.display = items.length === 0 ? "block" : "none";
}

document.addEventListener("DOMContentLoaded", () => {
  if (!document.getElementById("favorites-grid")) return;
  renderFavoritesPage();

  document.getElementById("favorites-grid").addEventListener("click", (e) => {
    if (e.target.closest(".btn-wishlist")) {
      setTimeout(renderFavoritesPage, 0);
    }
  });
});
