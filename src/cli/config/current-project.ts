import type { ExplorationConfig } from "../../config/schemas.js";

export type ProjectConfig = ExplorationConfig;

export type ProjectSource = "preset" | "wizard" | "file";

export interface ProjectMeta {
  name: string;
  path?: string;
  preset?: string;
  source: ProjectSource;
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

class CurrentProject {
  private config: ProjectConfig | null = null;
  private meta: ProjectMeta | null = null;

  setProject(config: ProjectConfig, meta: ProjectMeta): void {
    this.config = structuredClone(config);
    this.meta = { ...meta };
  }

  getConfig(): ProjectConfig | null {
    return this.config;
  }

  getMeta(): ProjectMeta | null {
    return this.meta;
  }

  hasProject(): boolean {
    return this.config !== null;
  }

  clear(): void {
    this.config = null;
    this.meta = null;
  }

  getFixtureTarget(): number {
    return this.config?.reference?.fixtureTarget ?? 12;
  }

  getFixtureDirectory(): string {
    if (!this.config) {
      throw new Error("No hay proyecto activo");
    }

    if (this.config.reference?.fixturesDir) {
      return this.config.reference.fixturesDir;
    }

    const base = this.config.app.name?.trim() || this.meta?.name?.trim() || this.config.app.id;

    return `test/fixtures/arboles/${slugify(base)}-redo`;
  }

  getDashboardInfo() {
    if (!this.config || !this.meta) {
      return null;
    }

    return {
      proyecto: this.meta.name,
      plataforma: this.config.app.platform,
      dispositivo: this.config.appium.deviceName,
      package: this.config.app.id,
      appium: this.config.appium.url,
      automation: this.config.appium.automationName,
      fixtureTarget: this.getFixtureTarget(),
      fixtureDirectory: this.getFixtureDirectory(),
      source: this.meta.source,
    };
  }
}

export const currentProject = new CurrentProject();
