import type { InteractionSource, RawInteractionHandler } from "../interaction-source.js";

export class IOSInteractionSource implements InteractionSource {
  readonly platform = "ios" as const;

  private running = false;

  async start(_handler: RawInteractionHandler): Promise<void> {
    this.running = true;

    /**
     * Implementación real pendiente.
     *
     * La fuente concreta será distinta
     * de Android, pero produce el mismo
     * RawInteraction consumido por Apptrak.
     */
  }

  async stop(): Promise<void> {
    this.running = false;
  }

  isRunning(): boolean {
    return this.running;
  }
}
