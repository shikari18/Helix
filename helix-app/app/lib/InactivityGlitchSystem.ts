/**
 * InactivityGlitchSystem - Integration layer connecting InactivityDetector and GlitchEffect
 */

import { InactivityDetector, InactivityDetectorOptions } from './InactivityDetector';
import { GlitchEffect, GlitchEffectOptions } from './GlitchEffect';

export interface InactivityGlitchSystemOptions {
  detector?: InactivityDetectorOptions;
  effect?: GlitchEffectOptions;
}

export class InactivityGlitchSystem {
  public detector: InactivityDetector;
  public effect: GlitchEffect;
  private initialized: boolean = false;

  constructor(options: InactivityGlitchSystemOptions = {}) {
    this.detector = new InactivityDetector(options.detector);
    this.effect = new GlitchEffect(options.effect);
  }

  /**
   * Initialize the system and wire up components
   */
  initialize(): void {
    if (this.initialized) return;

    // Bind detector events to effect methods
    this.detector.on('inactive', () => {
      this.effect.start();
    });

    this.detector.on('active', () => {
      this.effect.stop();
    });

    // Start monitoring
    this.detector.start();

    this.initialized = true;
  }

  /**
   * Clean up all resources
   */
  destroy(): void {
    if (!this.initialized) return;

    this.detector.destroy();
    this.effect.destroy();

    this.initialized = false;
  }

  /**
   * Check if system is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}
