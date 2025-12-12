const cacheControl = (req, res, next) => {
    if (req.method === 'GET' && req.path.startsWith('/api')) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
        res.setHeader('Expires', new Date(0).toUTCString());
        res.setHeader('Pragma', 'no-cache');
    }

    next();
};

module.exports = cacheControl;
