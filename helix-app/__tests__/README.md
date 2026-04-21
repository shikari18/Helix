# Test Directory

This directory contains all tests for the Helix application, organized by feature and test type.

## Structure

```
__tests__/
├── setup.ts                          # Jest setup and global test utilities
├── lib/                              # Tests for library modules
│   ├── InactivityDetector.test.ts           # Unit tests
│   ├── InactivityDetector.property.test.ts  # Property-based tests
│   ├── GlitchEffect.test.ts                 # Unit tests
│   ├── GlitchEffect.property.test.ts        # Property-based tests
│   ├── InactivityGlitchSystem.test.ts       # Integration tests
│   └── InactivityGlitchSystem.property.test.ts  # Property-based tests
└── README.md                         # This file
```

## Test Types

### Unit Tests (`*.test.ts`)
- Test specific functionality and edge cases
- Focus on individual methods and behaviors
- Use example-based testing with known inputs/outputs
- Fast execution, deterministic results

### Property-Based Tests (`*.property.test.ts`)
- Test universal properties across all valid inputs
- Use fast-check library to generate random test cases
- Verify correctness properties from design document
- Run 100+ iterations per property by default

### Integration Tests
- Test interaction between multiple components
- Verify end-to-end workflows
- Test system behavior in realistic scenarios

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run only property-based tests
npm run test:property

# Run specific test file
npm test -- InactivityDetector.test.ts

# Run tests matching a pattern
npm test -- --testNamePattern="Timer"
```

## Test Configuration

Tests are configured in `jest.config.js` with the following settings:

- **Test Environment**: jsdom (simulates browser environment)
- **Test Match**: `**/__tests__/**/*.test.ts` and `**/*.test.tsx`
- **Coverage Threshold**: 80% branches, 85% functions/lines/statements
- **Setup File**: `__tests__/setup.ts` (runs before each test suite)

## Writing Tests

### Unit Test Example

```typescript
describe('MyComponent', () => {
  it('should do something specific', () => {
    const component = new MyComponent();
    const result = component.doSomething();
    expect(result).toBe(expectedValue);
  });
});
```

### Property-Based Test Example

```typescript
import * as fc from 'fast-check';

describe('MyComponent - Properties', () => {
  it('should maintain invariant for all inputs', () => {
    fc.assert(
      fc.property(
        fc.integer(), // Generate random integers
        (input) => {
          const result = myFunction(input);
          return result >= 0; // Property: result is always non-negative
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

## Test Utilities

The `setup.ts` file provides global test utilities:

- **Mock requestAnimationFrame**: Synchronous animation frame for testing
- **Mock performance.now()**: Deterministic timing for time-based tests
- **advanceMockTime(ms)**: Advance mock time by specified milliseconds
- **resetMockTime()**: Reset mock time to zero

### Using Mock Time

```typescript
it('should trigger after 1 second', () => {
  const callback = jest.fn();
  setTimeout(callback, 1000);
  
  advanceMockTime(1000);
  jest.runAllTimers();
  
  expect(callback).toHaveBeenCalled();
});
```

## Coverage Reports

Coverage reports are generated in the `coverage/` directory:

- `coverage/lcov-report/index.html` - HTML coverage report
- `coverage/lcov.info` - LCOV format for CI tools
- `coverage/coverage-final.json` - JSON format

## Best Practices

1. **Test Naming**: Use descriptive test names that explain what is being tested
2. **Arrange-Act-Assert**: Structure tests with clear setup, execution, and verification
3. **Isolation**: Each test should be independent and not rely on other tests
4. **Cleanup**: Always clean up resources (event listeners, timers, DOM elements)
5. **Async Tests**: Use `done` callback or `async/await` for asynchronous tests
6. **Mocking**: Mock external dependencies, but test real functionality
7. **Coverage**: Aim for high coverage, but focus on meaningful tests

## Debugging Tests

```bash
# Run tests with verbose output
npm test -- --verbose

# Run a single test file
npm test -- InactivityDetector.test.ts

# Debug in VS Code
# Add breakpoint and use "Jest: Debug" configuration
```

## CI/CD Integration

Tests run automatically in CI/CD pipelines:

- All tests run on every commit
- Property-based tests run on every PR
- Coverage reports uploaded to code coverage service
- Build fails if coverage drops below threshold
