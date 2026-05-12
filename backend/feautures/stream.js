export async function* filter(source, predicate) {
    for await (const record of source) {
        if (predicate(record)) yield record;
    }
}

export async function* transform(source, mapFn) {
    for await (const record of source) {
        yield mapFn(record);
    }
}

export async function* batch(source, size) {
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

export async function* take(source, limit) {
    let count = 0;
    for await (const record of source) {
        yield record;
        if (++count >= limit) return;
    }
}

export async function* tap(source, fn) {
    for await (const record of source) {
        fn(record);
        yield record;
    }
}

export async function* abortable(source, signal) {
    for await (const record of source) {
        if (signal.aborted) return;
        yield record;
    }
}


export async function collect(pipeline) {
    const results = [];
    for await (const item of pipeline) results.push(item);
    return results;
}
