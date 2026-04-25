import express from 'express';
import cors from 'cors';
import { menu } from './data.js';
import { createOrder, getOrder, getAllOrders, updateOrderStatus } from './order.js';

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static('frontend'));

app.get('/data/menu', (req, res) => {
    res.json(menu);
});

//----------------------------------------------------------------------
app.post('/data/order', (req, res) => {
    try {
        const order = createOrder(req.body);
        res.json(order);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.patch('/data/orders/:id/status', (req, res) => {
    try {
        const order = updateOrderStatus(req.params.id, req.body.status);
        res.json(order);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.get('/data/orders', (req, res) => {
  res.json(getAllOrders());
});

app.get('/data/orders/:id', (req, res) => {
  const order = getOrder(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
});



app.listen(3000);