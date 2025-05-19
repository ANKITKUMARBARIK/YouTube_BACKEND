class ApiError extends Error {
    constructor(
        statusCode,
        message = "Something went wrong",
        errors = [],
        data = null,
        stack = ""
    ) {
        super(message); // Error class ko message do
        this.statusCode = statusCode;
        this.success = false; // API response ke liye useful flag
        this.errors = errors; // extra error details
        this.data = data; // optional data placeholder

        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export default ApiError;
