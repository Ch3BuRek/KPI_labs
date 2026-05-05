import { EventEmitter } from './feautures/event.js';

const orders = new Map();
export const orderBus = new EventEmitter('OrderBus');

const RESTAURANT = { lat: 50.4501, lng: 30.5234 };

function randomNearby(center, radiusKm = 3) {
    const latOffset = (Math.random() - 0.5) * 2 * (radiusKm / 111);
    const lngOffset = (Math.random() - 0.5) * 2 * (radiusKm / (111 * Math.cos(center.lat * Math.PI / 180)));
    return {
        lat: +(center.lat + latOffset).toFixed(6),
        lng: +(center.lng + lngOffset).toFixed(6),
    };
}

// ── valid statuses ────────────────────────────────────────────────────────────
const STATUSES = ['placed', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];


export function createOrder({ cart, customerName, deliveryAddress }) {
    const subtotal   = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const serviceFee = subtotal * 0.05;
    const total      = subtotal + serviceFee;

    const order = {
        id: `ORD-${Date.now()}`,
        cart,
        customerName,
        deliveryAddress,
        coords: randomNearby(RESTAURANT), 
        status: "placed",
        subtotal: +subtotal.toFixed(2),
        serviceFee: +serviceFee.toFixed(2),
        total: +total.toFixed(2),
        placedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    orders.set(order.id, order);
    orderBus.emit('orderPlaced', order);
    simulateWork(order.id); 
    console.log(`order: ${order.id} — $${order.total}`);
    
    return order;
}

export function getOrder(id) {
    return orders.get(id) || null;
}

export function getAllOrders() {
    return [...orders.values()];
}

export function updateOrderStatus(id, newStatus) {
    const order = orders.get(id);
    if (!order) {
        throw new Error(`Order ${id} not found`);
    }

    order.status    = newStatus;
    order.updatedAt = new Date().toISOString();

    console.log(`order ${id} → ${newStatus}`);
    orderBus.emit('order_stats_updated', order);
    return order;
}


function simulateWork(orderId) {
    const flow   = ['confirmed', 'preparing', 'ready', 'delivered'];
    const delays = [2000, 4000, 6000, 3000];
    let totalDelay = 0;

    flow.forEach((status, i) => {
        totalDelay += delays[i];
        setTimeout(() => {
            const order = orders.get(orderId);
            updateOrderStatus(orderId, status);
        }, totalDelay);
    });
}