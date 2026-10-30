export type FlowActionType =
  | "tap"
  | "write"
  | "back"
  | "scroll"
  | "assert-text"
  | "assert-visible"
  | "assert-screen";

export interface FlowLocator {
  type: string;
  value: string;
  quality?: string;
  unique?: boolean;
  strategy?: string;
}

export interface FlowScreenReference {
  name?: string;
  fingerprint?: string;
}

export interface FlowStep {
  id: number;
  type: FlowActionType;
  element?: string;
  locator?: FlowLocator;

  value?: string;
  expected?: string;

  sensitive?: boolean;

  fromScreen?: FlowScreenReference;
  toScreen?: FlowScreenReference;

  createdAt: string;
}

export interface RecordedFlow {
  schemaVersion: 1;

  name: string;

  project: string;
  appId: string;
  platform: string;

  startedAt: string;
  completedAt?: string;

  steps: FlowStep[];
}
