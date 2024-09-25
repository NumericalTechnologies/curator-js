"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LockError = exports.LockErrorCodes = void 0;
exports.LockErrorCodes = {
    UNEXPECTED_ERROR: 10000000,
    OPERATION_TIMED_OUT: 10000001,
    NOT_CONNECTED: 10000002,
};
class LockError extends Error {
    constructor(code, message) {
        super(message);
        this.code = code;
    }
}
exports.LockError = LockError;
