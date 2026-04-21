/**
 * InactivityDetector - Monitors user interaction events and triggers state changes
 * based on inactivity duration.
 */

export interface InactivityDetectorOptions {
  /** Inactivity threshold in milliseconds (default: 10000) */
  threshold?: number;
  /** Event throttle delay in milliseconds (default: 100) */
  throttleDelay?: number;
  /** Events to monitor for user activity */
  events?: string[];
}

export interface InactivityState {
  /** Current inactivity status */
  isInactive: boolean;
  /** Timestamp of last activity (ms since epoch) */
  lastActivityTime: number;
  /** Duration of current inactive period (ms) */
  inactiveDuration: number;
  /** Number of activity events since page load */
  activityCount: number;
}

type EventCallback = () => void;

export class InactivityDetector {
  private options: Required<InactivityDetectorOptions>;
  private isActive: boolean = false;
  private timerId: NodeJS.Timeout | null = null;
  private lastActivityTime: number = 0;
  private activityCount: number = 0;
  private eventListeners: Map<string, EventListener> = new Map();
  private callbacks: Map<string, Set<EventCallback>> = new Map();
  private lastThrottleTime: number = 0;

  constructor(options: InactivityDetectorOptions = {}) {
    this.options = {
      threshold: options.threshold ?? 10000,
      throttleDelay: options.throttleDelay ?? 100,
      events: options.events ?? [
        'mousemove',
        'mousedown',
        'keydown',
        'touchstart',
        'touchmove',
        'scroll',
        'wheel',
      ],
    };
  }

  /**
   * Start monitoring user activity
   */
  start(): void {
    if (this.isActive) return;

    this.isActive = true;
    this.lastActivityTime = Date.now();
    this.startTimer();
    this.registerEventListeners();
  }

  /**
   * Stop monitoring user activity
   */
  stop(): void {
    if (!this.isActive) return;

    this.isActive = false;
    this.clearTimer();
    this.unregisterEventListeners();
  }

  /**
   * Reset the inactivity timer
   */
  reset(): void {
    if (!this.isActive) return;

    this.lastActivityTime = Date.now();
    this.clearTimer();
    this.startTimer();
  }

  /**
   * Register an event callback
   */
  on(event: string, callback: EventCallback): void {
    if (!this.callbacks.has(event)) {
      this.callbacks.set(event, new Set());
    }
    this.callbacks.get(event)!.add(callback);
  }

  /**
   * Unregister an event callback
   */
  off(event: string, callback: EventCallback): void {
    const callbacks = this.callbacks.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  /**
   * Clean up all resources
   */
  destroy(): void {
    this.stop();
    this.callbacks.clear();
  }

  /**
   * Get current inactivity state
   */
  getState(): InactivityState {
    const now = Date.now();
    const isInactive = !this.isActive || (now - this.lastActivityTime >= this.options.threshold);
    
    return {
      isInactive,
      lastActivityTime: this.lastActivityTime,
      inactiveDuration: isInactive ? now - this.lastActivityTime : 0,
      activityCount: this.activityCount,
    };
  }

  /**
   * Check if currently in inactive state
   */
  isInactive(): boolean {
    return this.getState().isInactive;
  }

  /**
   * Get remaining time until inactive state (ms)
   */
  getRemainingTime(): number {
    if (!this.isActive) return 0;
    const elapsed = Date.now() - this.lastActivityTime;
    return Math.max(0, this.options.threshold - elapsed);
  }

  /**
   * Get activity count
   */
  getActivityCount(): number {
    return this.activityCount;
  }

  private startTimer(): void {
    this.timerId = setTimeout(() => {
      this.emit('inactive');
    }, this.options.threshold);
  }

  private clearTimer(): void {
    if (this.timerId !== null) {
      try {
        clearTimeout(this.timerId);
      } catch (error) {
        console.error('[InactivityDetector] Timer clear error:', error);
      } finally {
        this.timerId = null;
      }
    }
  }

  private registerEventListeners(): void {
    this.options.events.forEach((eventType) => {
      const listener = this.createThrottledHandler();
      this.eventListeners.set(eventType, listener);
      
      if (typeof document !== 'undefined') {
        document.addEventListener(eventType, listener, { passive: true });
      }
    });
  }

  private unregisterEventListeners(): void {
    this.eventListeners.forEach((listener, eventType) => {
      if (typeof document !== 'undefined') {
        document.removeEventListener(eventType, listener);
      }
    });
    this.eventListeners.clear();
  }

  private createThrottledHandler(): EventListener {
    return (event: Event) => {
      try {
        this.handleUserActivity(event);
      } catch (error) {
        console.error('[InactivityDetector] Event handler error:', error);
      }
    };
  }

  private handleUserActivity(event: Event): void {
    const now = Date.now();
    
    // Throttle event processing
    if (now - this.lastThrottleTime < this.options.throttleDelay) {
      return;
    }
    
    this.lastThrottleTime = now;
    this.activityCount++;
    
    const wasInactive = this.isInactive();
    
    this.reset();
    
    if (wasInactive) {
      this.emit('active');
    }
  }

  private emit(event: string): void {
    const callbacks = this.callbacks.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback();
        } catch (error) {
          console.error(`[InactivityDetector] Callback error for event '${event}':`, error);
        }
      });
    }
  }
}
