const requirePermission = (...permissions) => {
    return (req, res, next) => {
        const can = req.user.permissions.some(perm => permissions.includes(perm));
        if (!can) return next(new HttpError('ERROR.FORBIDDEN', 403));
        next();
    };
};

module.exports = requirePermission;
