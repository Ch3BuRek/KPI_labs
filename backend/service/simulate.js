import { createOrder } from './order.js';
import { menu, DELIVERY_LOCATIONS } from '../data.js';

const NAMES = [
    'Олег', 'Марія', 'Іван', 'Софія', 'Данило',
    'Олена', 'Микола', 'Юлія', 'Андрій', 'Наталія',
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

function placeRandomOrder() {
    const location = randomItem(DELIVERY_LOCATIONS);

    createOrder({
        cart:            randomCart(),
        customerName:    randomItem(NAMES),
        deliveryAddress: location.address,
        coords:          { lat: location.lat, lng: location.lng },
    });
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