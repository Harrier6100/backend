const cacheControl = (req, res, next) => {
    if (req.path.startsWith('/api')) {
        res.setHeader('Cache-Control', 'no-store');
    }

    return next();
};

module.exports = cacheControl;
