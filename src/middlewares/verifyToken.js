const jsonwebtoken = require('jsonwebtoken');
const HttpError = require('@/errors/HttpError');

const verifyToken = (req, res, next) => {
    const token = req.headers.authorization;
    if (!token) return next(new HttpError(req.t('MESSAGE.API.NO_TOKEN'), 401));

    jsonwebtoken.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) return next(new HttpError(req.t('MESSAGE.API.INVALID_TOKEN'), 401));

        req.user = decoded;
        next();
    });
};

module.exports = verifyToken;
