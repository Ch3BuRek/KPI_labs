import { initCustomerAuth } from './auth.js';

const $ = id => document.getElementById(id);
let cart = [], menuData = [], lastOrderCart = [];

const auth = initCustomerAuth();

//----------------------------------------------------------------------
async function init() {
    const [menuRes, categoriesRes] = await Promise.all([
        fetch('/data/menu'),
        fetch('/data/categories'),
    ]);
    menuData = await menuRes.json();
    const categories = await categoriesRes.json();

    renderCategories(categories);
    renderMenu(categories);
    auth.updateUI();
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
        cart.push({ id: item.id, name: item.name, price: item.price, quantity: 1 });
    }

    renderCart();
}

//----------------------------------------------------------------------
const PLACEHOLDER_COLORS = ['#f0c27f', '#a8d8a8', '#a2c4e0', '#f4a9a8', '#b5a9d6', '#f9d59b'];

function renderCategories(categories) {
    $('cat-tabs').innerHTML = categories.map(c =>
        `<li><button class="cat-tab" data-cat="${c.id}">${c.name}</button></li>`
    ).join('');

    $('cat-tabs').querySelectorAll('.cat-tab').forEach(btn => {
        btn.addEventListener('click', () => {
            setActiveTab(btn.dataset.cat);
            const section = document.getElementById(`section-${btn.dataset.cat}`);
            if (section) section.scrollIntoView({ behavior: 'smooth' });
        });
    });

    const first = $('cat-tabs').querySelector('.cat-tab');
    if (first) first.classList.add('active');
}

function setActiveTab(catId) {
    $('cat-tabs').querySelectorAll('.cat-tab').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.cat === catId);
    });
}

//----------------------------------------------------------------------
function renderMenu(categories) {
    $('menu-grid').innerHTML = categories.map((cat, catIdx) => {
        const items = menuData.filter(i => i.category === cat.id);
        if (!items.length) return '';

        const color = PLACEHOLDER_COLORS[catIdx % PLACEHOLDER_COLORS.length];
        const cards = items.map(item => `
            <div class="menu-card">
                <div class="menu-card-img" style="--img-color: ${color}"></div>
                <div class="menu-card-body">
                    <div class="menu-card-name">${item.name}</div>
                    <div class="menu-card-desc">${item.description}</div>
                    <div class="menu-card-price">$${item.price.toFixed(2)}</div>
                </div>
                <button class="add-btn" data-id="${item.id}">+</button>
            </div>
        `).join('');

        return `
            <div class="menu-category" id="section-${cat.id}">
                <h2 class="menu-category-title">${cat.name}</h2>
                ${cards}
            </div>
        `;
    }).join('');

    $('menu-grid').querySelectorAll('.add-btn').forEach(btn => {
        btn.addEventListener('click', () => addToCart(btn.dataset.id));
    });
}

//----------------------------------------------------------------------
function renderCart() {
    $('cart-count').textContent = cart.reduce((sum, item) => sum + item.quantity, 0);

    if (cart.length === 0) {
        $('cart-items').innerHTML = '<p>Кошик порожній</p>';
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
    const subtotal   = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const serviceFee = subtotal * 0.05;
    const total      = subtotal + serviceFee;

    $('cart-totals').classList.remove('hidden');
    $('cart-totals').innerHTML = `
        <div class="total-row"><span>Сума</span><span>$${subtotal.toFixed(2)}</span></div>
        <div class="total-row"><span>Сервісний збір (5%)</span><span>$${serviceFee.toFixed(2)}</span></div>
        <div class="total-row grand"><span>Всього</span><span>$${total.toFixed(2)}</span></div>
    `;
}

//----------------------------------------------------------------------
const STEPS = [
    { key: 'placed',    label: 'Прийнято'     },
    { key: 'confirmed', label: 'Підтверджено' },
    { key: 'preparing', label: 'Готується'    },
    { key: 'ready',     label: 'Готово'       },
    { key: 'delivered', label: 'Доставлено'   },
];

function updateProgress(status) {
    const idx = STEPS.findIndex(s => s.key === status);
    STEPS.forEach((step, i) => {
        const el = document.getElementById(`step-${step.key}`);
        if (!el) return;
        el.classList.remove('done', 'active', 'pending', 'cancelled');
        if (status === 'cancelled') {
            el.classList.add('cancelled');
        } else {
            el.classList.add(i < idx ? 'done' : i === idx ? 'active' : 'pending');
        }
    });
}

function connectOrderStream(orderId) {
    const es = new EventSource(`/data/orders/${orderId}/stream`);
    es.onmessage = e => {
        const order = JSON.parse(e.data);
        updateProgress(order.status);
        if (order.status === 'delivered') {
            es.close();
            setTimeout(showDeliveredScreen, 700);
        } else if (order.status === 'cancelled') {
            es.close();
        }
    };
    es.onerror = () => es.close();
}

function showDeliveredScreen() {
    const pd = $('post-delivery');
    if (!pd) return;
    pd.innerHTML = `
        <p class="rating-prompt">Як вам замовлення?</p>
        <div class="star-rating" id="star-rating">
            ${[1,2,3,4,5].map(v => `<button class="star" data-v="${v}">★</button>`).join('')}
        </div>
        <p id="rating-thanks" class="rating-thanks"></p>
        <button id="order-again-btn" class="btn-primary">Замовити знову</button>
    `;

    const stars = pd.querySelectorAll('.star');
    stars.forEach(star => {
        star.addEventListener('mouseover', () => {
            const v = +star.dataset.v;
            stars.forEach(s => s.classList.toggle('hover', +s.dataset.v <= v));
        });
        star.addEventListener('mouseout', () => stars.forEach(s => s.classList.remove('hover')));
        star.addEventListener('click', () => {
            const v = +star.dataset.v;
            stars.forEach(s => {
                s.classList.remove('hover');
                s.classList.toggle('selected', +s.dataset.v <= v);
            });
            $('rating-thanks').textContent = v >= 4
                ? 'Дякуємо <3'
                : 'Дякуємо за відгук!.';
        });
    });

    $('order-again-btn').addEventListener('click', restoreCartView);
}

function restoreCartView() {
    $('cart-panel').innerHTML = `
        <h3 class="cart-title">Ваше замовлення</h3>
        <div class="field-group">
            <label for="address-input">Адреса доставки</label>
            <input id="address-input" type="text" placeholder="Введіть адресу доставки" value="Контрактова площа, 123"/>
        </div>
        <div id="cart-items" class="cart-items"></div>
        <div id="cart-totals" class="cart-totals hidden"></div>
        <button id="place-order-btn" class="btn-primary" disabled>Замовити</button>
        <p id="order-error" class="order-error"></p>
    `;
    attachCartListeners();
    cart = lastOrderCart.map(i => ({ ...i }));
    renderCart();
}

//----------------------------------------------------------------------
function attachCartListeners() {
    $('place-order-btn').addEventListener('click', () => auth.requireAuth(placeOrder));
    $('address-input').addEventListener('input', () => {
        $('place-order-btn').disabled = !$('address-input').value.trim() || !cart.length;
    });
}

attachCartListeners();

async function placeOrder() {
    const address = $('address-input').value.trim();

    $('order-error').textContent = '';
    $('place-order-btn').disabled = true;
    $('place-order-btn').textContent = 'Обробляємо...';

    try {
        const res = await fetch('/data/orders', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json', ...auth.header() },
            body:    JSON.stringify({ cart, deliveryAddress: address }),
        });

        if (res.status === 401) { auth.requireAuth(placeOrder); return; }

        const order = await res.json();
        lastOrderCart = [...cart];
        cart = [];
        $('cart-count').textContent = '0';
        showConfirmation(order);
    } catch {
        $('order-error').textContent = 'Не вдалось оформити замовлення. Спробуйте ще раз.';
        $('place-order-btn').disabled = false;
    } finally {
        $('place-order-btn').textContent = 'Замовити';
    }
}

function showConfirmation(order) {
    $('cart-panel').innerHTML = `
        <div class="confirmation">
            <h3>Замовлення прийнято!</h3>
            <p class="order-id">№ <strong>${order.id}</strong></p>
            <p class="order-address">${order.deliveryAddress}</p>

            <div class="progress-track">
                ${STEPS.map(s => `
                    <div class="progress-step pending" id="step-${s.key}">
                        <div class="step-dot"></div>
                        <div class="step-label">${s.label}</div>
                    </div>
                `).join('')}
            </div>

            <div id="post-delivery">
                <div class="order-summary">
                    ${order.cart.map(i => `
                        <div class="conf-item">
                            <span>${i.name} x ${i.quantity}</span>
                            <span>$${(i.price * i.quantity).toFixed(2)}</span>
                        </div>
                    `).join('')}
                </div>
                <div class="conf-total">Всього: $${order.total.toFixed(2)}</div>
            </div>
        </div>
    `;

    updateProgress(order.status);
    connectOrderStream(order.id);
}

