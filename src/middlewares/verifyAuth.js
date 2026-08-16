const jsonwebtoken = require('jsonwebtoken');
const HttpError = require('@/errors/HttpError');

const verifyAuth = (req, res, next) => {
    const token = req.headers.authorization;
    if (!token) return next(new HttpError(401, 'unauthorized'));

    jsonwebtoken.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) return next(new HttpError(401, 'invalid_token'));
        req.user = decoded;
        return next();
    });
};

module.exports = verifyAuth;
