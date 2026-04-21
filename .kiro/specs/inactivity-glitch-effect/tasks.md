# Implementation Plan: Inactivity Glitch Effect

## Overview

This implementation plan creates an inactivity detection and visual feedback system for the chat interface. The system monitors user interactions and triggers an animated glitch effect after 10 seconds of inactivity. The implementation uses vanilla JavaScript/TypeScript with modern browser APIs, organized into three main components: InactivityDetector (monitors user activity), GlitchEffect (renders visual effects), and InactivityGlitchSystem (integration layer).

## Tasks

- [ ] 1. Set up project structure and core interfaces
  - Create `InactivityDetector.ts` class file in appropriate directory
  - Create `GlitchEffect.ts` class file in appropriate directory
  - Create `InactivityGlitchSystem.ts` integration class file
  - Define TypeScript interfaces for configuration options and state objects
  - Set up test directory structure with Jest and fast-check configuration
  - _Requirements: 1.1, 1.2, 1.4, 2.1, 5.1_

- [ ] 2. Implement InactivityDetector component
  - [ ] 2.1 Implement core InactivityDetector class with event monitoring
    - Implement constructor with configuration options (threshold, throttleDelay, events)
    - Implement event listener registration for mouse, keyboard, touch, and scroll events
    - Implement throttled event handler to reset inactivity timer
    - Implement timer mechanism using setTimeout to track inactivity duration
    - Implement event emitter pattern (on/off methods) for inactive/active state changes
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 5.1_

  - [ ]* 2.2 Write property test for timer reset idempotence
    - **Property 2: Timer Reset Idempotence**
    - **Validates: Requirements 1.2, 5.1**

  - [ ]* 2.3 Write property test for inactivity detection accuracy
    - **Property 1: Inactivity Detection Accuracy**
    - **Validates: Requirements 1.3, 1.4**

  - [ ] 2.4 Implement start, stop, reset, and destroy methods
    - Implement start() method to begin monitoring user activity
    - Implement stop() method to pause monitoring
    - Implement reset() method to restart inactivity timer
    - Implement destroy() method with event listener cleanup
    - _Requirements: 1.2, 5.3_

  - [ ]* 2.5 Write property test for event listener cleanup
    - **Property 5: Event Listener Cleanup**
    - **Validates: Requirements 5.3**

  - [ ]* 2.6 Write unit tests for InactivityDetector
    - Test initialization with default and custom options
    - Test event listener registration and removal
    - Test timer starts, resets, and triggers inactive state
    - Test throttling prevents excessive timer resets
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 5.1_

- [ ] 3. Implement GlitchEffect component
  - [ ] 3.1 Implement core GlitchEffect class with rendering setup
    - Implement constructor with configuration options (container, zIndex, intensity, frameRate, colors)
    - Implement feature detection for CSS animations and Canvas API
    - Create effect container element with proper z-index and pointer-events styling
    - Implement rendering method selection (CSS animation primary, Canvas fallback)
    - _Requirements: 2.2, 4.1, 4.4, 6.3, 6.4_

  - [ ] 3.2 Implement CSS animation-based glitch effect
    - Create CSS keyframe animations for glitch visual effects (color distortion, displacement, scan lines)
    - Implement dynamic CSS class injection for effect activation
    - Implement intensity levels (low, medium, high) with different animation parameters
    - Ensure animations run at target frame rate (24-60 FPS)
    - _Requirements: 2.4, 4.2, 4.3_

  - [ ] 3.3 Implement Canvas-based glitch effect as fallback
    - Implement Canvas context creation and setup
    - Implement requestAnimationFrame-based render loop
    - Implement glitch rendering algorithms (RGB channel shift, scan lines, noise)
    - Implement frame rate limiting to target FPS
    - _Requirements: 2.4, 4.2, 4.3, 5.4_

  - [ ] 3.4 Implement start, stop, and isRunning methods
    - Implement start() method to begin rendering effect
    - Implement stop() method to halt rendering and clean up resources
    - Implement isRunning() method to query current rendering state
    - Ensure resource cleanup when effect is stopped (no active animations)
    - _Requirements: 2.1, 2.3, 3.1, 5.2_

  - [ ]* 3.5 Write property test for effect activation responsiveness
    - **Property 3: Effect Activation Responsiveness**
    - **Validates: Requirements 2.1**

  - [ ]* 3.6 Write property test for effect deactivation responsiveness
    - **Property 4: Effect Deactivation Responsiveness**
    - **Validates: Requirements 3.1**

  - [ ]* 3.7 Write property test for non-interference with UI
    - **Property 6: Non-Interference with UI**
    - **Validates: Requirements 4.4**

  - [ ]* 3.8 Write property test for resource conservation
    - **Property 7: Resource Conservation**
    - **Validates: Requirements 5.2**

  - [ ]* 3.9 Write unit tests for GlitchEffect
    - Test initialization with default and custom options
    - Test CSS and Canvas rendering methods
    - Test z-index positioning and pointer-events styling
    - Test frame rate limiting
    - Test cleanup on destroy
    - _Requirements: 2.2, 2.4, 4.1, 4.2, 4.3, 4.4, 5.2, 5.4_

- [ ] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implement InactivityGlitchSystem integration layer
  - [ ] 5.1 Implement InactivityGlitchSystem class
    - Implement constructor accepting detector and effect configuration options
    - Implement initialize() method to create and wire detector and effect components
    - Bind detector's 'inactive' event to effect.start()
    - Bind detector's 'active' event to effect.stop()
    - Implement destroy() method to clean up both components
    - _Requirements: 1.3, 2.1, 3.1, 3.3_

  - [ ]* 5.2 Write property test for state consistency
    - **Property 10: State Consistency**
    - **Validates: Requirements 2.3, 3.3**

  - [ ]* 5.3 Write property test for cross-device event detection
    - **Property 8: Cross-Device Event Detection**
    - **Validates: Requirements 6.1, 6.2**

  - [ ]* 5.4 Write integration tests for InactivityGlitchSystem
    - Test detector triggers effect on inactivity
    - Test user interaction stops effect
    - Test multiple inactive/active cycles
    - Test effect respects z-index layering
    - Test effect doesn't block chat interactions
    - Test cleanup on page unload
    - Test mobile touch events and desktop mouse/keyboard events
    - _Requirements: 1.3, 2.1, 2.3, 3.1, 3.3, 4.1, 4.4, 6.1, 6.2_

- [ ] 6. Implement error handling and graceful degradation
  - [ ] 6.1 Add error handling to InactivityDetector
    - Wrap event handlers in try-catch blocks with console error logging
    - Add defensive checks for timer state before clearing
    - Validate timer ID before clearTimeout operations
    - _Requirements: 5.3_

  - [ ] 6.2 Add error handling and fallback logic to GlitchEffect
    - Implement feature detection for Canvas and CSS animation support
    - Implement fallback from Canvas to CSS if context creation fails
    - Implement graceful degradation if neither rendering method is supported
    - Add try-catch blocks around rendering operations with console warnings
    - _Requirements: 6.3, 6.4_

  - [ ]* 6.3 Write property test for graceful degradation
    - **Property 9: Graceful Degradation**
    - **Validates: Requirements 6.4**

  - [ ]* 6.4 Write unit tests for error handling
    - Test event listener error handling
    - Test rendering error handling and fallbacks
    - Test timer error handling
    - Test browser compatibility error handling
    - _Requirements: 5.3, 6.3, 6.4_

- [ ] 7. Integrate system into chat interface
  - [ ] 7.1 Add InactivityGlitchSystem to chat page
    - Import InactivityGlitchSystem into chat page component
    - Initialize system with appropriate configuration (10s threshold, medium intensity)
    - Set up system initialization on page mount
    - Set up system cleanup on page unmount
    - _Requirements: 1.3, 2.1, 3.1_

  - [ ] 7.2 Configure visual styling for chat interface
    - Ensure glitch effect container has z-index below chat content
    - Verify pointer-events: none on effect layer
    - Test effect visibility and aesthetics in chat context
    - Adjust color scheme and intensity if needed for chat interface
    - _Requirements: 2.2, 4.1, 4.2, 4.4_

  - [ ]* 7.3 Write end-to-end integration tests
    - Test system works correctly in actual chat interface
    - Test effect triggers after 10 seconds of inactivity in chat
    - Test effect stops when user interacts with chat
    - Test effect doesn't interfere with chat functionality
    - _Requirements: 1.3, 2.1, 2.3, 3.1, 3.3, 4.4_

- [ ] 8. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The system uses vanilla JavaScript/TypeScript for broad compatibility
- CSS animations are the primary rendering method with Canvas as fallback
- All event listeners must be cleaned up to prevent memory leaks
- The effect layer uses z-index: -1 and pointer-events: none to avoid UI interference
