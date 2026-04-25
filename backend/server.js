import express from 'express';
import cors from 'cors';
import { menu } from './data.js';

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static('frontend'));

app.get('/data/menu', (req, res) => {
    res.json(menu);
});

//----------------------------------------------------------------------
app.post('/data/order', (req, res) => {
    const { cart, customerName, deliveryAddress } = req.body;

    if (!cart?.length || !deliveryAddress) {
        return res.status(400);
    }

    const order = {
        id: `ORD-${Date.now()}`,
        cart,
        customerName,
        deliveryAddress,
        status: 'placed',
        placedAt: new Date().toISOString(),
    };

    console.log(order);
    res.json(order);
});


app.listen(3000);