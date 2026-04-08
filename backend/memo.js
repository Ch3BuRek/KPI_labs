function memoize(fn, maxSize = 2) {
    const cache = new Map();

    return function (...args) {
        const key = JSON.stringify(args);

        if (cache.has(key)) {
            console.log("Ja, Treffer!", args);
            return cache.get(key);
        }

        if (cache.size >= maxSize) {
            const firstKey = cache.keys().next().value;
            cache.delete(firstKey);
        }

        const result = fn(...args);
        cache.set(key, result);
        console.log("Kein Durchschlag!", args);

        return result;
    };
}

function func(num){
    return num * num;
}

const mf = memoize(func);
console.log(mf(2));
console.log(mf(3));
console.log(mf(4));