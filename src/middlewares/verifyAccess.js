const HttpError = require('@/errors/HttpError');

const verifyAccess = (required) => {
    return (req, res, next) => {
        const { permissions } = req.user;

        const pass = (permissions ?? []).includes(required);
        if (!pass) return next(new HttpError(403, 'forbidden'));

        return next();
    };
};

module.exports = verifyAccess;
