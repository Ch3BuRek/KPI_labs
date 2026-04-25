const orders = new Map();

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
        status: "placed",
        subtotal: +subtotal.toFixed(2),
        serviceFee: +serviceFee.toFixed(2),
        total: +total.toFixed(2),
        placedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    orders.set(order.id, order);
    console.log(`order: ${order.id} — $${order.total}`);
    
    return order;
}

export function updateOrderStatus(id, newStatus) {
    const order = orders.get(id);
    if (!order) {
        throw new Error(`Order ${id} not found`);
    }

    order.status    = newStatus;
    order.updatedAt = new Date().toISOString();

    console.log(`order ${id} → ${newStatus}`);
    return order;
}