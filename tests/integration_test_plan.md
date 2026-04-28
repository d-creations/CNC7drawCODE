# Integration Test Plan for CAD Engine

## Overview
This plan outlines the strategy for building comprehensive integration tests for the CNC DrawBoard engine, similar to how major CAD applications handle testing. We will use the native `node:test` framework and built-in `node:assert` to keep dependencies lightweight while fully mocking the rendering environment.

## 1. Environment Setup & Mocking
- **Test Framework**: Native Node.js `node:test` and `node:assert`.
- **Canvas Mocking**: Create a headless mock of the HTML5 Canvas 2D context using `test.mock.fn()` to intercept rendering calls (`moveTo`, `lineTo`, `beginPath`, `stroke`, etc.).
- **DOM Mocks**: If classes like `DrawBoard` or `Camera` depend on `window` or `document`, we will inject minimal polyfills or stub them before tests run.

## 2. Testing Phases

### Phase 1: Core Tool & Shape Integration
**Goal**: Verify that interacting with Tools appropriately creates Domain Objects (Shapes) and registers them with the ConstraintSystem.
- **LineTool**: Simulate two canvas clicks. Assert 2 `Point` shapes and 1 `DrawLine` shape are added. Verify they have valid assigned `constraintId`s.
- **Circle3PTool / Circle3TTool**: Simulate clicks. Assert the correct points and circle geometries are stored both visually and mathematically.
- **Measurement Tools**: Validate that applying them creates measurement visual objects without incorrectly constraining the sketch.

### Phase 2: Constraint System & Solver Integration
**Goal**: Ensure that when the Graph/Constraint system changes, the Shapes update their coordinates correctly.
- Add constraints between points programmatically.
- Trigger the `BaseNonLinearSolver`.
- Assert that point positions converge to the expected math results (e.g., points are precisely X distance apart, or perfectly horizontal).
- Verify the fallback rendering (when `draw()` is called, shapes pull their updated coordinates from `constraintSystem.geometries`).

### Phase 3: Selection and Modification (Mouse Move/Control)
**Goal**: Test the CAD state machine (Mouse Moves, Snapping, Selecting).
- Simulate hovering over an existing `Point`. Verify the start object is selected correctly via `drawBoard.selectStartObject()`.
- Simulate clicking and dragging objects.
- Validate that snapping to origin, lines, or points works within the configurable `selectDistLampda`.

### Phase 4: Render Pipeline Assertions
**Goal**: Validate the Visual output without pixel-comparisons (since we are headless).
- For a `DrawLine` constraint, forcefully call `drawBoard.draw()`.
- Assert `mockCtx.moveTo` and `mockCtx.lineTo` were called with the correctly transformed Camera matrix coordinates.
- Ensure colors (like Selection green/red) are properly passed to `mockCtx.strokeStyle`.

## 3. Directory Structure
```
tests/
  ├── mocks/
  │   └── canvasMock.js        (Shared setup for faking Context)
  ├── integration/
  │   ├── LineTool.test.js     (Phase 1 tool testing)
  │   ├── Constraint.test.js   (Phase 2 solver tests)
  │   └── Render.test.js       (Phase 4 rendering verifications)
```

## 4. Execution
Run using native node:
`npm test` (mapped to `node --test tests/**/*.test.js`)
