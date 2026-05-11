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

(async () => {

    const source = logDataSource(10);

    const errorsOnly = filter(
        source,
        record => record.level === "ERROR"
    );

    for await (const record of errorsOnly) {
        console.log(record);
    }

})();