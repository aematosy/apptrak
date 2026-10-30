import type { LiveSnapshot } from "./types.js";

export interface SnapshotProvider {
  capture(): Promise<LiveSnapshot>;
}
