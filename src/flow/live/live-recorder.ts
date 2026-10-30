import { detectUiChange, screenChanged } from "./diff.js";
import { resolveInteraction } from "./interaction-resolver.js";
import type { RawInteraction } from "./interaction-source.js";
import type { SnapshotProvider } from "./snapshot-provider.js";
import type { LiveDetectedEvent, LiveSnapshot } from "./types.js";

export interface CandidateAssertion {
  type: "text-visible" | "screen";

  value: string;

  confidence: number;

  reason: string;
}

export interface LiveTimelineEntry {
  id: number;

  interaction: RawInteraction;

  event: LiveDetectedEvent | null;

  before: LiveSnapshot;

  after: LiveSnapshot;

  assertions: CandidateAssertion[];

  recordedAt: string;
}

export interface LiveRecorderOptions {
  snapshotProvider: SnapshotProvider;

  stabilizationMs?: number;
}

export class LiveRecorder {
  private readonly snapshotProvider: SnapshotProvider;

  private readonly stabilizationMs: number;

  private running = false;

  private currentSnapshot: LiveSnapshot | null = null;

  private readonly timeline: LiveTimelineEntry[] = [];

  constructor(options: LiveRecorderOptions) {
    this.snapshotProvider = options.snapshotProvider;

    this.stabilizationMs = options.stabilizationMs ?? 500;
  }

  async start(): Promise<void> {
    this.currentSnapshot = await this.snapshotProvider.capture();

    this.running = true;
  }

  stop(): void {
    this.running = false;
  }

  isRunning(): boolean {
    return this.running;
  }

  getTimeline(): readonly LiveTimelineEntry[] {
    return this.timeline;
  }

  getCurrentSnapshot(): LiveSnapshot | null {
    return this.currentSnapshot;
  }

  async processInteraction(interaction: RawInteraction): Promise<LiveTimelineEntry> {
    if (!this.running) {
      throw new Error("LiveRecorder no está iniciado");
    }

    const before = this.currentSnapshot ?? (await this.snapshotProvider.capture());

    if (this.stabilizationMs > 0) {
      await new Promise<void>((resolve) => {
        setTimeout(resolve, this.stabilizationMs);
      });
    }

    const after = await this.snapshotProvider.capture();

    const event = resolveInteraction(interaction, before, after);

    const assertions = this.detectAssertions(before, after);

    const entry: LiveTimelineEntry = {
      id: this.timeline.length + 1,

      interaction,

      event,

      before,

      after,

      assertions,

      recordedAt: new Date().toISOString(),
    };

    this.timeline.push(entry);

    this.currentSnapshot = after;

    return entry;
  }

  private detectAssertions(before: LiveSnapshot, after: LiveSnapshot): CandidateAssertion[] {
    const result: CandidateAssertion[] = [];

    const change = detectUiChange(before, after);

    for (const text of change.addedTexts) {
      result.push({
        type: "text-visible",
        value: text,
        confidence: 0.85,
        reason: "texto nuevo detectado después de la interacción",
      });
    }

    if (screenChanged(before, after) && after.screen.fingerprint) {
      result.push({
        type: "screen",
        value: after.screen.fingerprint,
        confidence: 1,
        reason: "fingerprint de pantalla cambió después de la interacción",
      });
    }

    return result;
  }
}
