import { menu } from "../backend/data.js";

const $ = id => document.getElementById(id);

//----------------------------------------------------------------------
let cart = [];

function addToCart(id) {
    const item = menu.find(i => i.id == id);
    if (!item) return;

    const existing = cart.find(c => c.id == id);

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
            <span>${item.name}</span>
            <span>x${item.quantity}</span>
            <span>$${(item.price * item.quantity).toFixed(2)}</span>
        </div>
    `).join('');
}

renderCategories();
renderMenu();