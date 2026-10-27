const pino = require('pino');

const createLogger = (name) => pino(
    {
        level: process.env.LOG_LEVEL || 'info',
        timestamp: pino.stdTimeFunctions.isoTime,
        formatters: {
            level: (label) => ({ level: label }),
        },
    },
    pino.transport({
        target: 'pino-roll',
        options: {
            file: `logs/${name}`,
            extension: '.log',
            dateFormat: 'yyyy-MM-dd',
            frequency: 'daily',
            size: '20m',
            limit: { count: 14, removeOtherLogFiles: true },
            mkdir: true,
        },
    })
);

module.exports = {
    access: createLogger('access'),
    error: createLogger('error'),
};
