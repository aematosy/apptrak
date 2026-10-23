import pino from "pino";
import pinoPretty from "pino-pretty";

const isDev = process.env.NODE_ENV !== "production";

export const logger = pino(
  {
    level: process.env.LOG_LEVEL || (isDev ? "debug" : "info"),
  },
  isDev
    ? pinoPretty({
        colorize: true,
        translateTime: "SYS:standard",
        ignore: "pid,hostname",
      })
    : undefined
);
