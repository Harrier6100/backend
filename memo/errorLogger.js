const { error: logger } = require('@/helpers/logger');

const errorLogger = (err, req, res, next) => {
    const { method, originalUrl } = req;
    const status = err.status || 500;
    const level = status >= 500 ? 'error' : 'warn';

    logger[level]({
        requestId: req.requestId,
        ip: req.ip.replace('::ffff', ''),
        userId: req.user?.id ?? '',
        method,
        status,
        url: originalUrl,
        err,
    }, err.message);

    return next(err);
};

module.exports = errorLogger;
