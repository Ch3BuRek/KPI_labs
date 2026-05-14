import fs from 'fs';
import path from 'path';

//----------------------------------------------------------------------
export const LEVELS = { 
    DEBUG: 0,
    INFO: 1,
    ERROR: 2,
    SILENT: 3 
};

//----------------------------------------------------------------------
export function textFormatter({ timestamp, level, name, args, result, error, duration }) {
    const parts = [`[${timestamp}] [${level}] ${name}`];
    if (duration !== undefined) parts.push(`(${duration}ms)`);
    if (args !== undefined) parts.push(`args=${JSON.stringify(args)}`);
    if (result !== undefined) parts.push(`=> ${JSON.stringify(result)}`);
    if (error) parts.push(`THREW ${error.message}`);
    return parts.join('  ');
}

export function jsonFormatter(entry) {
    const out = { ...entry };
    if (out.error) out.error = { message: out.error.message, stack: out.error.stack };
    return JSON.stringify(out);
}

export function consoleTransport(entry, formatted) {
    (entry.level === 'ERROR' ? console.error : console.log)(formatted);
}

export function sseTransport(publish) {
    return (entry, formatted) => publish({ ...entry, formatted });
}

export function fileTransport(filePath) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    return (_entry, formatted) => fs.appendFileSync(filePath, formatted + '\n');
}

//----------------------------------------------------------------------
export class Logger {
    #minLevel;
    #formatter;
    #transports;

    constructor({ minLevel = 'DEBUG', formatter = textFormatter, transports = [consoleTransport] } = {}) {
        this.#minLevel = LEVELS[minLevel] ?? 0;
        this.#formatter = formatter;
        this.#transports = transports;
    }

    addTransport(fn) {
        this.#transports.push(fn);
        return this;
    }

    write(level, data) {
        if ((LEVELS[level] ?? 0) < this.#minLevel) return;
        const entry     = { timestamp: new Date().toISOString(), level, ...data };
        const formatted = this.#formatter(entry);
        for (const t of this.#transports) t(entry, formatted);
    }


    log(levelOrOpts = 'INFO') {
        const opts = typeof levelOrOpts === 'string' ? { level: levelOrOpts } : levelOrOpts;
        const { level = 'INFO', timing = false } = opts;
        const errOnly = level === 'ERROR';
        const self = this;

        return function wrap(fn) {
            const name = fn.name || 'anonymous';
            const isAsync = fn.constructor.name === 'AsyncFunction';

            if (isAsync) {
                return async function (...args) {
                    const start = Date.now();
                    try {
                        const result = await fn.apply(this, args);
                        if (!errOnly) {
                            self.write(level, {
                                name, args, result,
                                ...(timing && { duration: Date.now() - start }),
                            });
                        }
                        return result;
                    } catch (error) {
                        self.write('ERROR', {
                            name, args, error,
                            ...(timing && { duration: Date.now() - start }),
                        });
                        throw error;
                    }
                };
            }

            return function (...args) {
                const start = Date.now();
                try {
                    const result = fn.apply(this, args);
                    if (!errOnly) {
                        self.write(level, {
                            name, args, result,
                            ...(timing && { duration: Date.now() - start }),
                        });
                    }
                    return result;
                } catch (error) {
                    self.write('ERROR', {
                        name, args, error,
                        ...(timing && { duration: Date.now() - start }),
                    });
                    throw error;
                }
            };
        };
    }
}

export const logger = new Logger();

export function log(levelOrOpts) {
    return logger.log(levelOrOpts);
}