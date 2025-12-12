const HttpError = require('@/errors/HttpError');

const requireRole = (...roles) => {
    return (req, res, next) => {
        if (req.user.role === 'admin') {
            return next();
        }

        if (!roles.includes(req.user.role)) {
            return next(new HttpError(req.t('MESSAGE.API.FORBIDDEN_ROLE'), 403));
        }

        next();
    };
};

module.exports = requireRole;
