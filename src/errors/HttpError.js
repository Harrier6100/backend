class HttpError extends Error {
    constructor(err, status = 500) {
        super(err);
        this.name = this.constructor.name;
        this.status = status;
        Error.captureStackTrace(this, this.constructor);
    }
};

module.exports = HttpError;
