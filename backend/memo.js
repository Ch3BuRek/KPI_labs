const EvictionType = {
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
};

function createEntry(value) {
return {
    value,
    frequency: 1,
    lastUsed:  Date.now(),
    createdAt: Date.now(),
};
}

function memoize(fn, maxSize = 2, policy = "LRU") {
    const cache = new Map();

    return function (...args) {
        const key = JSON.stringify(args);

        

        if (cache.has(key)) {
            console.log("Ja, Treffer!", args);

            const entry = cache.get(key);
            entry.lastUsed = Date.now();
            return entry.value;
        }

        if (cache.size >= maxSize) {
            cache.delete(EvictionType[policy](cache));
        }

        const result = fn(...args);
        cache.set(key, createEntry(result));
        console.log("Kein Durchschlag!", args);

        return result;
    };
}

function func(num){
    return num * num;
}

const mf = memoize(func, 2, "LRU");
console.log(mf(2));
console.log(mf(3));
console.log(mf(4));