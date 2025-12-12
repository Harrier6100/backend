const HttpError = require('@/errors/HttpError');

const requirePermission = (...permissions) => {
    return (req, res, next) => {
        if (req.user.role === 'admin') {
            return next();
        }

        const ok = req.user.permissions.some(perm => permissions.includes(perm));
        if (!ok) {
            return next(new HttpError(req.t('MESSAGE.API.FORBIDDEN_PERMISSION'), 403));
        }

        next();
    };
};

module.exports = requirePermission;
