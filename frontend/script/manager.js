const $ = id => document.getElementById(id);

const NEXT_STATUS = {
  placed: 'confirmed',
  confirmed: 'preparing',
  preparing: 'ready',
  ready:'delivered',
};

const res = await fetch('data/orders');
const orders = await res.json();

//----------------------------------------------------------------------
function renderOrders(orders) {
    const main = document.querySelector('main');
    const sorted = [...orders].sort((a, b) =>
        new Date(b.placedAt) - new Date(a.placedAt)
    );

    main.innerHTML = `
        <div class="orders-grid">
            ${sorted.map(order => renderOrderCard(order)).join('')}
         </div>
    `;

  main.querySelectorAll('.advance-btn').forEach(btn => {
        btn.addEventListener('click', () => advanceStatus(btn.dataset.id, btn.dataset.next));
  });

}

//----------------------------------------------------------------------
function renderOrderCard(order) {
    const nextStatus = NEXT_STATUS[order.status];
    const time = new Date(order.placedAt).toLocaleTimeString();
    const isDone = order.status === 'delivered' || order.status === 'cancelled';

    return `
        <div class="order-card" data-id="${order.id}">
            <div class="order-card-head">
                <span class="order-id">${order.id}</span>
                <span class="order-status" ">${order.status}</span>
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

            ${!isDone ? `
                <div class="order-actions">
                    ${nextStatus ? `
                        <button class="advance-btn btn-primary"
                            data-id="${order.id}"
                            data-next="${nextStatus}">
                            -> Mark as ${nextStatus}
                        </button>
                    ` : ''}
                </div>
            ` : ''}
        </div>
    `;
}

//----------------------------------------------------------------------
async function advanceStatus(id, newStatus) {
    try {
        const res = await fetch(`data/orders/${id}/status`, {
            method:  'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ status: newStatus }),
        });

        if (!res.ok) throw new Error('Failed to update');
        loadOrders();

    } catch (err) {
        alert(`Error: ${err.message}`);
    }
}

//----------------------------------------------------------------------
renderOrders(orders);
setInterval(loadOrders, 10_000);