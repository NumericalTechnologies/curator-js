export declare const LockErrorCodes: {
    readonly UNEXPECTED_ERROR: 10000000;
    readonly OPERATION_TIMED_OUT: 10000001;
    readonly NOT_CONNECTED: 10000002;
};
export declare class LockError extends Error {
    readonly code: typeof LockErrorCodes[keyof typeof LockErrorCodes];
    constructor(code: typeof LockErrorCodes[keyof typeof LockErrorCodes], message?: string);
}
