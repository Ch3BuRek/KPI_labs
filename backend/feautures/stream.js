async function* logDataSource(totalRecords, delayMs = 0) {
    const levels = ["INFO", "WARN", "ERROR"];

    for (let i = 1; i <= totalRecords; i++) {

        if (delayMs > 0) {
            await new Promise(r => setTimeout(r, delayMs));
        }

        yield {
            id: i,
            timestamp: new Date().toISOString(),
            level: levels[Math.floor(Math.random() * levels.length)],
            message: `#${i} W`
        };
    }
}

async function* filter(source, predicate) {
    for await (const record of source) {

        if (predicate(record)) {
            yield record;
        }

    }
}

async function* transform(source, mapFn) {
    for await (const record of source) {
        yield mapFn(record);
    }
}

async function* batch(source, size) {
    let chunk = [];
    for await (const record of source) {
        chunk.push(record);
        if (chunk.length === size) {
            yield chunk;
            chunk = [];
        }
    }
    if (chunk.length > 0) yield chunk;
}

async function* take(source, limit) {
    let count = 0;
    for await (const record of source) {
        yield record;
        if (++count >= limit) return;
    }
}

async function* tap(source, fn) {
    for await (const record of source) {
        fn(record);
        yield record;
    }
}

(async () => {

    const source = logDataSource(100);

    const limited = take(source, 5);

    for await (const item of limited) {
        console.log(item.id);
    }

    const source2 = logDataSource(5);

    const pipeline = tap(
        source2,
        r => console.log("DEBUG:", r.id)
    );

    for await (const record of pipeline) {
        console.log("FINAL:", record.id);
    }

})();