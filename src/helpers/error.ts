export function parseZooKeeperError(error: Error) {
  const errorMessage = error.message;
  const seperatorIndex = errorMessage.indexOf(" ");
  return {
    code: Number.parseInt(errorMessage.substring(0, seperatorIndex), 10),
    message: errorMessage.substring(seperatorIndex + 1),
  };
}
