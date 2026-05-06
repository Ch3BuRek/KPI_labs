import jwt from 'jsonwebtoken';

const SECRET = 'dev-secret';

class JWt {
    #secret;

    constructor(secret = 'dev-secret') {
        this.#secret = secret;
    }

    sign(payload, expiresIn = '4h') {
        return jwt.sign(payload, this.#secret, { expiresIn });
    }

    verify(token) {
        return jwt.verify(token, this.#secret);
    }
}

function authMiddleware(req, res, next) {
    const header = req.headers['authorization'];

    if (!header) {
        return res.status(401).json({ error: 'missing token' });
    }

    const token = header.replace('Bearer ', '');

    try {
        const decoded = method.verify(token);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'invalid token' });
    }
}



const method = new JWt();

try {
    jwt.verify('some.fake.token', 'wrong-secret');
} catch (err) {
    console.log(err.name);
    console.log(err.message);
}

const expired = jwt.sign({ id: 1 }, SECRET, { expiresIn: '1ms' });
    await new Promise(r => setTimeout(r, 10));
try {
    method.verify(expired);
} catch (err) {
    console.log(err.name);
    console.log(err.message);
}