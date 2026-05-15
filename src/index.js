// Export all necessary classes for the headless CAD module
export { DrawBoard } from './domain/core/DrawBoard.js';
export { Camera } from './domain/viewController/Camera.js';
export { MouseControl, MouseState } from './domain/viewController/MouseControl.js';
export { View3D } from './domain/viewController/View3d.js';
export { PropertyEditor } from './domain/viewController/PropertyEditor.js';
export { PropertySchemaProvider, PropertySchemaActionIds, PropertySchemaFieldIds } from './domain/viewController/PropertySchemaProvider.js';
export { CommandPanel } from './domain/viewController/CommandPanel.js';
export { KeyboardManager } from './domain/viewController/KeyboardManager.js';
export { ToolInstructionProvider, ToolInstructionActionIds, ToolInstructionFieldIds } from './domain/viewController/ToolInstructionProvider.js';
export { ActionTypes, CommandRegistry, globalCommandRegistry } from './domain/core/CommandRegistry.js';

// If you have a constraint system, hit tester, or API manager, export them here as well:
// export { ConstraintSystem } from './domain/core/ConstraintSystem.js';
// export { HitTester } from './domain/core/HitTester.js';
