export type EventHandler<TArgs extends unknown[] = []> = (...args: TArgs) => void;

export class EventDispatcher<TArgs extends unknown[] = []> {
  private handlers = new Set<EventHandler<TArgs>>();

  public on(handler: EventHandler<TArgs>) {
    this.handlers.add(handler);
    return () => this.off(handler);
  }

  public off(handler: EventHandler<TArgs>) {
    this.handlers.delete(handler);
  }

  public emit(...args: TArgs) {
    this.handlers.forEach((handler) => {
      try {
        handler(...args);
      } catch (error) {
        console.error("Event handler failed:", error);
      }
    });
  }

  public clear() {
    this.handlers.clear();
  }
}
