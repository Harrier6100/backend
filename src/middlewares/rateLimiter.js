const rateLimit = require('express-rate-limit');
const HttpError = require('@/errors/HttpError');

const rateLimiter = (options) => rateLimit({
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next) => {
        return next(new HttpError(429, 'too_many_requests'));
    },
    ...options,
});

module.exports = rateLimiter;
