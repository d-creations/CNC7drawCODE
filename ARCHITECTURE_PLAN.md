# Measurement Text Anchor Architecture Plan

Data model: Store a text-anchor as a world-coordinate point (either a dedicated geometry in the constraint system or a lightweight anchor with optional constraint link). Prefer making it a geometry when you want solver/constraints to affect it; keep as plain coords for purely visual offsets.

Rendering: Update measurement shapes to emit a leader line + text_anchor render instruction and draw an anchor handle; show handle only when the shape is selected.

Hit-testing: Add support for a text_anchor/point primitive in `HitTester` so anchors can be clicked and dragged (we reuse the existing `arc` primitive for a point handle to leverage existing tests).

Interaction: Extend `MouseControl` to enter an "drag-anchor" sub-state when an anchor is selected; drag updates anchor coords live and calls `drawBoard.draw()` + `drawBoard.saveState()` on release.

Property Editor: Expose anchor X/Y (or offset) fields in `buildProperties()` so users can type exact coordinates; changes update the anchor and optionally add a constraint link.

Persistence: Serialize anchor into the constraint system geometries (or measurement geometry data) so it saves/loads and can be part of constraints.

Undo/Redo: Use `HistoryManager` to record anchor-move actions as atomic operations.

Solver integration (optional): If anchor is a geometry, allow constraints (fixed, linked to point) so text can be driven by geometry/constraints.

Testing: Add unit tests for render output, hit-testing, drag behavior, and serialization. Add an integration test simulating select→drag→save.

Rollout: Implement for `LengthMeasurement` first, then replicate to `HorizontalMeasurement`, `VerticalMeasurement`, `AngleMeasurement`, and `RadiusMeasurement`.
