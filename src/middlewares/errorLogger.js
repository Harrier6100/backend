const log4js = require('log4js');
log4js.configure('./src/config/log4js.json');
const logger = log4js.getLogger('error');

const errorLogger = (err, req, res, next) => {
    const status = err.status || res.statusCode;
    if (status === 500) {
        const ip = req.socket.remoteAddress.replace('::ffff:', '');
        const method = req.method;
        const request = req.originalUrl;
        logger.error(`[${ip}] ${method} ${status} ${request}\n${err.stack || err.toString()}`);
    }

    next(err);
};

module.exports = errorLogger;
