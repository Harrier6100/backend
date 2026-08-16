const HttpError = require('@/errors/HttpError');

const errorHandler = (err, req, res, next) => {
    if (res.headersSent) return next(err);

    if (err instanceof HttpError) {
        return res.status(err.status).json({
            status: err.status,
            code: err.code,
            message: err.message,
            requestId: req.requestId,
        });
    }

    return res.status(500).json({
        status: 500,
        code: 'server_error',
        message: 'server_error',
        requestId: req.requestId,
    });
};

module.exports = errorHandler;
