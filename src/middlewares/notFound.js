const HttpError = require('@/errors/HttpError');

const notFound = (req, res, next) => {
    return next(new HttpError(404, 'not_found'));
};

module.exports = notFound;
