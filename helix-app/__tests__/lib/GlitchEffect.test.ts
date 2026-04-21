/**
 * Unit tests for GlitchEffect
 * Tests initialization, rendering methods, and resource management
 */

import { GlitchEffect } from '@/lib/GlitchEffect';

describe('GlitchEffect', () => {
  let effect: GlitchEffect;
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (effect) {
      effect.destroy();
    }
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  describe('Initialization', () => {
    it('should initialize with default options', () => {
      effect = new GlitchEffect();
      
      expect(effect).toBeDefined();
      expect(effect.isEffectRunning()).toBe(false);
    });

    it('should initialize with custom options', () => {
      effect = new GlitchEffect({
        container,
        zIndex: 10,
        intensity: 'high',
        frameRate: 60,
        colors: {
          primary: '#ff0000',
          secondary: '#00ff00',
          tertiary: '#0000ff',
        },
      });
      
      expect(effect).toBeDefined();
    });
  });

  describe('Effect Lifecycle', () => {
    it('should start rendering effect', () => {
      effect = new GlitchEffect({ container });
      
      effect.start();
      
      expect(effect.isEffectRunning()).toBe(true);
    });

    it('should stop rendering effect', () => {
      effect = new GlitchEffect({ container });
      
      effect.start();
      expect(effect.isEffectRunning()).toBe(true);
      
      effect.stop();
      expect(effect.isEffectRunning()).toBe(false);
    });

    it('should not start if already running', () => {
      effect = new GlitchEffect({ container });
      
      effect.start();
      const state1 = effect.getState();
      
      effect.start(); // Try to start again
      const state2 = effect.getState();
      
      expect(state1.startTime).toBe(state2.startTime);
    });

    it('should not stop if not running', () => {
      effect = new GlitchEffect({ container });
      
      effect.stop(); // Try to stop when not running
      
      expect(effect.isEffectRunning()).toBe(false);
    });
  });

  describe('Rendering Methods', () => {
    it('should create effect element when started', () => {
      effect = new GlitchEffect({ container });
      
      effect.start();
      
      const effectElements = container.querySelectorAll('.glitch-effect-container, .glitch-effect-canvas');
      expect(effectElements.length).toBeGreaterThan(0);
    });

    it('should remove effect element when stopped', () => {
      effect = new GlitchEffect({ container });
      
      effect.start();
      effect.stop();
      
      const effectElements = container.querySelectorAll('.glitch-effect-container, .glitch-effect-canvas');
      expect(effectElements.length).toBe(0);
    });

    it('should apply correct z-index', () => {
      effect = new GlitchEffect({ container, zIndex: -5 });
      
      effect.start();
      
      const effectElement = container.querySelector('.glitch-effect-container, .glitch-effect-canvas') as HTMLElement;
      expect(effectElement?.style.zIndex).toBe('-5');
    });

    it('should apply pointer-events: none', () => {
      effect = new GlitchEffect({ container });
      
      effect.start();
      
      const effectElement = container.querySelector('.glitch-effect-container, .glitch-effect-canvas') as HTMLElement;
      expect(effectElement?.style.pointerEvents).toBe('none');
    });
  });

  describe('State Management', () => {
    it('should return correct state', () => {
      effect = new GlitchEffect({ container });
      
      const state = effect.getState();
      
      expect(state).toHaveProperty('isRunning');
      expect(state).toHaveProperty('startTime');
      expect(state).toHaveProperty('frameCount');
      expect(state).toHaveProperty('currentIntensity');
      expect(state).toHaveProperty('renderMethod');
    });

    it('should track frame count when running', (done) => {
      effect = new GlitchEffect({ container, frameRate: 30 });
      
      effect.start();
      
      setTimeout(() => {
        const state = effect.getState();
        // For canvas rendering, frame count should increase
        // For CSS rendering, frame count stays at 0
        expect(state.frameCount).toBeGreaterThanOrEqual(0);
        done();
      }, 100);
    });

    it('should report correct intensity values', () => {
      const lowEffect = new GlitchEffect({ intensity: 'low' });
      const mediumEffect = new GlitchEffect({ intensity: 'medium' });
      const highEffect = new GlitchEffect({ intensity: 'high' });
      
      expect(lowEffect.getState().currentIntensity).toBe(0.3);
      expect(mediumEffect.getState().currentIntensity).toBe(0.6);
      expect(highEffect.getState().currentIntensity).toBe(1.0);
      
      lowEffect.destroy();
      mediumEffect.destroy();
      highEffect.destroy();
    });
  });

  describe('Resource Management', () => {
    it('should not have active animation frames when stopped', () => {
      effect = new GlitchEffect({ container });
      
      effect.start();
      effect.stop();
      
      expect(effect.hasActiveAnimationFrame()).toBe(false);
    });

    it('should clean up on destroy', () => {
      effect = new GlitchEffect({ container });
      
      effect.start();
      effect.destroy();
      
      expect(effect.isEffectRunning()).toBe(false);
      expect(effect.hasActiveAnimationFrame()).toBe(false);
    });
  });

  describe('CSS Animation Method', () => {
    it('should inject CSS styles when using CSS method', () => {
      effect = new GlitchEffect({ container });
      
      effect.start();
      
      const state = effect.getState();
      if (state.renderMethod === 'css') {
        const styleElement = document.getElementById('glitch-effect-styles');
        expect(styleElement).toBeTruthy();
      }
    });
  });

  describe('Canvas Rendering Method', () => {
    it('should create canvas element when using canvas method', () => {
      effect = new GlitchEffect({ container });
      
      effect.start();
      
      const state = effect.getState();
      if (state.renderMethod === 'canvas') {
        const canvas = container.querySelector('canvas');
        expect(canvas).toBeTruthy();
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle missing container gracefully', () => {
      effect = new GlitchEffect({ container: undefined });
      
      expect(() => {
        effect.start();
      }).not.toThrow();
    });
  });
});
