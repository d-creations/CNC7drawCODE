# CNC7drawCODE

Sketch with JavaScript for CNC paths.

The goal of the project is to allow users to create a 2D sketch and generate NC code.

## CAM Module

The project now includes a small CAM post-processor at `src/domain/cam/GCodeGenerator.js`.
It reads the solved sketch geometry from the constraint system and emits basic 2D milling paths:

- `Point` -> `G1 X Y`
- `Line` -> `G1 X Y` with automatic endpoint orientation from the current tool position
- `Arc` -> `G2` or `G3` with incremental `I` and `J`
- `Circle` -> two half-circle `G2`/`G3` moves with incremental `I` and `J`

You can call it through the board API:

```js
const gcode = drawBoard.exportGCode({
	startPointId: 'point_1',
	sequence: ['line_1', 'arc_1', 'point_7'],
	feedRate: 250
});
```

This is a CAM layer only: the dependency graph and GCS still solve sketch geometry first, and the post-processor converts the solved result into machine moves.

## Package Integration

For embedding this module into another editor, there are two clean integration patterns.

### 1. Use the default UI layer

If you want the built-in property editor and command guidance panel, import the view layer from the package entry and mount `View3D`.

```js
import { Camera, DrawBoard, View3D } from 'cnc7drawnccode';

const host = document.getElementById('editor-host');
const canvas = document.createElement('canvas');
const camera = new Camera();
const drawBoard = new DrawBoard(canvas, camera);

const view = new View3D(host, drawBoard, canvas, camera);
```

This is the fastest integration path if your host application is fine with the module creating and managing:

- the `PropertyEditor`
- the `CommandPanel`
- the keyboard bindings
- the canvas event wiring

### 2. Use the headless/core layer and provide your own host UI

If the outer project already has its own UI system such as React, Vue, Angular, or a custom editor shell, use:

- `DrawBoard`
- `Camera`
- `MouseControl`
- `MouseState`

Then bind your host UI to these callbacks:

- `drawBoard.onSelectionChanged = (obj) => { ... }` for a custom property editor
- `mouseControl.onStateChange = () => { ... }` for command/tool instruction text such as "select second line"

In that setup, the host application should own the UI and treat `PropertyEditor` and `CommandPanel` as optional reference implementations rather than required infrastructure.

### ToolInstructionProvider API

The command guidance logic has been extracted into a DOM-free provider at `ToolInstructionProvider`.

Use it when your host editor wants to render its own instruction UI while reusing this module's tool-step logic.

```js
import {
	Camera,
	DrawBoard,
	MouseControl,
	ToolInstructionProvider
} from 'cnc7drawnccode';

const canvas = document.createElement('canvas');
const camera = new Camera();
const drawBoard = new DrawBoard(canvas, camera);
const mouseControl = new MouseControl(document.body, drawBoard);
const toolInstructions = new ToolInstructionProvider(mouseControl);

function renderToolHint() {
	const snapshot = toolInstructions.getSnapshot();
	if (!snapshot.visible) {
		hideHintPanel();
		return;
	}

	showHintPanel({
		title: snapshot.title,
		instruction: snapshot.instruction,
		status: snapshot.status,
		fields: snapshot.fields,
		actions: snapshot.actions,
		output: snapshot.output
	});
}

mouseControl.onStateChange = renderToolHint;
renderToolHint();
```

`getSnapshot()` returns a plain object with this shape:

```js
{
	visible: true,
	state: mouseControl.buttonState,
	title: 'Tool: Fillet Radius',
	instruction: 'Step 2/3: Select the second line of the corner.',
	status: null,
	fields: [
		{
			id: 'commandRadius',
			label: 'Radius',
			type: 'number',
			min: '0.01',
			step: '0.1',
			value: 20
		}
	],
	actions: [],
	output: null
}
```

Provider methods:

- `getSnapshot()` returns the current tool instruction model
- `setFieldValue(fieldId, rawValue)` updates provider-backed numeric inputs such as radius or chamfer size
- `runAction(actionId)` executes provider-backed actions such as CAM export, CAM clear, CAM copy, or 2T1R confirmation

Exported constants:

- `ToolInstructionFieldIds.COMMAND_RADIUS`
- `ToolInstructionFieldIds.COMMAND_CHAMFER_SIZE`
- `ToolInstructionActionIds.CAM_EXPORT`
- `ToolInstructionActionIds.CAM_UNDO_LAST`
- `ToolInstructionActionIds.CAM_CLEAR`
- `ToolInstructionActionIds.CAM_COPY`
- `ToolInstructionActionIds.CIRCLE_2T1R_CONFIRM`

`CommandPanel` now uses `ToolInstructionProvider` internally, so the built-in panel and a custom host UI read from the same instruction source.

### PropertySchemaProvider API

The property editor now follows the same pattern. `PropertySchemaProvider` exposes a pure schema for the selected object, while `PropertyEditor` is only the built-in DOM renderer.

```js
import {
	Camera,
	DrawBoard,
	MouseControl,
	PropertySchemaProvider
} from 'cnc7drawnccode';

const canvas = document.createElement('canvas');
const camera = new Camera();
const drawBoard = new DrawBoard(canvas, camera);
const propertySchema = new PropertySchemaProvider(drawBoard);

drawBoard.onSelectionChanged = (selectedObject) => {
	propertySchema.setObject(selectedObject);
	const schema = propertySchema.getSchema();
	renderHostPropertyPanel(schema);
};
```

`getSchema()` returns a plain object with this shape:

```js
{
	visible: true,
	mode: 'single',
	title: 'DrawCircle Properties',
	sections: [
		{
			type: 'group',
			title: 'Dimensions',
			children: [
				{
					type: 'field',
					id: 'property.field.1',
					label: 'Radius',
					inputType: 'number',
					value: '25.00',
					step: '0.1',
					min: undefined,
					closeOnEnter: true
				}
			]
		},
		{
			type: 'group',
			title: 'Appearance',
			children: [
				{
					type: 'field',
					id: 'editor.color',
					label: 'Color',
					inputType: 'text',
					value: 'red',
					closeOnEnter: true
				}
			]
		}
	],
	actions: [
		{ id: 'editor.ok', label: 'OK', role: 'primary' },
		{ id: 'editor.refresh', label: 'Refresh View' },
		{ id: 'editor.delete', label: 'Delete', role: 'danger' },
		{ id: 'editor.cut', label: 'Cut', role: 'warning' }
	]
}
```

Provider methods:

- `setObject(selectedObject)` updates the current selection context
- `getSchema()` returns the current property schema snapshot
- `applyFieldValue(fieldId, rawValue)` applies a field change such as radius, offset, angle, or color
- `runAction(actionId)` executes an action such as refresh, delete, cut, cancel, or a shape-specific action like deleting a constraint

Exported constants:

- `PropertySchemaFieldIds.COLOR`
- `PropertySchemaActionIds.OK`
- `PropertySchemaActionIds.REFRESH`
- `PropertySchemaActionIds.DELETE`
- `PropertySchemaActionIds.CUT`
- `PropertySchemaActionIds.CANCEL`

Implementation note: the provider returns plain data to host applications, but it currently derives some shape-specific sections by running the existing `buildProperties(editor)` implementations against an internal detached adapter. So the host UI is DOM-free, while the underlying shape property definitions stay backward-compatible.

### Native JavaScript Example

The following example shows a plain browser integration without React, Vue, or any other framework. It mounts the canvas, renders tool instructions from `ToolInstructionProvider`, and renders properties from `PropertySchemaProvider`.

```js
import {
	Camera,
	DrawBoard,
	MouseControl,
	MouseState,
	KeyboardManager,
	PropertySchemaProvider,
	ToolInstructionProvider
} from 'cnc7drawnccode';

const host = document.getElementById('editor-host');
host.style.position = 'relative';

const canvas = document.createElement('canvas');
canvas.width = 800;
canvas.height = 800;
canvas.style.width = '800px';
canvas.style.height = '800px';
canvas.style.backgroundColor = 'whitesmoke';
host.appendChild(canvas);

const toolPanel = document.createElement('div');
toolPanel.style.position = 'absolute';
toolPanel.style.top = '12px';
toolPanel.style.left = '50%';
toolPanel.style.transform = 'translateX(-50%)';
toolPanel.style.padding = '10px 16px';
toolPanel.style.background = 'rgba(40, 40, 40, 0.95)';
toolPanel.style.color = 'white';
toolPanel.style.borderRadius = '8px';
toolPanel.style.minWidth = '280px';
host.appendChild(toolPanel);

const propertyPanel = document.createElement('div');
propertyPanel.style.position = 'absolute';
propertyPanel.style.top = '20px';
propertyPanel.style.left = '20px';
propertyPanel.style.background = 'rgba(255, 255, 255, 0.95)';
propertyPanel.style.border = '1px solid #ccc';
propertyPanel.style.boxShadow = '2px 2px 10px rgba(0,0,0,0.2)';
propertyPanel.style.padding = '12px';
propertyPanel.style.minWidth = '240px';
host.appendChild(propertyPanel);

const camera = new Camera();
camera.moveX(canvas.width / 2);
camera.moveY(canvas.height / 2);

const drawBoard = new DrawBoard(canvas, camera);
const mouseControl = new MouseControl(host, drawBoard);
const keyboardManager = new KeyboardManager(mouseControl, drawBoard);
const toolInstructions = new ToolInstructionProvider(mouseControl);
const propertySchema = new PropertySchemaProvider(drawBoard);

function getMousePosition(event) {
	return {
		x: event.offsetX,
		y: event.offsetY,
		button: event.button
	};
}

function renderToolPanel() {
	const snapshot = toolInstructions.getSnapshot();
	toolPanel.innerHTML = '';

	if (!snapshot.visible) {
		toolPanel.style.display = 'none';
		return;
	}

	toolPanel.style.display = 'block';

	const title = document.createElement('div');
	title.textContent = snapshot.title;
	title.style.fontWeight = 'bold';
	title.style.marginBottom = '6px';
	toolPanel.appendChild(title);

	const instruction = document.createElement('div');
	instruction.textContent = snapshot.instruction;
	instruction.style.color = '#ddd';
	instruction.style.marginBottom = '8px';
	toolPanel.appendChild(instruction);

	for (const field of snapshot.fields) {
		const input = document.createElement('input');
		input.type = field.type || 'text';
		input.value = field.value;
		if (field.min !== undefined) input.min = field.min;
		if (field.step !== undefined) input.step = field.step;
		input.onchange = () => {
			toolInstructions.setFieldValue(field.id, input.value);
			renderToolPanel();
		};
		toolPanel.appendChild(input);
	}

	for (const action of snapshot.actions) {
		const button = document.createElement('button');
		button.textContent = action.label;
		button.onclick = () => {
			toolInstructions.runAction(action.id);
			renderToolPanel();
		};
		toolPanel.appendChild(button);
	}

	if (snapshot.output) {
		const output = document.createElement('textarea');
		output.readOnly = true;
		output.value = snapshot.output.value;
		output.placeholder = snapshot.output.placeholder;
		output.style.width = '100%';
		output.style.height = '120px';
		output.style.marginTop = '8px';
		toolPanel.appendChild(output);
	}

	if (snapshot.status) {
		const status = document.createElement('div');
		status.textContent = snapshot.status.text;
		status.style.marginTop = '8px';
		status.style.color = snapshot.status.tone === 'error' ? '#ff8a80' : '#b7f7c5';
		toolPanel.appendChild(status);
	}
}

function renderPropertyNode(node, parent) {
	if (node.type === 'group') {
		const group = document.createElement('div');
		group.style.marginBottom = '10px';
		group.style.padding = '5px';
		group.style.border = '1px solid #eee';

		if (node.title) {
			const heading = document.createElement('h4');
			heading.textContent = node.title;
			heading.style.margin = '0 0 6px 0';
			group.appendChild(heading);
		}

		for (const child of node.children || []) {
			renderPropertyNode(child, group);
		}

		parent.appendChild(group);
		return;
	}

	if (node.type === 'text') {
		const text = document.createElement('p');
		text.textContent = node.text;
		parent.appendChild(text);
		return;
	}

	if (node.type === 'field') {
		const row = document.createElement('div');
		row.style.marginBottom = '6px';

		const label = document.createElement('label');
		label.textContent = `${node.label}: `;
		label.style.display = 'inline-block';
		label.style.width = '90px';

		const input = document.createElement('input');
		input.type = node.inputType || 'text';
		input.value = node.value;
		if (node.step !== undefined) input.step = node.step;
		if (node.min !== undefined) input.min = node.min;
		input.onchange = () => {
			propertySchema.applyFieldValue(node.id, input.value);
			renderPropertyPanel();
		};

		row.appendChild(label);
		row.appendChild(input);
		parent.appendChild(row);
		return;
	}

	if (node.type === 'action') {
		const button = document.createElement('button');
		button.textContent = node.label;
		button.onclick = () => {
			propertySchema.runAction(node.id);
			renderPropertyPanel();
		};
		parent.appendChild(button);
	}
}

function renderPropertyPanel() {
	const schema = propertySchema.getSchema();
	propertyPanel.innerHTML = '';

	if (!schema.visible) {
		propertyPanel.style.display = 'none';
		return;
	}

	propertyPanel.style.display = 'block';

	const title = document.createElement('h3');
	title.textContent = schema.title;
	title.style.marginTop = '0';
	propertyPanel.appendChild(title);

	for (const section of schema.sections) {
		renderPropertyNode(section, propertyPanel);
	}

	const actions = document.createElement('div');
	actions.style.display = 'flex';
	actions.style.flexWrap = 'wrap';
	actions.style.gap = '6px';

	for (const action of schema.actions) {
		const button = document.createElement('button');
		button.textContent = action.label;
		button.onclick = () => {
			propertySchema.runAction(action.id);
			renderPropertyPanel();
		};
		actions.appendChild(button);
	}

	propertyPanel.appendChild(actions);
}

drawBoard.onSelectionChanged = (selectedObject) => {
	propertySchema.setObject(selectedObject);
	renderPropertyPanel();
};

const previousOnStateChange = mouseControl.onStateChange;
mouseControl.onStateChange = () => {
	if (typeof previousOnStateChange === 'function') {
		previousOnStateChange();
	}
	renderToolPanel();
};

canvas.addEventListener('contextmenu', (event) => event.preventDefault());
canvas.addEventListener('click', (event) => mouseControl.mouseClicked(getMousePosition(event)));
canvas.addEventListener('mousedown', (event) => mouseControl.mouseDown(getMousePosition(event)));
canvas.addEventListener('mouseup', (event) => mouseControl.mouseUp(getMousePosition(event)));
canvas.addEventListener('mousemove', (event) => mouseControl.mouseMove(getMousePosition(event)));

mouseControl.setState(MouseState.SELECT);
drawBoard.draw();
renderToolPanel();
renderPropertyPanel();
```

### Recommendation

For integration into another project, the better long-term design is:

- use `View3D` only for a quick drop-in demo or simple embedding
- use `DrawBoard` + `MouseControl` with your own framework UI for production editor integration

That keeps this module responsible for drawing, geometry, constraints, and tool state, while the outer application controls layout, styling, docking, and user guidance.

For a quick demo, this project can be run using a Docker image as a web application with a FastAPI backend.

## Run as a Web Application (Docker)

Make sure you have Docker installed and Docker Compose.

```bash
# Build and start the backend/web server
docker-compose up -d --build
```

You can then view the application in your browser at:
`http://localhost:8000/`

Changes in the code (both `/src` and `/backend`) will hot-reload automatically. 
