const errorHandler = (err, req, res, next) => {
    if (res.headerSent) return next(err);

    if (err instanceof HttpError) {
        return res.status(err.status).json({
            message: err.message,
        });
    }

    console.error(err);
    return res.status(500).json({
        message: err.message,
    });
};

module.exports = errorHandler;
