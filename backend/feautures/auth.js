import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'dev-secret';

//----------------------------------------------------------------------
export class TokenStore {
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

//----------------------------------------------------------------------
export class RateLimiter {
    #windows  = new Map();
    #limit;
    #windowMs;

    constructor(limit = 60, windowMs = 60_000) {
        this.#limit    = limit;
        this.#windowMs = windowMs;
    }

    check(key) {
        const now = Date.now();
        const hits = (this.#windows.get(key) ?? [])
            .filter(t => t > now - this.#windowMs);

        if (hits.length >= this.#limit) return false;

        hits.push(now);
        this.#windows.set(key, hits);
        return true;
    }
}

//----------------------------------------------------------------------
export class JWT {
    #secret;

    constructor(secret = SECRET) { this.#secret = secret; }

    name() { return 'JWT'; }

    sign(payload, expiresIn = '4h') {
        return jwt.sign(payload, this.#secret, { expiresIn });
    }

    verify(token) {
        return jwt.verify(token, this.#secret);
    }
}

//----------------------------------------------------------------------
export class ApiKey {
    #key;
    #header;

    constructor({ apiKey, headerName = 'x-api-key' }) {
        this.#key    = apiKey;
        this.#header = headerName;
    }

    name() { return 'ApiKey'; }

    verify(req) {
        if (req.headers[this.#header] !== this.#key) {
            throw new Error('Invalid API key');
        }
        return { role: 'service', apiKey: true };
    }
}

//----------------------------------------------------------------------
export class AuthProxy {
    #method;
    #rateLimiter;

    constructor({ method, rateLimiter }) {
        this.#method = method;
        this.#rateLimiter = rateLimiter ?? new RateLimiter(100, 60_000);
    }

    setmethod(s) { this.#method = s; }
    getmethod()  { return this.#method; }

    middleware() {
        return (req, res, next) => {
            const ip = req.headers['x-forwarded-for']?.split(',')[0].trim()
                ?? req.ip
                ?? 'unknown';

            if (!this.#rateLimiter.check(ip)) {
                return res.status(429).json({ error: 'Too many requests' });
            }

            const header = req.headers['authorization'];
            const queryToken = req.query._auth;
            const rawToken = header?.startsWith('Bearer ')
                ? header.slice(7)
                : queryToken;

            if (!rawToken) {
                return res.status(401).json({ error: 'Missing token' });
            }

            try {
                req.user = this.#method.verify(rawToken);
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

//----------------------------------------------------------------------
export function requireRole(...roles) {
    return (req, res, next) => {
        if (!roles.includes(req.user?.role)) {
            return res.status(403).json({
                error: `Required role: ${roles.join(' or ')}`
            });
        }
        next();
    };
}

//----------------------------------------------------------------------
const jwtMethod = new JWT();
const authProxy = new AuthProxy({ method: jwtMethod });
 
export const authMiddleware = authProxy.middleware();
 
export function generateToken(payload, expiresIn = '4h') {
    return jwtMethod.sign(payload, expiresIn);
}