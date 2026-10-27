const crypto = require('crypto');

const requestId = (req, res, next) => {
    const headerId = req.get('X-Request-Id');
    req.requestId = headerId && /^[\w-]{1,64}$/.test(headerId)
        ? headerId
        : crypto.randomUUID();
    res.setHeader('X-Request-Id', req.requestId);
    return next();
};

module.exports = requestId;
