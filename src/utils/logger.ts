// src/utils/logger.ts

const getTimestamp = (): string => new Date().toISOString();

const log = (level: string, message: string, ...args: any[]) => {
    const timestamp = getTimestamp();
    console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`, ...args);
};

export const logger = {
    info: (message: string, ...args: any[]) => {
        log('info', message, ...args);
    },
    warn: (message: string, ...args: any[]) => {
        log('warn', message, ...args);
    },
    error: (message: string, ...args: any[]) => {
        log('error', message, ...args);
    },
};
