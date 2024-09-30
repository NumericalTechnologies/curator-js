import { Exception } from "node-zookeeper-client";

export function parseZooKeeperError(error: unknown) {
  if (error instanceof Exception) {
    // The 'message' property is not typed but actually exists.
    // See: https://github.com/alexguan/node-zookeeper-client/blob/eec7a566a2e9ce7f148f3092d677054bb5b1d345/lib/Exception.js#L66
    return {
      code: error.code,
      message:
        "message" in error && typeof error.message === "string"
          ? error.message
          : "",
    };
  } else if (error instanceof Error) {
    const errorMessage = error.message;
    const seperatorIndex = errorMessage.indexOf(" ");
    return {
      code: Number.parseInt(errorMessage.substring(0, seperatorIndex), 10),
      message: errorMessage.substring(seperatorIndex + 1),
    };
  } else {
    return {
      code: NaN,
      message: "",
    };
  }
}
