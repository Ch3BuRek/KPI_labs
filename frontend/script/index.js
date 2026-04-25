const $ = id => document.getElementById(id);
let cart = [], menuData = [];

async function init() {
    const res  = await fetch('/data/menu');
    menuData = await res.json();

    renderCategories(menuData);
    renderMenu(menuData, '');
}

init();

//----------------------------------------------------------------------
function addToCart(id) {
    const item = menuData.find(i => i.id === id);
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
function renderCategories(menu) {
    const categories = [...new Set(menuData.map(i => i.category))];

    $('cat-tabs').innerHTML =
    `<button class="cat-tab active" data-cat="">All</button>` +
    categories.map(cat =>`<button class="cat-tab" data-cat="${cat}">${cat}</button>`).join('');


    $('cat-tabs').querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => {renderMenu(btn.dataset.cat);});
    });
}

//----------------------------------------------------------------------
function renderMenu(category, menu) {
    const items = category
    ? menuData.filter(i => i.category === category)
    : menuData;

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
        $('cart-totals').classList.add('hidden');
        $('place-order-btn').disabled = true;
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

//----------------------------------------------------------------------
$('place-order-btn').addEventListener('click', async () => {
    const address = $('address-input').value.trim();

    $('place-order-btn').disabled = true;
    $('place-order-btn').textContent = 'Placing...';

    try {
        const res   = await fetch('/data/order', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ cart, deliveryAddress: address }),
        });

        const order = await res.json();

        showConfirmation(order);

        cart = [];
        renderCart();

    } catch (err) {
        alert('Fail');
    } finally {
        $('place-order-btn').textContent = 'Place Order';
    }
});

function showConfirmation(order) {
    const panel = $('cart-panel');
    panel.innerHTML = `
        <div class="confirmation">
            <h3>Order placed!</h3>
            <p class="order-id">Order ID: <strong>${order.id}</strong></p>
            <p>Delivering to: ${order.deliveryAddress}</p>
            <div class="order-summary">
                ${order.cart.map(i => `
                    <div class="conf-item">
                        <span>${i.name} x ${i.quantity}</span>
                        <span>$${(i.price * i.quantity).toFixed(2)}</span>
                    </div>
                `).join('')}
            </div>
            <div class="conf-total">Total: $${order.total.toFixed(2)}</div>
            <button id="new-order-btn" class="btn-primary">New Order</button>
        </div>
    `;

    $('new-order-btn').addEventListener('click', () => {
        location.reload();
    });
}

$('address-input').addEventListener('input', () => {
    $('place-order-btn').disabled = !$('address-input').value.trim() || !cart.length;
});

init();