function async(arr, fn, done, signal) {
    const results = [];
    let completed = 0;
    let aborted = false;

    arr.forEach((item, i) => {
        console.log(`in i=${item}`);

        fn(item, i, (err, result) => {
        console.log(`back i=${item}`);
            if (signal?.aborted) {
                console.log("aborting");
                return done(new Error("aborted"));
            }
            
            if (err) return done(err);

            results[i] = result;
            completed++;

            if (completed === arr.length) {
                console.log("done");
                done(null, results);
            }
        });
    });
}

function slowFn(x, i, callback) {
    setTimeout(() => {
        console.log(`slowFn i=${x}`);
        callback(null, x * 2);
    }, 100);
}

const controller = new AbortController();

setTimeout(() => controller.abort(), 50);

async([1,2,3], slowFn, console.log, controller.signal);