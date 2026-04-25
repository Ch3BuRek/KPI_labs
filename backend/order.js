function placeOrder({ cart, customerName, deliveryAddress }) {
    console.log("[placeOrder] start");
    const orders = new Map();

    const order = {
        id: `ORD-${Date.now()}`,
        cart,
        customerName,
        deliveryAddress,
        status: "placed",
        placedAt: new Date().toISOString(),
    };

    orders.set(order.id, order);

    console.log("[placeOrder] created:", order);
    return order;
}

placeOrder({
    cart: [{ itemId: 1, quantity: 2 }],
    customerName: "Ivan",
    deliveryAddress: "Kyiv"
});