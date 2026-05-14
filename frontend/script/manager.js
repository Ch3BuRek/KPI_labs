import { initManagerAuth } from './auth.js';

const $ = id => document.getElementById(id);

const auth = initManagerAuth({ onLogin: startApp });

//----------------------------------------------------------------------
const NEXT_STATUS = {
    placed:    'confirmed',
    confirmed: 'preparing',
    preparing: 'ready',
    ready:     'delivered',
};

const ROUTE_LINE_STYLE = {
    color:     '#1a5275',
    weight:    3,
    dashArray: '6 6',
    opacity:   0.7,
};

//----------------------------------------------------------------------
async function loadOrders() {
    try {
        const res = await fetch('/data/orders', { headers: auth.header() });
        if (res.status === 401) { auth.showLogin(); return; }
        if (!res.ok) return;
        const orders = await res.json();
        renderOrders(orders);
        updateMap(orders);
    } catch (err) {
        console.warn('loadOrders failed:', err.message);
    }
}

const renderedState = new Map();

function renderOrders(orders) {
    const changed = orders.length !== renderedState.size
        || orders.some(o => renderedState.get(o.id) !== o.status);
    if (!changed) return;

    renderedState.clear();
    orders.forEach(o => renderedState.set(o.id, o.status));

    const main   = document.querySelector('.kitchen-grid');
    const sorted = [...orders].sort((a, b) => new Date(b.placedAt) - new Date(a.placedAt));
    main.innerHTML = `<div class="orders-grid">${sorted.map(renderOrderCard).join('')}</div>`;
    main.querySelectorAll('.advance-btn').forEach(btn => {
        btn.addEventListener('click', () => advanceStatus(btn.dataset.id, btn.dataset.next));
    });
}

function renderOrderCard(order) {
    const nextStatus = NEXT_STATUS[order.status];
    const time       = new Date(order.placedAt).toLocaleTimeString();
    const isDone     = order.status === 'delivered' || order.status === 'cancelled';

    return `
        <div class="order-card" data-id="${order.id}" data-status="${order.status}">
            <div class="order-card-head">
                <span class="order-id">${order.id}</span>
                <span class="order-status">${order.status}</span>
            </div>
            <div class="order-meta">
                <span>${order.deliveryAddress}</span>
                <span>at ${time}</span>
            </div>
            <div class="order-items">
                ${order.cart.map(i => `
                    <div class="order-item">
                        <span>${i.name} x ${i.quantity}</span>
                        <span>$${(i.price * i.quantity).toFixed(2)}</span>
                    </div>
                `).join('')}
            </div>
            <div class="order-total">Total: $${order.total.toFixed(2)}</div>
            ${!isDone && nextStatus ? `
                <div class="order-actions">
                    <button class="advance-btn btn-primary"
                        data-id="${order.id}" data-next="${nextStatus}">
                        -> Mark as ${nextStatus}
                    </button>
                </div>
            ` : ''}
        </div>
    `;
}

async function advanceStatus(id, newStatus) {
    try {
        const res = await fetch(`/data/orders/${id}/status`, {
            method:  'PATCH',
            headers: { 'Content-Type': 'application/json', ...auth.header() },
            body:    JSON.stringify({ status: newStatus }),
        });
        if (res.status === 401) { auth.showLogin(); return; }
        if (!res.ok) throw new Error('Failed to update');
        loadOrders();
    } catch (err) {
        alert(`Error: ${err.message}`);
    }
}

//----------------------------------------------------------------------
const customerMarkers = new Map();
const courierMarkers  = new Map();
const courierLines    = new Map();

function updateMap(orders) {
    const activeOrders = orders.filter(o => !['delivered', 'cancelled'].includes(o.status));

    const toRemove = [];
    for (const [id] of customerMarkers) {
        if (!activeOrders.find(o => o.id === id)) toRemove.push(id);
    }
    for (const id of toRemove) {
        map.removeLayer(customerMarkers.get(id));
        customerMarkers.delete(id);
    }

    for (const order of activeOrders) {
        if (!order.coords) continue;

        if (!customerMarkers.has(order.id)) {
            const icon = L.divIcon({
                className: '',
                html: `<div class="pin-customer"><img src="icons/pin.svg" alt="customer pin"/></div>`,
                iconSize: [36, 36], iconAnchor: [18, 36],
            });
            const marker = L.marker([order.coords.lat, order.coords.lng], { icon, zIndexOffset: 1000 })
                .addTo(map)
                .bindPopup(`<strong>${order.customerName}</strong><br>${order.deliveryAddress}<br>$${order.total} — ${order.status}`);
            customerMarkers.set(order.id, marker);
        } else {
            customerMarkers.get(order.id).getPopup().setContent(
                `<strong>${order.customerName}</strong><br>${order.deliveryAddress}<br>$${order.total} — ${order.status}`
            );
        }
    }
}

const RESTAURANT = { lat: 50.4501, lng: 30.5234 };
let map;

function initMap() {
    map = L.map('map').setView([RESTAURANT.lat, RESTAURANT.lng], 13);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap © CARTO',
        subdomains: 'abcd',
        maxZoom: 16,
    }).addTo(map);

    const restaurantIcon = L.divIcon({
        className: '',
        html: `<div class="map-pin pin-restaurant"><img src="icons/convenience-store.svg" alt="restaurant"/></div>`,
        iconSize: [36, 36], iconAnchor: [18, 36],
    });

    L.marker([RESTAURANT.lat, RESTAURANT.lng], { icon: restaurantIcon })
        .addTo(map)
        .bindPopup('<strong>Наш ресторан</strong>')
        .openPopup();
}

async function updateCouriers() {
    const res = await fetch('/data/couriers', { headers: auth.header() });
    if (res.status === 401) { auth.showLogin(); return; }
    if (!res.ok) return;
    const couriers = await res.json();

    for (const courier of couriers) {
        if (!courierMarkers.has(courier.id)) {
            const icon = L.divIcon({
                className: '',
                html: `<div class="map-pin pin-drone"><img src="icons/fly.svg" alt="drone"/></div>`,
                iconSize: [36, 36], iconAnchor: [18, 18],
            });
            const marker = L.marker([courier.lat, courier.lng], { icon })
                .addTo(map)
                .bindPopup(`<strong>${courier.name}</strong><br>${courier.status}`);
            courierMarkers.set(courier.id, marker);
        } else {
            const marker = courierMarkers.get(courier.id);
            marker.setLatLng([courier.lat, courier.lng]);
            marker.getPopup().setContent(
                `<strong>${courier.name}</strong><br>${courier.status}` +
                (courier.orderId ? `<br>Order: ${courier.orderId}` : '')
            );
        }

        const target = getCourierTarget(courier);
        if (target) {
            const points = [[courier.lat, courier.lng], [target.lat, target.lng]];
            if (!courierLines.has(courier.id)) {
                courierLines.set(courier.id, L.polyline(points, ROUTE_LINE_STYLE).addTo(map));
            } else {
                courierLines.get(courier.id).setLatLngs(points);
            }
        } else if (courierLines.has(courier.id)) {
            map.removeLayer(courierLines.get(courier.id));
            courierLines.delete(courier.id);
        }
    }
}

function getCourierTarget(courier) {
    if (courier.status === 'heading_to_restaurant') return RESTAURANT;
    if (courier.status === 'heading_to_customer')   return courier.order?.coords ?? null;
    return null;
}

//----------------------------------------------------------------------
async function loadStats() {
    const res = await fetch('/data/orders/stats', { headers: auth.header() });
    if (res.status === 401) { auth.showLogin(); return; }
    if (!res.ok) return;
    const s = await res.json();

    $('s-total').textContent     = s.total;
    $('s-active').textContent    = s.active;
    $('s-completed').textContent = s.completed;
    $('s-revenue').textContent   = `$${s.revenue.toFixed(2)}`;
}

function poll(fn, interval) {
    async function run() {
        await fn();
        setTimeout(run, interval);
    }
    run();
}

//----------------------------------------------------------------------
function formatActivityEntry(entry) {
    const time = new Date(entry.timestamp).toLocaleTimeString();
    let msg;

    if (entry.name === '_createOrder' || entry.name === 'placeOrder') {
        const id = entry.result?.id ?? '?';
        const total = entry.result?.total ?? '?';
        const dur = entry.duration != null ? ` (${entry.duration}ms)` : '';
        msg = `New order <strong>${id}</strong> — $${total}${dur}`;

    } else if (entry.name === '_updateOrderStatus') {
        const [id, status] = entry.args ?? [];
        msg = `<strong>${id}</strong> → ${status}`;

    } else if (entry.name === 'server') {
        msg = typeof entry.result === 'string' ? entry.result : JSON.stringify(entry.result);
    } else if (entry.level === 'ERROR') {
        msg = `<strong>${entry.name}</strong> threw: ${entry.error?.message ?? 'unknown'}`;
    } else {
        msg = entry.formatted ?? `${entry.name}: ${JSON.stringify(entry.result ?? '')}`;
    }

    return `<div class="activity-entry activity-${entry.level}">
        <div class="activity-meta">
            <span class="activity-time">${time}</span>
            <span class="activity-level">${entry.level}</span>
        </div>
        <span class="activity-msg">${msg}</span>
    </div>`;
}

function connectActivityStream() {
    const log = $('activity-log');
    const token = auth.getToken();
    const es = new EventSource(`/data/activity/stream?_auth=${encodeURIComponent(token)}`);

    es.onmessage = e => {
        const entry = JSON.parse(e.data);
        log.insertAdjacentHTML('afterbegin', formatActivityEntry(entry));
        while (log.children.length > 80) log.lastElementChild.remove();
    };
    es.onerror = () => es.close();
}

//----------------------------------------------------------------------
function startApp() {
    initMap();
    poll(loadOrders, 1_000);
    poll(updateCouriers, 1_000);
    poll(loadStats, 3_000);
    connectActivityStream();
}

if (auth.getToken()) {
    startApp();
} else {
    auth.showLogin();
}
