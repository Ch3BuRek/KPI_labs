import express from 'express';
import cors from 'cors';
import { menu, categories } from './data.js';
import { createOrder, getOrder, getAllOrders, updateOrderStatus, orderBus } from './service/order.js';
import { startSimulation } from './service/simulate.js';
import { getCouriers } from './service/couriers.js';
import { AuthProxy, JWT, RateLimiter, requireRole, generateToken } from './feautures/proxy.js';
import { filter, take, transform, abortable, collect } from './feautures/stream.js';

//----------------------------------------------------------------------
const apiAuth = new AuthProxy({
    method:      new JWT(),
    rateLimiter: new RateLimiter(10_000, 60_000),
}).middleware();

const loginLimiter = (() => {
    const limiter = new RateLimiter(10, 60_000);
    return (req, res, next) => {
        const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() ?? req.ip ?? 'unknown';
        if (!limiter.check(ip)) return res.status(429).json({ error: 'Too many requests' });
        next();
    };
})();

//----------------------------------------------------------------------
const USERS = {
    admin: { password: 'admin123', role: 'admin' },
};

const customers = new Map();

//----------------------------------------------------------------------
const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static('frontend'));

app.post('/auth/login', loginLimiter, (req, res) => {
    const { username, password } = req.body ?? {};
    const user = USERS[username] ?? customers.get(username);
    if (!user || user.password !== password) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = generateToken({ username, role: user.role });
    res.json({ token, role: user.role });
});

app.post('/auth/register', loginLimiter, (req, res) => {
    const { username, password } = req.body ?? {};
    if (!username?.trim() || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }
    if (USERS[username] || customers.has(username)) {
        return res.status(409).json({ error: 'Username already taken' });
    }
    customers.set(username, { password, role: 'customer' });
    const token = generateToken({ username, role: 'customer' });
    res.json({ token, role: 'customer' });
});

app.get('/data/menu', (req, res) => {
    res.json(menu);
});

//----------------------------------------------------------------------
app.post('/data/orders', apiAuth, requireRole('customer'), (req, res) => {
    try {
        const order = createOrder({ ...req.body, customerName: req.user.username });
        res.json(order);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.patch('/data/orders/:id/status', apiAuth, requireRole('admin'), (req, res) => {
    try {
        const order = updateOrderStatus(req.params.id, req.body.status);
        res.json(order);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

//----------------------------------------------------------------------
app.get('/data/orders/stats', apiAuth, requireRole('admin'), async (req, res) => {
    const ac = new AbortController();
    req.on('close', () => ac.abort());

    async function* source() { for (const o of getAllOrders()) yield o; }

    const ACTIVE = ['placed', 'confirmed', 'preparing', 'ready'];

    const orders  = await collect(abortable(source(), ac.signal));
    const active  = await collect(filter((async function*() { yield* orders; })(), o => ACTIVE.includes(o.status)));
    const done    = await collect(filter((async function*() { yield* orders; })(), o => o.status === 'delivered'));
    const revenue = await collect(transform((async function*() { yield* done; })(), o => o.total));

    res.json({
        total:     orders.length,
        active:    active.length,
        completed: done.length,
        revenue:   revenue.reduce((s, v) => s + v, 0),
    });
});

app.get('/data/orders', apiAuth, requireRole('admin'), async (req, res) => {
    const { status, limit } = req.query;
    const ac = new AbortController();
    req.on('close', () => ac.abort());

    async function* source() { for (const o of getAllOrders()) yield o; }

    let pipe = abortable(source(), ac.signal);
    if (status) pipe = filter(pipe, o => o.status === status);
    if (limit)  pipe = take(pipe, parseInt(limit));

    res.json(await collect(pipe));
});

app.get('/data/categories', (req, res) => {
    res.json(categories);
});

app.get('/data/couriers', apiAuth, requireRole('admin'), (req, res) => {
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