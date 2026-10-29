import { type Key, emitKeypressEvents } from "node:readline";

export interface EscapeController {
  consume(): boolean;
  dispose(): void;
}

export function createEscapeController(): EscapeController {
  let requested = false;

  if (!process.stdin.isTTY) {
    return {
      consume: () => false,
      dispose: () => undefined,
    };
  }

  emitKeypressEvents(process.stdin);

  const onKeypress = (_value: string, key: Key): void => {
    if (key.name === "escape") {
      requested = true;
    }
  };

  process.stdin.on("keypress", onKeypress);

  return {
    consume(): boolean {
      if (!requested) {
        return false;
      }

      requested = false;
      return true;
    },

    dispose(): void {
      process.stdin.off("keypress", onKeypress);
    },
  };
}
