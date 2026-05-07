import express from 'express';
import cors from 'cors';
import { menu, categories } from './data.js';
import { createOrder, getOrder, getAllOrders, updateOrderStatus, orderBus } from './service/order.js';
import { startSimulation } from './service/simulate.js';
import { getCouriers } from './service/couriers.js';
import { authMiddleware, requireRole, generateToken } from './feautures/auth.js';

const USERS = {
    admin: { password: 'admin123', role: 'admin' },
};

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static('frontend'));

app.post('/auth/login', (req, res) => {
    const { username, password } = req.body ?? {};
    const user = USERS[username];
    if (!user || user.password !== password) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = generateToken({ username, role: user.role });
    res.json({ token });
});

app.get('/data/menu', (req, res) => {
    res.json(menu);
});

//----------------------------------------------------------------------
app.post('/data/orders', (req, res) => {
    try {
        const order = createOrder(req.body);
        res.json(order);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.patch('/data/orders/:id/status', authMiddleware, requireRole('admin'), (req, res) => {
    try {
        const order = updateOrderStatus(req.params.id, req.body.status);
        res.json(order);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

//----------------------------------------------------------------------
app.get('/data/orders', authMiddleware, requireRole('admin'), (req, res) => {
    res.json(getAllOrders());
});

app.get('/data/categories', (req, res) => {
    res.json(categories);
});

app.get('/data/couriers', authMiddleware, requireRole('admin'), (req, res) => {
    res.json(getCouriers());
});

app.get('/data/orders/:id/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const current = getOrder(req.params.id);
    if (current) res.write(`data: ${JSON.stringify(current)}\n\n`);

    const unsub = orderBus.on('orderUpdate', (payload) => {
        if (payload.data.id !== req.params.id) return;
        res.write(`data: ${JSON.stringify(payload.data)}\n\n`);

        if (payload.data.status === 'delivered' || payload.data.status === 'cancelled') {
            orderBus.off('orderUpdate', unsub);
            res.end();
        }
    });

    req.on('close', () => orderBus.off('orderUpdate', unsub));
});

app.listen(3000, () => {
    startSimulation();
});