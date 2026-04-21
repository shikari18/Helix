/**
 * Jest test setup file
 * This file runs before each test suite
 */

import '@testing-library/jest-dom';

// Mock requestAnimationFrame for tests
global.requestAnimationFrame = (callback: FrameRequestCallback): number => {
  return setTimeout(callback, 0) as unknown as number;
};

global.cancelAnimationFrame = (id: number): void => {
  clearTimeout(id);
};

// Mock performance.now() for deterministic timing tests
let mockTime = 0;
const originalPerformanceNow = performance.now.bind(performance);

global.performance.now = jest.fn(() => mockTime);

// Helper to advance mock time
(global as any).advanceMockTime = (ms: number) => {
  mockTime += ms;
};

// Helper to reset mock time
(global as any).resetMockTime = () => {
  mockTime = 0;
};

// Reset mock time before each test
beforeEach(() => {
  mockTime = 0;
});

// Mock console methods to reduce noise in tests (optional)
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
};
