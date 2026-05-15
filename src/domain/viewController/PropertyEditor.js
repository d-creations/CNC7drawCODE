import { PropertySchemaActionIds, PropertySchemaProvider } from './PropertySchemaProvider.js';

/**
 * Handles the UI for editing properties of the currently selected drawing object.
 */
export class PropertyEditor {
    constructor(parentDiv, drawBoard) {
        this.parentDiv = parentDiv;
        this.drawBoard = drawBoard;
        this.schemaProvider = new PropertySchemaProvider(drawBoard);
        
        this.container = document.createElement('div');
        this.container.className = "property-editor";
        this.container.style.position = "absolute";
        this.container.style.top = "20px";
        this.container.style.left = "20px";
        this.container.style.border = "1px solid #ccc";
        this.container.style.padding = "10px";
        this.container.style.boxShadow = "2px 2px 10px rgba(0,0,0,0.2)";
        this.container.style.backgroundColor = "rgba(255, 255, 255, 0.9)";
        this.container.style.minHeight = "150px";
        this.container.style.display = "none";
        this.container.style.zIndex = "1000";

        this.parentDiv.style.position = "relative";
        this.parentDiv.appendChild(this.container);
        
        this.selectedObject = null;
        this.render();
    }
    
    setObject(obj) {
        if (this.selectedObject === obj) return;
        this.selectedObject = obj;
        this.schemaProvider.setObject(obj);
        this.render();
    }
    
    render() {
        this.container.innerHTML = '';
        const schema = this.schemaProvider.getSchema();
        if (!schema.visible) {
             this.container.style.display = "none";
             return;
        }
        this.container.style.display = "block";

        let title = document.createElement('h3');
        title.innerText = schema.title;
        title.style.marginTop = "0";
        this.container.appendChild(title);

        for (const section of schema.sections) {
            const sectionNode = this.renderNode(section);
            if (sectionNode) {
                this.container.appendChild(sectionNode);
            }
        }

        let buttonArea = document.createElement('div');
        buttonArea.style.marginTop = "15px";
        buttonArea.style.display = "flex";
        buttonArea.style.flexWrap = "wrap";
        buttonArea.style.gap = "5px";

        for (const action of schema.actions) {
            buttonArea.appendChild(this.renderAction(action));
        }
        
        this.container.appendChild(buttonArea);
    }

    renderNode(node) {
        if (!node) {
            return null;
        }

        if (node.type === 'group') {
            const div = document.createElement('div');
            div.style.marginBottom = '10px';
            div.style.padding = '5px';
            div.style.border = '1px solid #eee';

            if (node.title) {
                const heading = document.createElement('h4');
                heading.style.margin = '0 0 5px 0';
                heading.innerText = node.title;
                div.appendChild(heading);
            }

            for (const child of node.children || []) {
                const childNode = this.renderNode(child);
                if (childNode) {
                    div.appendChild(childNode);
                }
            }
            return div;
        }

        if (node.type === 'text') {
            const paragraph = document.createElement('p');
            paragraph.innerText = node.text;
            return paragraph;
        }

        if (node.type === 'field') {
            return this.renderField(node);
        }

        if (node.type === 'action') {
            return this.renderAction(node);
        }

        return null;
    }

    renderField(field) {
        const div = document.createElement('div');
        div.style.marginBottom = '5px';

        const label = document.createElement('label');
        label.innerText = `${field.label}: `;
        label.style.display = 'inline-block';
        label.style.width = '80px';

        const input = document.createElement('input');
        input.type = field.inputType || 'text';
        input.value = field.value;
        if (field.step !== undefined) input.step = field.step;
        if (field.min !== undefined) input.min = field.min;
        input.onchange = () => {
            this.schemaProvider.applyFieldValue(field.id, input.value);
            this.selectedObject = this.schemaProvider.selectedObject;
            this.render();
        };
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.schemaProvider.applyFieldValue(field.id, input.value);
                this.selectedObject = this.schemaProvider.selectedObject;
                if (field.closeOnEnter) {
                    this.schemaProvider.runAction(PropertySchemaActionIds.OK);
                    this.selectedObject = this.schemaProvider.selectedObject;
                }
                this.render();
            }
        });

        div.appendChild(label);
        div.appendChild(input);
        return div;
    }

    renderAction(action) {
        const button = document.createElement('button');
        button.innerText = action.label;
        button.style.padding = '4px 8px';
        button.style.cursor = 'pointer';

        if (action.role === 'primary') {
            button.style.backgroundColor = '#4CAF50';
            button.style.color = 'white';
            button.style.border = 'none';
        } else if (action.role === 'danger') {
            button.style.backgroundColor = '#ff4444';
            button.style.color = 'white';
            button.style.border = 'none';
        } else if (action.role === 'warning') {
            button.style.backgroundColor = '#ff9800';
            button.style.color = 'white';
            button.style.border = 'none';
        }

        button.onclick = () => {
            this.schemaProvider.runAction(action.id);
            this.selectedObject = this.schemaProvider.selectedObject;
            this.render();
        };

        return button;
    }
}