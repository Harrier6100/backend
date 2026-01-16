const jsonwebtoken = require('jsonwebtoken');
const HttpError = require('@/errors/HttpError');

const verifyToken = (req, res, next) => {
    const token = req.headers.authorization;
    if (!token) return next(new HttpError('ERROR.UNAUTHORIZED', 401));

    jsonwebtoken.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) return next(new HttpError('ERROR.TOKEN_EXPIRED', 401));
        req.user = decoded;
        next();
    });
};

module.exports = verifyToken;
