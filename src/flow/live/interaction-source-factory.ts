import { AndroidInteractionSource } from "./android/android-interaction-source.js";
import type { InteractionSource, LivePlatform } from "./interaction-source.js";
import { IOSInteractionSource } from "./ios/ios-interaction-source.js";

export interface InteractionSourceFactoryOptions {
  platform: LivePlatform;

  deviceId: string;
}

export function createInteractionSource(
  options: InteractionSourceFactoryOptions,
): InteractionSource {
  if (options.platform === "android") {
    return new AndroidInteractionSource({
      serial: options.deviceId,
    });
  }

  return new IOSInteractionSource();
}
