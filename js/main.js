/* Общая логика шапки/футера и главной страницы */

/* Названия отделов повторяются у разных брендов — показываем бренд рядом */
function categoryBrand(categoryId) {
  return String(categoryId).split("-")[0];
}

function renderCategoryNav() {
  const list = document.getElementById("category-nav-list");
  if (!list) return;
  const params = new URLSearchParams(window.location.search);
  const activeCategory = params.get("category");
  list.innerHTML = CATEGORIES.map(
    (c) => `<li>
      <a href="catalog.html?category=${c.id}" class="${c.id === activeCategory ? "is-active" : ""}">
        <span class="cat-icon">${c.icon}</span>${c.name}
        <span class="cat-brand">${categoryBrand(c.id)}</span>
      </a>
    </li>`
  ).join("");
}

function initBurgerMenu() {
  const burger = document.querySelector(".burger");
  const nav = document.querySelector(".category-nav");
  if (!burger || !nav) return;
  burger.addEventListener("click", () => {
    nav.classList.toggle("is-open");
    burger.classList.toggle("is-active");
  });
}

/* Делегирование клика по кнопкам "В корзину" на любой странице */
function initAddToCartDelegation() {
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".btn-add-cart");
    if (!btn) return;
    const id = btn.dataset.id;
    const qtyInput = document.getElementById("product-qty");
    const qty = btn.dataset.useQtyInput && qtyInput ? Number(qtyInput.value) || 1 : 1;
    Cart.add(id, qty);
    const originalText = btn.textContent;
    btn.textContent = "Добавлено ✓";
    btn.classList.add("btn-added");
    setTimeout(() => {
      btn.textContent = originalText;
      btn.classList.remove("btn-added");
    }, 1200);
    const product = typeof getProductById === "function" ? getProductById(id) : null;
    if (typeof Toast !== "undefined") {
      Toast.show(product ? `«${product.name}» добавлен в корзину` : "Товар добавлен в корзину", "success");
    }
  });
}

/* Делегирование клика по кнопкам "В избранное" на любой странице */
function initWishlistDelegation() {
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".btn-wishlist");
    if (!btn) return;
    e.preventDefault();
    const id = btn.dataset.id;
    const added = Wishlist.toggle(id);
    document.querySelectorAll(`.btn-wishlist[data-id="${id}"]`).forEach((el) => {
      el.classList.toggle("is-active", added);
      el.textContent = added ? "♥" : "♡";
    });
    if (typeof Toast !== "undefined") {
      Toast.show(added ? "Добавлено в избранное" : "Удалено из избранного", "info");
    }
  });
}

/* Переключатель тёмной темы */
const THEME_STORAGE_KEY = "deco_kg_theme";

function initThemeToggle() {
  const toggle = document.querySelector(".theme-toggle");
  const apply = (theme) => {
    document.documentElement.setAttribute("data-theme", theme);
    if (toggle) toggle.textContent = theme === "dark" ? "☀️" : "🌙";
  };
  apply(document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light");
  if (!toggle) return;
  toggle.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
    const next = current === "dark" ? "light" : "dark";
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch (e) {}
    apply(next);
  });
}

/* Кнопка "наверх", появляется после прокрутки */
function initBackToTop() {
  const btn = document.createElement("button");
  btn.className = "back-to-top";
  btn.setAttribute("aria-label", "Наверх страницы");
  btn.textContent = "↑";
  document.body.appendChild(btn);
  window.addEventListener("scroll", () => {
    btn.classList.toggle("is-visible", window.scrollY > 500);
  });
  btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
}

/* ---- Главная страница ---- */

function renderCategoryGrid() {
  const grid = document.getElementById("category-grid");
  if (!grid) return;

  const withCounts = CATEGORIES.map((c) => {
    const items = PRODUCTS.filter((p) => p.categoryId === c.id);
    const withImage = items.find((p) => p.image);
    return { ...c, count: items.length, thumb: withImage ? withImage.image : null };
  }).filter((c) => c.count > 0);

  const top = withCounts.sort((a, b) => b.count - a.count).slice(0, 16);

  const cards = top.map((c) => {
    const colors = categoryColors(c.id);
    const thumb = c.thumb
      ? `<img src="${c.thumb}" alt="${c.name}" loading="lazy">`
      : `<span style="color:${colors.fg}">${c.icon}</span>`;
    return `<a class="tile" href="catalog.html?category=${c.id}">
      <span class="tile-img" style="background:${colors.bg}">${thumb}</span>
      <span class="tile-name">${c.name}<br><span class="tile-count">${categoryBrand(c.id)} · ${c.count} товаров</span></span>
    </a>`;
  });

  cards.push(`<a class="tile" href="catalog.html">
    <span class="tile-img" style="background:var(--bg-alt)"><span>➔</span></span>
    <span class="tile-name">Все категории</span>
  </a>`);

  grid.innerHTML = cards.join("");
}

/* Стрелки горизонтальной прокрутки плиток */
function initTileScroll() {
  document.querySelectorAll(".tile-row").forEach((row) => {
    const scroll = row.querySelector(".tile-scroll");
    if (!scroll) return;
    const step = () => Math.max(scroll.clientWidth * 0.8, 200);
    row.querySelector(".tile-prev")?.addEventListener("click", () => {
      scroll.scrollBy({ left: -step(), behavior: "smooth" });
    });
    row.querySelector(".tile-next")?.addEventListener("click", () => {
      scroll.scrollBy({ left: step(), behavior: "smooth" });
    });
  });
}

function renderBestsellers() {
  const grid = document.getElementById("bestsellers-grid");
  if (!grid) return;
  let items = PRODUCTS.filter((p) => p.bestseller);
  /* в новом каталоге хиты не размечены — показываем товары с фото из разных категорий */
  if (!items.length) {
    const seen = new Set();
    items = PRODUCTS.filter((p) => {
      if (!p.image || seen.has(p.categoryId)) return false;
      seen.add(p.categoryId);
      return true;
    });
  }
  grid.innerHTML = items.slice(0, 8).map(renderProductCard).join("");
}

function initHeroCarousel() {
  const carousel = document.getElementById("hero-carousel");
  if (!carousel) return;
  const slides = carousel.querySelectorAll(".hero-slide");
  const dotsWrap = carousel.querySelector(".hero-dots");
  let current = 0;

  if (dotsWrap) {
    dotsWrap.innerHTML = Array.from(slides)
      .map((_, i) => `<button class="hero-dot${i === 0 ? " is-active" : ""}" data-index="${i}"></button>`)
      .join("");
  }

  function show(index) {
    slides.forEach((s, i) => s.classList.toggle("is-active", i === index));
    if (dotsWrap) {
      dotsWrap.querySelectorAll(".hero-dot").forEach((d, i) => d.classList.toggle("is-active", i === index));
    }
    current = index;
  }

  function next() {
    show((current + 1) % slides.length);
  }

  carousel.querySelector(".hero-prev")?.addEventListener("click", () => {
    show((current - 1 + slides.length) % slides.length);
  });
  carousel.querySelector(".hero-next")?.addEventListener("click", next);
  dotsWrap?.addEventListener("click", (e) => {
    const dot = e.target.closest(".hero-dot");
    if (dot) show(Number(dot.dataset.index));
  });

  setInterval(next, 5000);
}

document.addEventListener("DOMContentLoaded", () => {
  renderCategoryNav();
  initBurgerMenu();
  initAddToCartDelegation();
  initWishlistDelegation();
  initThemeToggle();
  initBackToTop();
  renderCategoryGrid();
  initTileScroll();
  renderBestsellers();
  initHeroCarousel();
});
