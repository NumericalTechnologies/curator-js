"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNodeSequenceNumber = exports.getWriteLockNodeSequenceNumber = exports.getReadLockNodeSequenceNumber = void 0;
const constants_1 = require("../constants");
const groupName = "sequenceNo";
function getSequenceNumberFromGroup(regexExecArray) {
    var _a, _b;
    const sequenceNumberString = (_a = regexExecArray === null || regexExecArray === void 0 ? void 0 : regexExecArray.groups) === null || _a === void 0 ? void 0 : _a[groupName];
    if (typeof sequenceNumberString !== "string")
        return NaN;
    return (_b = Number.parseInt(sequenceNumberString, 10)) !== null && _b !== void 0 ? _b : NaN;
}
function getReadLockNodeSequenceNumber(node) {
    return getSequenceNumberFromGroup(new RegExp(`${constants_1.READ_LOCK_PATH_NAME}(?<${groupName}>\\d{10})$`).exec(node));
}
exports.getReadLockNodeSequenceNumber = getReadLockNodeSequenceNumber;
function getWriteLockNodeSequenceNumber(node) {
    return getSequenceNumberFromGroup(new RegExp(`${constants_1.WRITE_LOCK_PATH_NAME}(?<${groupName}>\\d{10})$`).exec(node));
}
exports.getWriteLockNodeSequenceNumber = getWriteLockNodeSequenceNumber;
function getNodeSequenceNumber(node) {
    let sequenceNumber = getReadLockNodeSequenceNumber(node);
    if (Number.isNaN(sequenceNumber)) {
        sequenceNumber = getWriteLockNodeSequenceNumber(node);
    }
    return sequenceNumber;
}
exports.getNodeSequenceNumber = getNodeSequenceNumber;
