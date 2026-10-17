const cartKey = "maison_croissant_cart_v1";
const orderKey = "maison_croissant_orders_v1";

let cart = JSON.parse(localStorage.getItem(cartKey) || "[]");

const rupiah = (value) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

const cartDrawer = document.querySelector("[data-cart-drawer]");
const cartOverlay = document.querySelector("[data-cart-overlay]");
const cartItems = document.querySelector("[data-cart-items]");
const cartTotal = document.querySelector("[data-cart-total]");
const cartCount = document.querySelector("[data-cart-count]");
const checkoutButton = document.querySelector("[data-checkout]");

function saveCart() {
  localStorage.setItem(cartKey, JSON.stringify(cart));
  renderCart();
}

function renderCart() {
  const totalQty = cart.reduce((acc, item) => acc + item.qty, 0);
  const totalPrice = cart.reduce((acc, item) => acc + item.qty * item.price, 0);

  cartCount.textContent = totalQty;
  cartTotal.textContent = rupiah(totalPrice);

  if (!cart.length) {
    cartItems.innerHTML = `<div class="empty-cart"><p>Keranjang masih kosong.<br />Pilih menu favoritmu dulu.</p></div>`;
    return;
  }

  cartItems.innerHTML = cart
    .map(
      (item) => `
        <div class="cart-item">
          <div>
            <strong>${item.name}</strong>
            <small>${rupiah(item.price)} × ${item.qty}</small>
          </div>
          <div class="cart-controls" aria-label="Kontrol jumlah ${item.name}">
            <button type="button" data-decrease="${item.name}" aria-label="Kurangi">−</button>
            <span>${item.qty}</span>
            <button type="button" data-increase="${item.name}" aria-label="Tambah">+</button>
            <button class="remove" type="button" data-remove="${item.name}" aria-label="Hapus">×</button>
          </div>
        </div>
      `
    )
    .join("");
}

function openCart() {
  cartDrawer.classList.add("is-open");
  cartOverlay.classList.add("is-active");
  cartDrawer.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeCart() {
  cartDrawer.classList.remove("is-open");
  cartOverlay.classList.remove("is-active");
  cartDrawer.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function addToCart(name, price) {
  const existing = cart.find((item) => item.name === name);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ name, price, qty: 1 });
  }
  saveCart();
  openCart();
  toast(`${name} masuk keranjang`);
}

function updateQty(name, delta) {
  const item = cart.find((entry) => entry.name === name);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    cart = cart.filter((entry) => entry.name !== name);
  }
  saveCart();
}

function removeItem(name) {
  cart = cart.filter((entry) => entry.name !== name);
  saveCart();
  toast(`${name} dihapus`);
}

function toast(message) {
  const oldToast = document.querySelector(".toast");
  if (oldToast) oldToast.remove();

  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2500);
}

document.querySelectorAll(".add-to-cart").forEach((button) => {
  button.addEventListener("click", () => {
    addToCart(button.dataset.name, Number(button.dataset.price));
  });
});

cartItems.addEventListener("click", (event) => {
  const target = event.target;
  const increase = target.dataset.increase;
  const decrease = target.dataset.decrease;
  const remove = target.dataset.remove;

  if (increase) updateQty(increase, 1);
  if (decrease) updateQty(decrease, -1);
  if (remove) removeItem(remove);
});

document.querySelector("[data-open-cart]").addEventListener("click", openCart);
document.querySelector("[data-close-cart]").addEventListener("click", closeCart);
cartOverlay.addEventListener("click", closeCart);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeCart();
});

checkoutButton.addEventListener("click", () => {
  if (!cart.length) {
    toast("Keranjang masih kosong");
    return;
  }

  const orders = JSON.parse(localStorage.getItem(orderKey) || "[]");
  const order = {
    id: `ORD-${Date.now()}`,
    items: cart,
    total: cart.reduce((acc, item) => acc + item.qty * item.price, 0),
    createdAt: new Date().toISOString(),
  };

  orders.push(order);
  localStorage.setItem(orderKey, JSON.stringify(orders));
  cart = [];
  saveCart();
  closeCart();
  toast(`Order ${order.id} tersimpan`);
});

const filterButtons = document.querySelectorAll("[data-filter]");
const productCards = document.querySelectorAll(".product-card");

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    filterButtons.forEach((chip) => chip.classList.remove("active"));
    button.classList.add("active");

    const filter = button.dataset.filter;
    productCards.forEach((card) => {
      const categories = card.dataset.category || "";
      const shouldShow = filter === "all" || categories.includes(filter);
      card.classList.toggle("is-hidden", !shouldShow);
    });
  });
});

const navLinks = document.querySelector("[data-nav-links]");
const menuButton = document.querySelector("[data-menu-button]");

menuButton.addEventListener("click", () => {
  navLinks.classList.toggle("is-open");
});

navLinks.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => navLinks.classList.remove("is-open"));
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.14 }
);

document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));

const orderForm = document.querySelector("#orderForm");
const formStatus = document.querySelector("[data-form-status]");

orderForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(orderForm);
  const order = {
    id: `PRE-${Date.now()}`,
    name: formData.get("name"),
    phone: formData.get("phone"),
    package: formData.get("package"),
    notes: formData.get("notes") || "-",
    createdAt: new Date().toISOString(),
  };

  const orders = JSON.parse(localStorage.getItem(orderKey) || "[]");
  orders.push(order);
  localStorage.setItem(orderKey, JSON.stringify(orders));

  formStatus.textContent = `Pre-order ${order.id} terkirim. Simpan dulu di localStorage.`;
  toast("Pre-order tersimpan");
  orderForm.reset();
});

renderCart();
