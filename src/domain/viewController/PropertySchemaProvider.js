import { AppConfig } from '../core/Config.js';

export const PropertySchemaActionIds = {
    OK: 'editor.ok',
    REFRESH: 'editor.refresh',
    DELETE: 'editor.delete',
    CUT: 'editor.cut',
    CANCEL: 'editor.cancel'
};

export const PropertySchemaFieldIds = {
    COLOR: 'editor.color'
};

function isHeadingTag(tagName) {
    return /^H[1-6]$/.test(tagName);
}

function createTextNode(text) {
    return {
        type: 'text',
        text
    };
}

class SchemaEditorAdapter {
    constructor(provider) {
        this.provider = provider;
        this.drawBoard = provider.drawBoard;
        this.container = document.createElement('div');
    }

    render() {
        this.provider.rebuildSchema();
    }

    buildPointFields(pointObj, labelPrefix) {
        const divArea = document.createElement('div');
        divArea.style.marginBottom = '10px';
        divArea.style.padding = '5px';
        divArea.style.border = '1px solid #eee';
        divArea.innerHTML = `<h4 style="margin:0 0 5px 0">${labelPrefix}</h4>`;

        const xInput = this.createNumberField('X', pointObj.vec4.x, (val) => {
            pointObj.vec4.x = val;
            if (pointObj.constraintId) {
                const geo = this.drawBoard.constraintSystem.geometries.get(pointObj.constraintId);
                if (geo) {
                    geo.data.x = val;
                    this.drawBoard.constraintSystem.solveLocal(pointObj.constraintId);
                    this.drawBoard.saveState();
                }
            }
            this.drawBoard.draw();
        });

        const yInput = this.createNumberField('Y', pointObj.vec4.y, (val) => {
            pointObj.vec4.y = val;
            if (pointObj.constraintId) {
                const geo = this.drawBoard.constraintSystem.geometries.get(pointObj.constraintId);
                if (geo) {
                    geo.data.y = val;
                    this.drawBoard.constraintSystem.solveLocal(pointObj.constraintId);
                    this.drawBoard.saveState();
                }
            }
            this.drawBoard.draw();
        });

        divArea.appendChild(xInput);
        divArea.appendChild(yInput);
        this.container.appendChild(divArea);
    }

    createNumberField(name, value, onChangeCallback) {
        const fieldId = this.provider.createDynamicFieldId();
        this.provider.fieldHandlers.set(fieldId, onChangeCallback);

        const div = document.createElement('div');
        div.dataset.propertySchemaNode = 'field';
        div.dataset.propertyFieldId = fieldId;
        div.style.marginBottom = '5px';

        const lbl = document.createElement('label');
        lbl.innerText = `${name}: `;
        lbl.style.display = 'inline-block';
        lbl.style.width = '80px';

        const inp = document.createElement('input');
        inp.type = 'number';
        inp.step = AppConfig.drawBoard.minStep;
        inp.value = parseFloat(value).toFixed(AppConfig.drawBoard.coordPrecision);
        inp.dataset.propertySchemaInputType = 'number';
        inp.dataset.propertySchemaCloseOnEnter = 'true';

        div.appendChild(lbl);
        div.appendChild(inp);
        return div;
    }
}

export class PropertySchemaProvider {
    constructor(drawBoard) {
        this.drawBoard = drawBoard;
        this.selectedObject = null;
        this.currentSchema = this.createHiddenSchema();
        this.fieldHandlers = new Map();
        this.actionHandlers = new Map();
        this.nextFieldId = 1;
        this.nextActionId = 1;
    }

    createHiddenSchema() {
        return {
            visible: false,
            mode: 'none',
            title: '',
            sections: [],
            actions: []
        };
    }

    createDynamicFieldId() {
        const id = `property.field.${this.nextFieldId}`;
        this.nextFieldId += 1;
        return id;
    }

    createDynamicActionId() {
        const id = `property.action.${this.nextActionId}`;
        this.nextActionId += 1;
        return id;
    }

    setObject(obj) {
        if (this.selectedObject === obj) {
            return;
        }
        this.selectedObject = obj;
        this.rebuildSchema();
    }

    getSchema() {
        return this.currentSchema;
    }

    rebuildSchema() {
        this.fieldHandlers.clear();
        this.actionHandlers.clear();
        this.nextFieldId = 1;
        this.nextActionId = 1;

        if (!this.selectedObject) {
            this.currentSchema = this.createHiddenSchema();
            return this.currentSchema;
        }

        if (Array.isArray(this.selectedObject) && this.selectedObject.length > 1) {
            this.currentSchema = {
                visible: true,
                mode: 'multi',
                title: `${this.selectedObject.length} Objects Selected`,
                sections: [],
                actions: [
                    { id: PropertySchemaActionIds.DELETE, label: 'Delete', role: 'danger' },
                    { id: PropertySchemaActionIds.CUT, label: 'Cut', role: 'warning' },
                    { id: PropertySchemaActionIds.CANCEL, label: 'Cancel' }
                ]
            };
            return this.currentSchema;
        }

        const activeObj = Array.isArray(this.selectedObject) ? this.selectedObject[0] : this.selectedObject;
        const adapter = new SchemaEditorAdapter(this);
        if (typeof activeObj.buildProperties === 'function') {
            activeObj.buildProperties(adapter);
        }

        const sections = this.parseChildren(adapter.container);
        sections.push(this.buildColorSection(activeObj));

        this.currentSchema = {
            visible: true,
            mode: 'single',
            title: `${activeObj.constructor.name} Properties`,
            sections,
            actions: [
                { id: PropertySchemaActionIds.OK, label: 'OK', role: 'primary' },
                { id: PropertySchemaActionIds.REFRESH, label: 'Refresh View' },
                { id: PropertySchemaActionIds.DELETE, label: 'Delete', role: 'danger' },
                { id: PropertySchemaActionIds.CUT, label: 'Cut', role: 'warning' }
            ]
        };

        return this.currentSchema;
    }

    buildColorSection(activeObj) {
        this.fieldHandlers.set(PropertySchemaFieldIds.COLOR, (value) => {
            activeObj.defaultColor = value;
            activeObj.changeColor(value);
            this.drawBoard.draw();
        });

        return {
            type: 'group',
            title: 'Appearance',
            children: [
                {
                    type: 'field',
                    id: PropertySchemaFieldIds.COLOR,
                    label: 'Color',
                    inputType: 'text',
                    value: activeObj.color,
                    closeOnEnter: true
                }
            ]
        };
    }

    parseChildren(container) {
        const nodes = [];
        for (const child of Array.from(container.childNodes)) {
            const parsed = this.parseNode(child);
            if (Array.isArray(parsed)) {
                nodes.push(...parsed);
            } else if (parsed) {
                nodes.push(parsed);
            }
        }
        return nodes;
    }

    parseNode(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent.trim();
            return text ? createTextNode(text) : null;
        }

        if (node.nodeType !== Node.ELEMENT_NODE) {
            return null;
        }

        if (node.dataset.propertySchemaNode === 'field') {
            return this.parseFieldNode(node);
        }

        if (node.tagName === 'BUTTON') {
            return this.parseButtonNode(node);
        }

        if (node.tagName === 'P') {
            return createTextNode(node.textContent.trim());
        }

        if (isHeadingTag(node.tagName)) {
            return {
                type: 'heading',
                level: Number(node.tagName.slice(1)),
                text: node.textContent.trim()
            };
        }

        if (node.tagName === 'DIV') {
            return this.parseGroupNode(node);
        }

        const text = node.textContent.trim();
        return text ? createTextNode(text) : null;
    }

    parseFieldNode(node) {
        const label = node.querySelector('label')?.textContent.replace(/:\s*$/, '') || 'Value';
        const input = node.querySelector('input');
        return {
            type: 'field',
            id: node.dataset.propertyFieldId,
            label,
            inputType: input?.dataset.propertySchemaInputType || input?.type || 'text',
            value: input?.value ?? '',
            step: input?.step || undefined,
            min: input?.min || undefined,
            closeOnEnter: input?.dataset.propertySchemaCloseOnEnter === 'true'
        };
    }

    parseButtonNode(node) {
        const actionId = this.createDynamicActionId();
        if (typeof node.onclick === 'function') {
            this.actionHandlers.set(actionId, node.onclick);
        }
        return {
            type: 'action',
            id: actionId,
            label: node.textContent.trim()
        };
    }

    parseGroupNode(node) {
        let title = null;
        const children = [];

        for (const child of Array.from(node.childNodes)) {
            const parsed = this.parseNode(child);
            if (!parsed) {
                continue;
            }

            if (!title && !Array.isArray(parsed) && parsed.type === 'heading') {
                title = parsed.text;
                continue;
            }

            if (Array.isArray(parsed)) {
                children.push(...parsed);
            } else {
                children.push(parsed);
            }
        }

        return {
            type: 'group',
            title,
            children
        };
    }

    applyFieldValue(fieldId, rawValue) {
        const handler = this.fieldHandlers.get(fieldId);
        if (!handler) {
            return false;
        }

        if (fieldId === PropertySchemaFieldIds.COLOR) {
            handler(String(rawValue));
        } else {
            const numericValue = parseFloat(rawValue);
            if (Number.isNaN(numericValue)) {
                return false;
            }
            handler(numericValue);
        }

        this.syncSelectedObject();
        this.rebuildSchema();
        return true;
    }

    runAction(actionId) {
        if (actionId === PropertySchemaActionIds.OK || actionId === PropertySchemaActionIds.CANCEL) {
            this.setObject(null);
            return true;
        }

        if (actionId === PropertySchemaActionIds.REFRESH) {
            this.drawBoard.draw();
            this.rebuildSchema();
            return true;
        }

        if (actionId === PropertySchemaActionIds.DELETE) {
            if (Array.isArray(this.selectedObject)) {
                for (const obj of this.selectedObject) {
                    this.drawBoard.deleteObject(obj);
                }
            } else if (this.selectedObject) {
                this.drawBoard.deleteObject(this.selectedObject);
            }
            this.setObject(null);
            return true;
        }

        if (actionId === PropertySchemaActionIds.CUT) {
            const objsToCut = Array.isArray(this.selectedObject) ? this.selectedObject : [this.selectedObject];
            this.drawBoard.cutObjects(objsToCut);
            this.setObject(null);
            return true;
        }

        const handler = this.actionHandlers.get(actionId);
        if (!handler) {
            return false;
        }

        handler({ preventDefault() {}, stopPropagation() {} });
        this.syncSelectedObject();
        this.rebuildSchema();
        return true;
    }

    syncSelectedObject() {
        if (!this.selectedObject) {
            return;
        }

        if (Array.isArray(this.selectedObject)) {
            const remaining = this.selectedObject.filter((obj) => this.drawBoard.drawObjects.includes(obj));
            this.selectedObject = remaining.length > 0 ? remaining : null;
            return;
        }

        if (!this.drawBoard.drawObjects.includes(this.selectedObject)) {
            this.selectedObject = null;
        }
    }
}