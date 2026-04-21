/**
 * Integration tests for InactivityGlitchSystem
 * Tests the integration between InactivityDetector and GlitchEffect
 */

import { InactivityGlitchSystem } from '@/lib/InactivityGlitchSystem';

describe('InactivityGlitchSystem', () => {
  let system: InactivityGlitchSystem;
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (system) {
      system.destroy();
    }
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  describe('Initialization', () => {
    it('should initialize with default options', () => {
      system = new InactivityGlitchSystem();
      
      expect(system).toBeDefined();
      expect(system.detector).toBeDefined();
      expect(system.effect).toBeDefined();
    });

    it('should initialize with custom options', () => {
      system = new InactivityGlitchSystem({
        detector: {
          threshold: 5000,
          throttleDelay: 50,
        },
        effect: {
          container,
          intensity: 'high',
          frameRate: 60,
        },
      });
      
      expect(system).toBeDefined();
    });

    it('should wire up components on initialize', () => {
      system = new InactivityGlitchSystem({ effect: { container } });
      
      system.initialize();
      
      expect(system.isInitialized()).toBe(true);
    });

    it('should not initialize twice', () => {
      system = new InactivityGlitchSystem();
      
      system.initialize();
      const detector1 = system.detector;
      
      system.initialize();
      const detector2 = system.detector;
      
      expect(detector1).toBe(detector2);
    });
  });

  describe('Integration', () => {
    it('should start effect when detector triggers inactive state', (done) => {
      system = new InactivityGlitchSystem({
        detector: { threshold: 100 },
        effect: { container },
      });
      
      system.initialize();
      
      setTimeout(() => {
        expect(system.effect.isEffectRunning()).toBe(true);
        done();
      }, 150);
    });

    it('should stop effect when user interacts after inactivity', (done) => {
      system = new InactivityGlitchSystem({
        detector: { threshold: 100, throttleDelay: 10 },
        effect: { container },
      });
      
      system.initialize();
      
      // Wait for inactive state
      setTimeout(() => {
        expect(system.effect.isEffectRunning()).toBe(true);
        
        // Simulate user interaction
        const event = new MouseEvent('mousemove');
        document.dispatchEvent(event);
        
        // Wait for effect to stop
        setTimeout(() => {
          expect(system.effect.isEffectRunning()).toBe(false);
          done();
        }, 50);
      }, 150);
    });

    it('should handle multiple inactive/active cycles', (done) => {
      system = new InactivityGlitchSystem({
        detector: { threshold: 100, throttleDelay: 10 },
        effect: { container },
      });
      
      system.initialize();
      
      let cycleCount = 0;
      const maxCycles = 2;
      
      const checkCycle = () => {
        setTimeout(() => {
          expect(system.effect.isEffectRunning()).toBe(true);
          
          // Simulate user interaction
          const event = new MouseEvent('mousemove');
          document.dispatchEvent(event);
          
          setTimeout(() => {
            expect(system.effect.isEffectRunning()).toBe(false);
            
            cycleCount++;
            if (cycleCount < maxCycles) {
              checkCycle();
            } else {
              done();
            }
          }, 50);
        }, 150);
      };
      
      checkCycle();
    });
  });

  describe('State Consistency', () => {
    it('should maintain consistent state between detector and effect', (done) => {
      system = new InactivityGlitchSystem({
        detector: { threshold: 100 },
        effect: { container },
      });
      
      system.initialize();
      
      // Initially, detector is active, effect is not running
      expect(system.detector.isInactive()).toBe(false);
      expect(system.effect.isEffectRunning()).toBe(false);
      
      // After threshold, detector is inactive, effect is running
      setTimeout(() => {
        expect(system.detector.isInactive()).toBe(true);
        expect(system.effect.isEffectRunning()).toBe(true);
        done();
      }, 150);
    });
  });

  describe('Cleanup', () => {
    it('should clean up all resources on destroy', () => {
      system = new InactivityGlitchSystem({ effect: { container } });
      
      system.initialize();
      system.destroy();
      
      expect(system.isInitialized()).toBe(false);
      expect(system.effect.isEffectRunning()).toBe(false);
    });

    it('should not fail when destroying uninitialized system', () => {
      system = new InactivityGlitchSystem();
      
      expect(() => {
        system.destroy();
      }).not.toThrow();
    });
  });

  describe('Cross-Device Events', () => {
    it('should detect mouse events', (done) => {
      system = new InactivityGlitchSystem({
        detector: { threshold: 100, throttleDelay: 10 },
        effect: { container },
      });
      
      system.initialize();
      
      setTimeout(() => {
        expect(system.effect.isEffectRunning()).toBe(true);
        
        const event = new MouseEvent('mousemove');
        document.dispatchEvent(event);
        
        setTimeout(() => {
          expect(system.effect.isEffectRunning()).toBe(false);
          done();
        }, 50);
      }, 150);
    });

    it('should detect keyboard events', (done) => {
      system = new InactivityGlitchSystem({
        detector: { threshold: 100, throttleDelay: 10 },
        effect: { container },
      });
      
      system.initialize();
      
      setTimeout(() => {
        expect(system.effect.isEffectRunning()).toBe(true);
        
        const event = new KeyboardEvent('keydown');
        document.dispatchEvent(event);
        
        setTimeout(() => {
          expect(system.effect.isEffectRunning()).toBe(false);
          done();
        }, 50);
      }, 150);
    });

    it('should detect touch events', (done) => {
      system = new InactivityGlitchSystem({
        detector: { threshold: 100, throttleDelay: 10 },
        effect: { container },
      });
      
      system.initialize();
      
      setTimeout(() => {
        expect(system.effect.isEffectRunning()).toBe(true);
        
        const event = new TouchEvent('touchstart');
        document.dispatchEvent(event);
        
        setTimeout(() => {
          expect(system.effect.isEffectRunning()).toBe(false);
          done();
        }, 50);
      }, 150);
    });
  });

  describe('UI Non-Interference', () => {
    it('should not block pointer events on interactive elements', () => {
      system = new InactivityGlitchSystem({ effect: { container } });
      
      system.initialize();
      system.effect.start();
      
      const effectElement = container.querySelector('.glitch-effect-container, .glitch-effect-canvas') as HTMLElement;
      
      if (effectElement) {
        expect(effectElement.style.pointerEvents).toBe('none');
      }
    });
  });
});
