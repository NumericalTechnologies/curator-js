import { READ_LOCK_PATH_NAME, WRITE_LOCK_PATH_NAME } from "../constants";

const groupName = "sequenceNo";

function getSequenceNumberFromGroup(regexExecArray: RegExpExecArray | null) {
  const sequenceNumberString = regexExecArray?.groups?.[groupName];
  if (typeof sequenceNumberString !== "string") return NaN;
  return Number.parseInt(sequenceNumberString, 10) ?? NaN;
}
export function getReadLockNodeSequenceNumber(node: string) {
  return getSequenceNumberFromGroup(new RegExp(`${READ_LOCK_PATH_NAME}(?<${groupName}>\\d{10})$`).exec(node));
}

export function getWriteLockNodeSequenceNumber(node: string) {
  return getSequenceNumberFromGroup(new RegExp(`${WRITE_LOCK_PATH_NAME}(?<${groupName}>\\d{10})$`).exec(node));
}

export function getNodeSequenceNumber(node: string) {
  let sequenceNumber = getReadLockNodeSequenceNumber(node);
  if (Number.isNaN(sequenceNumber)) {
    sequenceNumber = getWriteLockNodeSequenceNumber(node);
  }
  return sequenceNumber;
}
