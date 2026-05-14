import { EventEmitter } from '../feautures/event.js';
import { RESTAURANT } from '../data.js';
import { log } from '../feautures/logger.js';

const orders = new Map();
export const orderBus = new EventEmitter('OrderBus');

function randomNearby(center, radiusKm = 3) {
    const latOffset = (Math.random() - 0.5) * 2 * (radiusKm / 111);
    const lngOffset = (Math.random() - 0.5) * 2 * (radiusKm / (111 * Math.cos(center.lat * Math.PI / 180)));
    return {
        lat: +(center.lat + latOffset).toFixed(6),
        lng: +(center.lng + lngOffset).toFixed(6),
    };
}

//----------------------------------------------------------------------
function simulateWork(orderId) {
    const flow = ['confirmed', 'preparing', 'ready'];
    const delays = [5000, 10000, 8000];
    let totalDelay = 0;

    flow.forEach((status, i) => {
        totalDelay += delays[i];
        setTimeout(() => {
            const order = orders.get(orderId);
            if (!order || order.status === 'cancelled') return;
            updateOrderStatus(orderId, status);
        }, totalDelay);
    });
}

//----------------------------------------------------------------------
function _createOrder({ cart, customerName, deliveryAddress, coords }) {
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const serviceFee = subtotal * 0.05;
    const total = subtotal + serviceFee;

    const order = {
        id: `ORD-${Date.now()}`,
        cart,
        customerName,
        deliveryAddress,
        coords: coords ?? randomNearby(RESTAURANT),
        status: 'placed',
        subtotal: +subtotal.toFixed(2),
        serviceFee: +serviceFee.toFixed(2),
        total:  +total.toFixed(2),
        placedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    orders.set(order.id, order);
    orderBus.emit('orderPlaced', order);
    simulateWork(order.id);
    return order;
}

function _updateOrderStatus(id, newStatus) {
    const order = orders.get(id);
    if (!order) throw new Error(`Order ${id} not found`);

    order.status = newStatus;
    order.updatedAt = new Date().toISOString();

    orderBus.emit('orderUpdate', order);
    return order;
}

//----------------------------------------------------------------------
export const createOrder = log({ level: 'INFO', timing: true })(_createOrder);
export const updateOrderStatus = log('INFO')(_updateOrderStatus);

export const getOrder = id => orders.get(id) ?? null;
export const getAllOrders = ()  => [...orders.values()];
