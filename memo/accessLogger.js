const { access: logger } = require('@/helpers/logger');

const accessLogger = (req, res, next) => {
    const { method, originalUrl } = req;
    const started = Date.now();

    res.on('finish', () => {
        logger.info({
            requestId: req.requestId,
            ip: req.ip.replace('::ffff', ''),
            userId: req.user?.id ?? '',
            method,
            status: res.statusCode,
            url: originalUrl,
            duration: Date.now() - started,
        }, 'access');
    });

    return next();
};

module.exports = accessLogger;
