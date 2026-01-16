const requireRole = (...roles) => {
    return (req, res, next) => {
        const can = roles.includes(req.user.role);
        if (!can) return next(new HttpError('ERROR.FORBIDDEN', 403));
        next();
    };
};

module.exports = requireRole;
