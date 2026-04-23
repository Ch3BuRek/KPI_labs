function async(arr, fn, done, signal) {
    const results = [];
    let completed = 0;
    let aborted = false;

    arr.forEach((item, index) => {
        console.log(`in i=${item}`);

        if (signal?.aborted || aborted) {
            if (!aborted) {
                aborted = true;
                done(new Error("aborted"), null);
            }
            return;
        }

        fn(item, index, (err, result) => {
            console.log(`back i=${item}`);
            if (signal?.aborted || aborted) {
                if (!aborted) {
                    aborted = true;
                    done(new Error("aborted"), null);
                }
                return;
            }
            
            if (err) {
                aborted = true;
                return done(err, null);
            }

            results[index] = result;
            completed++;

            if (completed === arr.length) {
                done(null, results);
            }
        });
    });
}

function asyncPromise(arr, fn, signal) {

    return new Promise((resolve, reject) => {

        if (signal?.aborted) {
            return reject(new Error("Operation aborted"));
        }
        
        const onAbort = () => {
            console.log("abort, promise rejected");
            reject(new Error("aborted"));
        };

        signal?.addEventListener("abort", onAbort, { once: true });

        const promises = arr.map((item, index) => {
            return fn(item, index);
        });

         Promise.all(promises)
        .then(res => {
            console.log("resolved");
            resolve(res);
        })
        .catch(err => {
            console.log("rejected");
            reject(err);
        });
    });
}

async function asyncAwait(arr, fn, signal) {
    if (signal?.aborted) throw new Error("Operation aborted");
    if (arr.length === 0) return [];

    const results = [];

    for (let i = 0; i < arr.length; i++) {
        if (signal?.aborted) throw new Error("Operation aborted");
        const result = await fn(arr[i], i);
        results.push(result);
    }

    return results;
}

function slowFn(x, index, callback) {
    setTimeout(() => {
        console.log(`slowFn i=${x}`);
        callback(null, x * 2);
    }, 100);
}

(async () => {
    const controller = new AbortController();

    setTimeout(() => {
        console.log("aborting...");
        controller.abort();
    }, 250);

    try {
        const results = await asyncPromise([1, 2, 3], (x) => slowFn(x, 100), controller.signal);
        console.log("results", results);
    } catch (err) {
        console.error("error", err.message);
    }
})();