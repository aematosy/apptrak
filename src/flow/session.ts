import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { FlowStep, RecordedFlow } from "./types.js";

interface FlowSessionOptions {
  name: string;
  project: string;
  appId: string;
  platform: string;
}

export class FlowSession {
  private readonly flow: RecordedFlow;

  constructor(options: FlowSessionOptions) {
    this.flow = {
      schemaVersion: 1,
      name: options.name,
      project: options.project,
      appId: options.appId,
      platform: options.platform,
      startedAt: new Date().toISOString(),
      steps: [],
    };
  }

  addStep(step: Omit<FlowStep, "id" | "createdAt">): FlowStep {
    const created: FlowStep = {
      ...step,
      id: this.flow.steps.length + 1,
      createdAt: new Date().toISOString(),
    };

    this.flow.steps.push(created);

    return created;
  }

  getSteps(): readonly FlowStep[] {
    return this.flow.steps;
  }

  finish(): RecordedFlow {
    this.flow.completedAt = new Date().toISOString();

    return this.flow;
  }

  save(directory: string): string {
    mkdirSync(directory, {
      recursive: true,
    });

    const safeName = this.flow.name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const path = join(directory, `${safeName || "flow"}.flow.json`);

    writeFileSync(path, `${JSON.stringify(this.flow, null, 2)}\n`, "utf-8");

    return path;
  }
}
