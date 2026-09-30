const HttpError = require('@/errors/HttpError');

const route404 = (req, res, next) => {
    return next(new HttpError(404, 'not_found'));
};

module.exports = route404;
