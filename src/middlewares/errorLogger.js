const log4js = require('log4js');
log4js.configure('./src/config/log4js.json');
const logger = log4js.getLogger('error');

const errorLogger = (err, req, res, next) => {
    const { method, originalUrl } = req;
    const status = err.status || 500;

    logger.error(JSON.stringify({
        requestId: req.requestId,
        ip: req.ip.replace('::ffff:', ''),
        userId: req.user?.id ?? '',
        method,
        status,
        url: originalUrl,
        error: {
            name: err.name,
            message: err.message,
            stack: err.stack,
        },
    }));

    return next(err);
};

module.exports = errorLogger;
