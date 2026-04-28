function async(arr, fn, done, signal) {
    const results = [];
    let completed = 0;
    let aborted = false;

    if (arr.length === 0) return done(null, []);

    arr.forEach((item, index) => {
        if (signal?.aborted || aborted) {
            if (!aborted) {
                aborted = true;
                done(new Error("aborted"), null);
            }
            return;
        }

        fn(item, index, (err, result) => {
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

    signal?.addEventListener("abort", () => {
        if (!aborted) {
            aborted = true;
            done(new Error("aborted"), null);
        }
    });
}

//----------------------------------------------------------------------
function asyncPromise(arr, fn, signal) {

    return new Promise((resolve, reject) => {

        if (signal?.aborted) return reject(new Error("aborted"));
        if (arr.length === 0) return resolve([]);
        
        const onAbort = () => reject(new Error("aborted"));
        signal?.addEventListener("abort", onAbort, { once: true });

        const promises = arr.map((item, index) => {
            if (signal?.aborted) return Promise.reject(new Error("aborted"));
            return fn(item, index);
        });

         Promise.all(promises)
        .then(res => {
            signal?.removeEventListener("abort", onAbort);
            resolve(res);
        })
        .catch(err => {
            signal?.removeEventListener("abort", onAbort);
            reject(err);
        });
    });
}

//----------------------------------------------------------------------
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

//----------------------------------------------------------------------