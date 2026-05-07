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

class RateLimiter {
    #windows  = new Map();
    #limit;
    #windowMs;

    constructor(limit = 60, windowMs = 60_000) {
        this.#limit = limit;
        this.#windowMs = windowMs;
    }

    check(key) {
        const now = Date.now();
        const cutoff = now - this.#windowMs;

        const hits = (this.#windows.get(key) ?? []).filter(t => t > cutoff);

        if (hits.length >= this.#limit) return false;

        hits.push(now);
        this.#windows.set(key, hits);
        return true;
    }
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

class ApiKey {
    #key;
    #header;

    constructor({ apiKey, headerName = 'x-api-key' }) {
        this.#key = apiKey;
        this.#header = headerName;
    }

    name() { return 'ApiKey'; }

    verify(req) {
        return req.headers[this.#header] === this.#key;
    }
}

class AuthProxy {
    #method;
    #rateLimiter;

    constructor({ method, rateLimiter }) {
        this.#method = method;
        this.#rateLimiter = rateLimiter ?? new RateLimiter(100, 60_000);
    }

    setmethod(s) { this.#method = s; }

    middleware() {
        return (req, res, next) => {
            const ip = req.ip ?? 'unknown';

            if (!this.#rateLimiter.check(ip)) {
                return res.status(429).json({ error: 'too many requests' });
            }
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

function requireAdmin(req, res, next) {
    if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Admin only' });
    }
    next();
}


const jwt = new JWT();

console.log('111111111111111');
const limiter = new RateLimiter(3, 5000);

console.log(limiter.check('127.0.0.1'));
console.log(limiter.check('127.0.0.1'));
console.log(limiter.check('127.0.0.1'));
console.log(limiter.check('127.0.0.1'));



console.log('\n222222222222222');

const auth = new AuthProxy({
    method: jwt
});

const middleware = auth.middleware();

const req = {
    ip: '127.0.0.1',
    headers: {
        authorization: `Bearer ${token}`
    },
    query: {}
};

const res = {
    status(code) {
        console.log('status:', code);

        return {
            json(data) {
                console.log('response:', data);
            }
        };
    }
};

function next() {
    console.log('next() called');
    console.log('user:', req.user);
}

middleware(req, res, next);

console.log('\n3333333333333333');

requireAdmin(
    req,
    res,
    () => console.log('admin access granted')
);