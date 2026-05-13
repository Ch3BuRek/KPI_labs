import fs from 'fs';
import path from 'path';

export const LEVELS = {
    DEBUG: 0,
    INFO: 1,
    ERROR: 2,
};

export function textFormatter(entry) {
    return `[${entry.timestamp}] [${entry.level}] ${entry.message}`;
}

export function jsonFormatter(entry) {
    return JSON.stringify(entry);
}

export function consoleTransport(entry, formatted) {
    console.log(formatted);
}

export function fileTransport(filePath) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });

    return (entry, formatted) => {
        fs.appendFileSync(filePath, formatted + '\n');
    };
}

export class Logger {
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

    log(level = 'INFO') {
        const self = this;

        return function (fn) {
            const isAsync = fn.constructor.name === 'AsyncFunction';

            if (isAsync) {
                return async function (...args) {
                    const result = await fn(...args);

                    self.write(level, {
                        name: fn.name,
                        args,
                        result,
                    });

                    return result;
                };
            }

            return function (...args) {
                const result = fn(...args);

                self.write(level, {
                    name: fn.name,
                    args,
                    result,
                });

                return result;
            };
        };
    }
}

export const logger = new Logger();

export function log(level) {
    return logger.log(level);
}