const crypto = require('crypto');

const requestId = (req, res, next) => {
    req.requestId = crypto.randomUUID();
    return next();
};

module.exports = requestId;
