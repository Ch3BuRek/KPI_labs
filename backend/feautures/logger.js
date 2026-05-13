import fs from 'fs';
import path from 'path';

const LEVELS = {
    DEBUG: 0,
    INFO: 1,
    ERROR: 2,
};

function textFormatter(entry) {
    return `[${entry.timestamp}] [${entry.level}] ${entry.message}`;
}

function consoleTransport(entry, formatted) {
    console.log(formatted);
}

function fileTransport(filePath) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });

    return (entry, formatted) => {
        fs.appendFileSync(filePath, formatted + '\n');
    };
}

class Logger {
    #minLevel;
    #formatter;
    #transports;

    constructor({
        minLevel = 'DEBUG',
        formatter = textFormatter,
        transports = [consoleTransport],
    } = {}) {
        this.#minLevel = LEVELS[minLevel];
        this.#formatter = formatter;
        this.#transports = transports;
    }

    write(level, data) {
        if (LEVELS[level] < this.#minLevel) return;

        const entry = {
            timestamp: new Date().toISOString(),
            level,
            ...data,
        };

        const formatted = this.#formatter(entry);

        for (const transport of this.#transports) {
            transport(entry, formatted);
        }
    }
}

const logger = new Logger({
    transports: [
        consoleTransport,
        fileTransport('../logs/orders.log'),
    ],
});

logger.write('INFO', {
    message: 'user login',
    userId: 15,
});