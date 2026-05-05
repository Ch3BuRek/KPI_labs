import { RESTAURANT } from '../data.js';
import { orderBus, updateOrderStatus } from './order.js';

const couriers = [
    { id: 'c1', name: 'Мухамед',   lat: 50.452, lng: 30.515, status: 'idle', orderId: null },
    { id: 'c2', name: 'Абдилбек',  lat: 50.448, lng: 30.530, status: 'idle', orderId: null },
    { id: 'c3', name: 'Котакбас', lat: 50.455, lng: 30.525, status: 'idle', orderId: null },
];

export function getCouriers() { return couriers; }

function stepToward(courier, target, speed = 0.0003) {
    const dlat = target.lat - courier.lat;
    const dlng = target.lng - courier.lng;
    const dist  = Math.sqrt(dlat * dlat + dlng * dlng);
    if (dist < speed) {
        courier.lat = target.lat;
        courier.lng = target.lng;
        return true;
    }
    courier.lat += (dlat / dist) * speed;
    courier.lng += (dlng / dist) * speed;
    return false;
}

orderBus.on('orderUpdate', (payload) => {
    const order = payload.data;
    if (order.status !== 'ready') return;

    const courier = couriers.find(c => c.status === 'idle');
    if (!courier) return;

    courier.status = 'heading_to_restaurant';
    courier.orderId = order.id;
    courier.order = order;

    console.log(`курєр ${courier.name} прийняв ${order.id}`);
});

setInterval(() => {
    for (const courier of couriers) {
        if (courier.status === 'heading_to_restaurant') {
            const arrived = stepToward(courier, RESTAURANT);
            if (arrived) {
                courier.status = 'heading_to_customer';
                console.log(`курєр ${courier.name} везе ${courier.orderId}`);
            }
        } else if (courier.status === 'heading_to_customer') {
            const arrived = stepToward(courier, courier.order.coords);
            if (arrived) {
                updateOrderStatus(courier.orderId, 'доставив');
                courier.status = 'idle';
                courier.orderId = null;
                courier.order = null;
                console.log(`курєр ${courier.name} в очікувані`);
            }
        }
    }
}, 500);