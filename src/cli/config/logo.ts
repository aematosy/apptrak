const ANSI = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  cyan: "\x1b[38;5;51m",
  blue: "\x1b[38;5;45m",
  violet: "\x1b[38;5;99m",
  magenta: "\x1b[38;5;207m",
};

const FULL_LOGO = [
  " █████╗ ██████╗ ██████╗ ████████╗██████╗  █████╗ ██╗  ██╗",
  "██╔══██╗██╔══██╗██╔══██╗╚══██╔══╝██╔══██╗██╔══██╗██║ ██╔╝",
  "███████║██████╔╝██████╔╝   ██║   ██████╔╝███████║█████╔╝ ",
  "██╔══██║██╔═══╝ ██╔═══╝    ██║   ██╔══██╗██╔══██║██╔═██╗ ",
  "██║  ██║██║     ██║        ██║   ██║  ██║██║  ██║██║  ██╗",
  "╚═╝  ╚═╝╚═╝     ╚═╝        ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝",
];

const COMPACT_LOGO = ["APPTRAK"];

function colorLine(line: string, index: number, total: number): string {
  const palette = [ANSI.cyan, ANSI.blue, ANSI.violet, ANSI.magenta];

  const paletteIndex = Math.min(
    palette.length - 1,
    Math.floor((index / Math.max(1, total - 1)) * palette.length),
  );

  return `${ANSI.bold}${palette[paletteIndex]}${line}${ANSI.reset}`;
}

function renderLogo(lines: string[]): string {
  return lines.map((line, index) => colorLine(line, index, lines.length)).join("\n");
}

export function getLogo(compact = false): string {
  return renderLogo(compact ? COMPACT_LOGO : FULL_LOGO);
}
