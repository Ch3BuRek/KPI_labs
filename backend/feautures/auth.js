import jwt from 'jsonwebtoken';

const SECRET = 'dev-secret';

class TokenStore {
    #tokens = new Map();

    set(key, token, expiresInMs) {
        this.#tokens.set(key, {
            token,
            expiresAt: expiresInMs ? Date.now() + expiresInMs : null,
        });
    }

    get(key) {
        const entry = this.#tokens.get(key);
        if (!entry) return null;

        if (entry.expiresAt && Date.now() >= entry.expiresAt) {
            this.#tokens.delete(key);
            return null;
        }

        return entry.token;
    }

    clear(key) { this.#tokens.delete(key); }
}

class JWT {
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

class AuthProxy {
    #method;

    constructor({ method }) {
        this.#method = method;
    }

    setmethod(s) { this.#method = s; }

    middleware() {
        return (req, res, next) => {
            const header = req.headers['authorization'];
            const queryToken = req.query._auth;

            const token = header?.startsWith('Bearer ')
                ? header.slice(7)
                : queryToken ?? null;

            if (!token) {
                return res.status(401).json({ error: 'missing token' });
            }

            try {
                req.user = this.#method.verify(token);
                next();
            } catch (err) {
                const msg = err.name === 'TokenExpiredError'
                    ? 'Token expired'
                    : 'Invalid token';
                return res.status(401).json({ error: msg });
            }
        };
    }
}



const method = new JWT();

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