/* Общая логика шапки/футера и главной страницы */

function renderCategoryNav() {
  const list = document.getElementById("category-nav-list");
  if (!list) return;
  const params = new URLSearchParams(window.location.search);
  const activeCategory = params.get("category");
  list.innerHTML = CATEGORIES.map(
    (c) => `<li>
      <a href="catalog.html?category=${c.id}" class="${c.id === activeCategory ? "is-active" : ""}">
        <span class="cat-icon">${c.icon}</span>${c.name}
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
  });
}

/* ---- Главная страница ---- */

function renderCategoryGrid() {
  const grid = document.getElementById("category-grid");
  if (!grid) return;
  grid.innerHTML = CATEGORIES.map((c) => {
    const colors = categoryColors(c.id);
    return `<a class="category-card" href="catalog.html?category=${c.id}" style="background:${colors.bg};color:${colors.fg}">
      <span class="category-card-icon">${c.icon}</span>
      <span class="category-card-name">${c.name}</span>
    </a>`;
  }).join("");
}

function renderBestsellers() {
  const grid = document.getElementById("bestsellers-grid");
  if (!grid) return;
  const items = PRODUCTS.filter((p) => p.bestseller).slice(0, 8);
  grid.innerHTML = items.map(renderProductCard).join("");
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
  renderCategoryGrid();
  renderBestsellers();
  initHeroCarousel();
});
