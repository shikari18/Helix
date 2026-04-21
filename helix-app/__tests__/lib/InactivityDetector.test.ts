/**
 * Unit tests for InactivityDetector
 * Tests initialization, event handling, timer management, and cleanup
 */

import { InactivityDetector } from '@/lib/InactivityDetector';

describe('InactivityDetector', () => {
  let detector: InactivityDetector;

  afterEach(() => {
    if (detector) {
      detector.destroy();
    }
  });

  describe('Initialization', () => {
    it('should initialize with default options', () => {
      detector = new InactivityDetector();
      const state = detector.getState();
      
      expect(state.activityCount).toBe(0);
      expect(state.isInactive).toBe(true); // Not started yet
    });

    it('should initialize with custom options', () => {
      detector = new InactivityDetector({
        threshold: 5000,
        throttleDelay: 50,
        events: ['mousemove', 'keydown'],
      });
      
      expect(detector).toBeDefined();
    });
  });

  describe('Event Listener Management', () => {
    it('should register event listeners on start', () => {
      detector = new InactivityDetector();
      const addEventListenerSpy = jest.spyOn(document, 'addEventListener');
      
      detector.start();
      
      expect(addEventListenerSpy).toHaveBeenCalled();
      
      addEventListenerSpy.mockRestore();
    });

    it('should remove event listeners on stop', () => {
      detector = new InactivityDetector();
      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
      
      detector.start();
      detector.stop();
      
      expect(removeEventListenerSpy).toHaveBeenCalled();
      
      removeEventListenerSpy.mockRestore();
    });

    it('should clean up all listeners on destroy', () => {
      detector = new InactivityDetector();
      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
      
      detector.start();
      detector.destroy();
      
      expect(removeEventListenerSpy).toHaveBeenCalled();
      
      removeEventListenerSpy.mockRestore();
    });
  });

  describe('Timer Management', () => {
    it('should start timer on initialization', () => {
      detector = new InactivityDetector({ threshold: 10000 });
      detector.start();
      
      expect(detector.getRemainingTime()).toBeGreaterThan(0);
      expect(detector.getRemainingTime()).toBeLessThanOrEqual(10000);
    });

    it('should reset timer on user activity', (done) => {
      detector = new InactivityDetector({ threshold: 1000, throttleDelay: 10 });
      detector.start();
      
      setTimeout(() => {
        const remainingBefore = detector.getRemainingTime();
        
        // Simulate user activity
        const event = new MouseEvent('mousemove');
        document.dispatchEvent(event);
        
        setTimeout(() => {
          const remainingAfter = detector.getRemainingTime();
          expect(remainingAfter).toBeGreaterThan(remainingBefore);
          done();
        }, 50);
      }, 100);
    });

    it('should trigger inactive event after threshold', (done) => {
      detector = new InactivityDetector({ threshold: 100 });
      
      let inactiveTriggered = false;
      detector.on('inactive', () => {
        inactiveTriggered = true;
      });
      
      detector.start();
      
      setTimeout(() => {
        expect(inactiveTriggered).toBe(true);
        done();
      }, 150);
    });

    it('should trigger active event when user interacts after being inactive', (done) => {
      detector = new InactivityDetector({ threshold: 100, throttleDelay: 10 });
      
      let activeTriggered = false;
      
      detector.on('inactive', () => {
        // After becoming inactive, simulate user activity
        setTimeout(() => {
          const event = new MouseEvent('mousemove');
          document.dispatchEvent(event);
        }, 50);
      });
      
      detector.on('active', () => {
        activeTriggered = true;
      });
      
      detector.start();
      
      setTimeout(() => {
        expect(activeTriggered).toBe(true);
        done();
      }, 200);
    });
  });

  describe('Throttling', () => {
    it('should throttle rapid events', (done) => {
      detector = new InactivityDetector({ threshold: 10000, throttleDelay: 100 });
      detector.start();
      
      const initialCount = detector.getActivityCount();
      
      // Fire multiple events rapidly
      for (let i = 0; i < 10; i++) {
        const event = new MouseEvent('mousemove');
        document.dispatchEvent(event);
      }
      
      setTimeout(() => {
        const finalCount = detector.getActivityCount();
        // Should be throttled, not all 10 events counted
        expect(finalCount - initialCount).toBeLessThan(10);
        done();
      }, 50);
    });
  });

  describe('State Management', () => {
    it('should return correct state', () => {
      detector = new InactivityDetector();
      detector.start();
      
      const state = detector.getState();
      
      expect(state).toHaveProperty('isInactive');
      expect(state).toHaveProperty('lastActivityTime');
      expect(state).toHaveProperty('inactiveDuration');
      expect(state).toHaveProperty('activityCount');
    });

    it('should track activity count', (done) => {
      detector = new InactivityDetector({ throttleDelay: 10 });
      detector.start();
      
      const initialCount = detector.getActivityCount();
      
      const event = new MouseEvent('mousemove');
      document.dispatchEvent(event);
      
      setTimeout(() => {
        expect(detector.getActivityCount()).toBeGreaterThan(initialCount);
        done();
      }, 50);
    });
  });

  describe('Event Callbacks', () => {
    it('should register and call event callbacks', (done) => {
      detector = new InactivityDetector({ threshold: 100 });
      
      const callback = jest.fn();
      detector.on('inactive', callback);
      detector.start();
      
      setTimeout(() => {
        expect(callback).toHaveBeenCalled();
        done();
      }, 150);
    });

    it('should unregister event callbacks', (done) => {
      detector = new InactivityDetector({ threshold: 100 });
      
      const callback = jest.fn();
      detector.on('inactive', callback);
      detector.off('inactive', callback);
      detector.start();
      
      setTimeout(() => {
        expect(callback).not.toHaveBeenCalled();
        done();
      }, 150);
    });
  });
});
