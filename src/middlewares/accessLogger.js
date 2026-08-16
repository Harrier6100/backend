const log4js = require('log4js');
log4js.configure('./src/config/log4js.json');
const logger = log4js.getLogger('access');

const accessLogger = (req, res, next) => {
    const { method, originalUrl } = req;
    const started = Date.now();

    res.on('finish', () => {
        logger.info(JSON.stringify({
            requestId: req.requestId,
            ip: req.ip.replace('::ffff:', ''),
            userId: req.user?.id ?? '',
            method,
            status: res.statusCode,
            url: originalUrl,
            duration: Date.now() - started,
        }));
    });

    return next();
};

module.exports = accessLogger;
