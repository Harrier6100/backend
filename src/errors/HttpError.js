class HttpError extends Error {
    constructor(status = 500, code, message) {
        super(message || code);
        this.name = this.constructor.name;
        this.status = status;
        this.code = code;
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = HttpError;
