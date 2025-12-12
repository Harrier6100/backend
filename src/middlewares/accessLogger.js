const log4js = require('log4js');
log4js.configure('./src/config/log4js.json');
const logger = log4js.getLogger('access');

const accessLogger = (req, res, next) => {
    const ip = req.socket.remoteAddress.replace('::ffff:', '');
    const method = req.method;
    const request = req.originalUrl;

    res.on('finish', () => {
        const status = res.statusCode;
        logger.info(`[${ip}] ${method} ${status} ${request}`);
    });

    next();
};

module.exports = accessLogger;
