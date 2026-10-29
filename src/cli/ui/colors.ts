export const COLORS = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",

  white: "\x1b[37m",
  gray: "\x1b[90m",

  cyan: "\x1b[38;5;51m",
  blue: "\x1b[38;5;45m",
  violet: "\x1b[38;5;99m",
  magenta: "\x1b[38;5;207m",

  green: "\x1b[38;5;82m",
  yellow: "\x1b[38;5;220m",
  red: "\x1b[38;5;196m",
};

export function paint(
  text: string,
  ...styles: string[]
): string {
  return `${styles.join("")}${text}${COLORS.reset}`;
}
