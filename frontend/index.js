import { menu } from "../backend/data.js";

const $ = id => document.getElementById(id);

//----------------------------------------------------------------------
let cart = [];

function addToCart(id) {
    const item = menu.find(i => i.id === id);
    if (!item) return;

    const existing = cart.find(c => c.id === id);

    if (existing) {
        existing.quantity++;
    } else {
        cart.push({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: 1
        });
    }

    renderCart();
}

//----------------------------------------------------------------------
function renderCategories() {
    const categories = [...new Set(menu.map(i => i.category))];

    $('cat-tabs').innerHTML =
    `<button class="cat-tab active" data-cat="">All</button>` +
    categories.map(cat =>`<button class="cat-tab" data-cat="${cat}">${cat}</button>`).join('');


    $('cat-tabs').querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => {renderMenu(btn.dataset.cat);});
    });
}

//----------------------------------------------------------------------
function renderMenu(category) {
    const items = category
    ? menu.filter(i => i.category === category)
    : menu;

    $('menu-grid').innerHTML = items.map(item => `
        <div class="menu-card">
        <div class="menu-card-name">${item.name}</div>
        <div class="menu-card-desc">${item.description}</div>
        <div class="menu-card-foot">
            <span class="menu-card-price">$${item.price.toFixed(2)}</span>
            <button class="add-btn" data-id="${item.id}">+</button>
        </div>
        </div>
    `).join('');

    $('menu-grid').querySelectorAll('.add-btn').forEach(btn => {
        btn.addEventListener('click', () => addToCart(btn.dataset.id));
    });
}

function renderCart() {
    $('cart-count').textContent = cart.reduce((sum, item) => sum + item.quantity, 0);

    if (cart.length === 0) {
        $('cart-items').innerHTML = "<p>Cart is empty</p>";
        return;
    }

    $('cart-items').innerHTML = cart.map(item => `
        <div class="cart-item">
            <span class="cart-item-name">${item.name}</span>
            <div class="cart-item-qty">
                <button class="qty-btn" data-id="${item.id}" data-action="decrease">-</button>
                <span class="cart-item-count">${item.quantity}</span>
                <button class="qty-btn" data-id="${item.id}" data-action="increase">+</button>
            </div>
            <span class="cart-item-price">$${(item.price * item.quantity).toFixed(2)}</span>
        </div>
    `).join('');

    $('cart-items').querySelectorAll('.qty-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const item = cart.find(c => c.id === btn.dataset.id);

            if (btn.dataset.action === 'increase') item.quantity++;
            else item.quantity = Math.max(0, item.quantity - 1);

            cart = cart.filter(c => c.quantity > 0);
            renderCart();
        });
    }); 

  fetchTotals();
  $('place-order-btn').disabled = !$('address-input').value.trim();
}

function fetchTotals() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const serviceFee = subtotal * 0.05;
    const total = subtotal + serviceFee;

    const t = { subtotal, serviceFee, total };

    $('cart-totals').classList.remove('hidden');
    $('cart-totals').innerHTML = `
        <div class="total-row"><span>Subtotal</span><span>$${t.subtotal.toFixed(2)}</span></div>
        <div class="total-row"><span>Service fee (5%)</span><span>$${t.serviceFee.toFixed(2)}</span></div>
        <div class="total-row grand"><span>Total</span><span>$${t.total.toFixed(2)}</span></div>
    `;
}

$('place-order-btn').addEventListener('click', () => {
    alert(`Order placed`);
    cart = [];
    renderCart();
});

renderCategories();
renderMenu();