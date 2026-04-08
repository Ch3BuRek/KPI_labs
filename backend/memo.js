export const EvictionType = {
    LRU: (cache) => {
    let oldestKey = null, oldestTime = Infinity;
        for (const [key, entry] of cache) {
            if (entry.lastUsed < oldestTime) {
                oldestTime = entry.lastUsed;
                oldestKey  = key;
            }
        }
        return oldestKey;
    },

    LFU: (cache) => {
    let rarestKey = null, lowestFreq = Infinity;
        for (const [key, entry] of cache) {
            if (entry.frequency < lowestFreq) {
                lowestFreq = entry.frequency;
                rarestKey  = key;
            }
        }
        return rarestKey;
    },

    TTL: (ms) => (cache) => {
    const now = Date.now();
        for (const [key, entry] of cache) {
            if (now - entry.createdAt >= ms) return key;
        }
        return EvictionType.LRU(cache);
    },

    CUSTOM: (evictFn) => evictFn,
};

export function createEntry(value) {
return {
    value,
    frequency: 1,
    lastUsed:  Date.now(),
    createdAt: Date.now(),
};
}

export function memoize(fn, options = {}) {
    const { maxSize = 2, policy = "LRU", ms = null } = options;
    const cache = new Map();

    let type;
        if (policy === "TTL" || ms) {
            type = EvictionType.TTL(ms);
        } else {
            type = EvictionType[policy];
        }

    return function (...args) {
        const key = JSON.stringify(args);

        if (policy === "TTL" && ms && cache.has(key)) {
            const entry = cache.get(key);
            if (Date.now() - entry.createdAt >= ms) {
                cache.delete(key);
            }
        }

        if (cache.has(key)) {
            console.log("Ja, Treffer!", args);

            const entry = cache.get(key);
            entry.lastUsed = Date.now();
            return entry.value;
        }

        if (cache.size >= maxSize) {
            cache.delete(type(cache));
        }

        const result = fn(...args);
        cache.set(key, createEntry(result));
        console.log("Kein Durchschlag!", args);

        return result;
    };
}
