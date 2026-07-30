/* Логика страницы каталога: сайдбар категорий, поиск, сортировка */

function getCatalogState() {
  const params = new URLSearchParams(window.location.search);
  return {
    category: params.get("category") || "",
    q: (params.get("q") || "").trim().toLowerCase(),
    sort: params.get("sort") || ""
  };
}

function updateCatalogURL(state) {
  const params = new URLSearchParams();
  if (state.category) params.set("category", state.category);
  if (state.q) params.set("q", state.q);
  if (state.sort) params.set("sort", state.sort);
  const query = params.toString();
  history.replaceState(null, "", "catalog.html" + (query ? "?" + query : ""));
}

function renderSidebar(state) {
  const sidebar = document.getElementById("catalog-sidebar");
  if (!sidebar) return;
  const allCount = PRODUCTS.length;
  const items = CATEGORIES.map((c) => {
    const count = PRODUCTS.filter((p) => p.categoryId === c.id).length;
    return `<li>
      <a href="#" data-category="${c.id}" class="${state.category === c.id ? "is-active" : ""}">
        <span class="cat-icon">${c.icon}</span>${c.name} <span class="cat-count">${count}</span>
      </a>
    </li>`;
  }).join("");
  sidebar.innerHTML = `
    <li><a href="#" data-category="" class="${state.category === "" ? "is-active" : ""}">Все категории <span class="cat-count">${allCount}</span></a></li>
    ${items}
  `;
}

function filterAndSortProducts(state) {
  let items = PRODUCTS.slice();
  if (state.category) {
    items = items.filter((p) => p.categoryId === state.category);
  }
  if (state.q) {
    items = items.filter((p) => p.name.toLowerCase().includes(state.q));
  }
  if (state.sort === "price-asc") {
    items.sort((a, b) => a.price - b.price);
  } else if (state.sort === "price-desc") {
    items.sort((a, b) => b.price - a.price);
  }
  return items;
}

function renderCatalogGrid(state) {
  const grid = document.getElementById("catalog-grid");
  const title = document.getElementById("catalog-title");
  const empty = document.getElementById("catalog-empty");
  if (!grid) return;

  const items = filterAndSortProducts(state);

  if (title) {
    const cat = getCategoryById(state.category);
    title.textContent = state.q
      ? `Результаты поиска: «${state.q}»`
      : cat
      ? cat.name
      : "Все товары";
  }

  grid.innerHTML = items.map(renderProductCard).join("");
  if (empty) empty.style.display = items.length === 0 ? "block" : "none";
}

function initCatalogControls(state) {
  const searchInput = document.getElementById("catalog-search");
  const sortSelect = document.getElementById("catalog-sort");
  const sidebar = document.getElementById("catalog-sidebar");

  if (searchInput) {
    searchInput.value = state.q;
    searchInput.addEventListener("input", () => {
      state.q = searchInput.value.trim().toLowerCase();
      updateCatalogURL(state);
      renderCatalogGrid(state);
    });
  }

  if (sortSelect) {
    sortSelect.value = state.sort;
    sortSelect.addEventListener("change", () => {
      state.sort = sortSelect.value;
      updateCatalogURL(state);
      renderCatalogGrid(state);
    });
  }

  if (sidebar) {
    sidebar.addEventListener("click", (e) => {
      const link = e.target.closest("a[data-category]");
      if (!link) return;
      e.preventDefault();
      state.category = link.dataset.category;
      updateCatalogURL(state);
      renderSidebar(state);
      renderCatalogGrid(state);
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  if (!document.getElementById("catalog-grid")) return;
  const state = getCatalogState();
  renderSidebar(state);
  renderCatalogGrid(state);
  initCatalogControls(state);
});
