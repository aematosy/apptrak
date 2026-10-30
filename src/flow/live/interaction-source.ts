export type LivePlatform = "android" | "ios";

export type RawInteractionType = "tap" | "write" | "back" | "scroll";

export interface RawInteraction {
  type: RawInteractionType;

  platform: LivePlatform;

  timestamp: number;

  /**
   * Metadata efímera del dispositivo.
   *
   * Nunca debe persistirse como locator
   * ni formar parte del flow final.
   */
  pointer?: {
    x: number;
    y: number;
  };

  pointerEnd?: {
    x: number;
    y: number;
  };

  value?: string;
}

export type RawInteractionHandler = (interaction: RawInteraction) => void | Promise<void>;

export interface InteractionSource {
  readonly platform: LivePlatform;

  start(handler: RawInteractionHandler): Promise<void>;

  stop(): Promise<void>;

  isRunning(): boolean;
}
