import { createOrder } from './order.js';
import { menu } from '../data.js';

const NAMES = [
    'Олег', 'Марія', 'Іван', 'Софія', 'Данило',
    'Олена', 'Микола', 'Юлія', 'Андрій', 'Наталія',
];

const ADDRESSES = [
    'вулиця Хрещатик, 12',
    'проспект Шевченка, 45',
    'бульвар Лесі Українки, 8',
    'вулиця Городського, 23',
    'вулиця Антоновича, 77',
];

function randomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function randomCart() {
    const count = 1 + Math.floor(Math.random() * 3);
    const cart  = [];

    for (let i = 0; i < count; i++) {
        const item = randomItem(menu);
        const existing = cart.find(c => c.id === item.id);

        if (existing) {
            existing.quantity++;
        } else {
            cart.push({ ...item, quantity: 1 });
        }
    }

    return cart;
}

const sharedOrder = { cart: [], customerName: '', deliveryAddress: '' };

function placeRandomOrder() {
    sharedOrder.cart = randomCart();
    sharedOrder.customerName = randomItem(NAMES);
    sharedOrder.deliveryAddress = randomItem(ADDRESSES);
    
    createOrder(sharedOrder);
}

export function startSimulation() {
    placeRandomOrder();

    function scheduleNext() {
        const delay = 20000 + Math.random() * 15000;
        setTimeout(() => {
            placeRandomOrder();
            scheduleNext();
        }, delay);
    }

    scheduleNext();
    console.log('сімулейшн');
}