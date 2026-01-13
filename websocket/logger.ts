import pino from 'pino';

const isDevelopment = process.env.NODE_ENV !== 'production';

const createLogger = () => {
    const level = process.env.LOG_LEVEL || (isDevelopment ? 'trace' : 'info');

    if (isDevelopment) {
        return pino({
            level,
            transport: {
                target: 'pino-pretty',
                options: {
                    colorize: true,
                    translateTime: 'SYS:standard',
                    ignore: 'pid,hostname',
                },
            },
        });
    }

    return pino({ level });
};

export const logger = createLogger();

export default logger;
