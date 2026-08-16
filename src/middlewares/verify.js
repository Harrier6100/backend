const verifyAuth = require('./verifyAuth');
const verifyAccess = require('./verifyAccess');

const verify = (required) => required
    ? [verifyAuth, verifyAccess(required)]
    : [verifyAuth];

module.exports = verify;
