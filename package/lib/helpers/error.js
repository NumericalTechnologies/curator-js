"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseZooKeeperError = void 0;
function parseZooKeeperError(error) {
    const errorMessage = error.message;
    const seperatorIndex = errorMessage.indexOf(" ");
    return {
        code: Number.parseInt(errorMessage.substring(0, seperatorIndex), 10),
        message: errorMessage.substring(seperatorIndex + 1),
    };
}
exports.parseZooKeeperError = parseZooKeeperError;
