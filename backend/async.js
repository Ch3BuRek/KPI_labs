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

function slowFn(x, index, callback) {
    setTimeout(() => {
        console.log(`slowFn i=${x}`);
        callback(null, x * 2);
    }, 100);
}

const controller = new AbortController();

setTimeout(() => controller.abort(), 50);

async([1,2,3], slowFn, console.log, controller.signal);