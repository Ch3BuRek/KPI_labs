import { Queue } from "../backend/queue.js";
import { memoize, createEntry, EvictionType } from "../backend/memo.js";

const mf = memoize((num) => num * num, {
    policy: "CUSTOM",
    maxSize: 3,
    customEvict: (cache) => {
        let longestKey = null;
        for (const key of cache.keys()) {
            if (!longestKey || key.length > longestKey.length) longestKey = key;
        }
        return longestKey;
    },
});
mf(1);
mf(10);
mf(100);
mf(1000);
mf(1);
mf(10);
mf(100);
mf(1000);
