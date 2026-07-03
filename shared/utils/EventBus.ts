/**
 * Shared Utility — Application Event Bus
 *
 * Pluggable pub/sub mechanism for asynchronous communication between modules.
 * In serverless environments, events are processed synchronously within the request context.
 */

type EventCallback = (payload: any) => void | Promise<void>;

class EventBus {
  private listeners: Record<string, EventCallback[]> = {};

  /**
   * Subscribe to a specific event. Returns an unsubscribe function.
   */
  subscribe(event: string, callback: EventCallback): () => void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
    return () => {
      this.listeners[event] = this.listeners[event].filter((cb) => cb !== callback);
    };
  }

  /**
   * Emit an event. All registered listeners are fired synchronously/asynchronously.
   */
  async emit(event: string, payload: any): Promise<void> {
    const callbacks = this.listeners[event] || [];
    const wildcardCallbacks = this.listeners['*'] || [];
    const allCallbacks = [...callbacks, ...wildcardCallbacks];

    for (const callback of allCallbacks) {
      try {
        await callback({ event, payload });
      } catch (err) {
        console.error(`Error in event listener for "${event}":`, err);
      }
    }

    // Dynamic invocation of automations orchestration (Section 8)
    try {
      const { handleEventTrigger } = await import('@/features/automation/application/HandleEventTrigger');
      await handleEventTrigger(event, payload);
    } catch (err) {
      // Quietly ignore if HandleEventTrigger isn't initialized or resolves in client bundle
    }
  }

}

// Global singleton instance
export const eventBus = new EventBus();
