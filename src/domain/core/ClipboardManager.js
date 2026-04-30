import { Vec4 } from '../viewController/Camera.js';
import { Point } from '../shapes/Point.js';
import { DrawLine } from '../shapes/DrawLine.js';
import { DrawCircle } from '../shapes/DrawCircle.js';
import { DrawArc } from '../shapes/DrawArc.js';

export class ClipboardManager {
    constructor(drawBoard) {
        this.drawBoard = drawBoard;
        this.clipboard = [];
        this.clipboardCenter = { x: 0, y: 0 };
    }

    cutObjects(objects) {
        this.clipboard = [];
        
        // 1. Export exact state from Constraint System
        let exportedJSON = this.drawBoard.constraintSystem.exportJSON();
        let exportedGeometries = exportedJSON.geometries;
        
        // 2. Identify the core constraint IDs 
        let validIds = objects.filter(o => o.constraintId).map(o => o.constraintId);
        
        // 3. Serialize copies of only the cut objects into clipboard memory
        for (let id of validIds) {
            let geoMatch = exportedGeometries.find(g => g.id === id);
            if (geoMatch) {
                // deep clone
                this.clipboard.push(JSON.parse(JSON.stringify(geoMatch)));
            }
        }
        
        // 4. Extract dependent internal geometries (e.g. Points attached to Cut Lines)
        for (let cutDef of this.clipboard) {
            if (cutDef.type === "Line") {
                let p1 = exportedGeometries.find(g => g.id === cutDef.data.start);
                let p2 = exportedGeometries.find(g => g.id === cutDef.data.end);
                if (p1 && !this.clipboard.find(c => c.id === p1.id)) this.clipboard.push(JSON.parse(JSON.stringify(p1)));
                if (p2 && !this.clipboard.find(c => c.id === p2.id)) this.clipboard.push(JSON.parse(JSON.stringify(p2)));
            } else if (cutDef.type === "Circle") {
                let pC = exportedGeometries.find(g => g.id === cutDef.data.center);
                if (pC && !this.clipboard.find(c => c.id === pC.id)) this.clipboard.push(JSON.parse(JSON.stringify(pC)));
            } else if (cutDef.type === "Arc") {
                let pC = exportedGeometries.find(g => g.id === cutDef.data.center);
                if (pC && !this.clipboard.find(c => c.id === pC.id)) this.clipboard.push(JSON.parse(JSON.stringify(pC)));
            }
        }
        
        // Calculate center for dropping
        let pts = this.clipboard.filter(c => c.type === "Point");
        if (pts.length > 0) {
            let sumX = 0, sumY = 0;
            for (let pt of pts) {
                sumX += pt.data.x;
                sumY += pt.data.y;
            }
            this.clipboardCenter = { x: sumX / pts.length, y: sumY / pts.length };
        } else {
            this.clipboardCenter = { x: 0, y: 0 };
        }

        // 5. Physically delete the shapes from the board
        for (let obj of objects) {
             this.drawBoard.deleteObject(obj);
        }
    }

    insertClipboard(worldX, worldY) {
        if (!this.clipboard || this.clipboard.length === 0) return;
        
        let offsetX = worldX !== undefined ? worldX - this.clipboardCenter.x : 20;
        let offsetY = worldY !== undefined ? worldY - this.clipboardCenter.y : 20;

        let idMapping = {}; // Old Geo ID -> newly generated Geo ID
        
        // First pass: Spawn Points with a slight manual offset
        for (let c of this.clipboard) {
            if (c.type === "Point") {
                let newId = this.drawBoard.constraintSystem.addGeometry({
                    type: "Point",
                    data: { x: c.data.x + offsetX, y: c.data.y + offsetY },
                    fixed: false // don't freeze pasted clones
                });
                idMapping[c.id] = newId;
            }
        }
        
        // Second pass: Spawn Shapes relying on spawned Points
        for (let c of this.clipboard) {
            if (c.type === "Line") {
                let nStart = idMapping[c.data.start];
                let nEnd = idMapping[c.data.end];
                if (nStart && nEnd) {
                    this.drawBoard.constraintSystem.addGeometry({
                        type: "Line",
                        data: { start: nStart, end: nEnd },
                        fixed: c.fixed
                    });
                }
            } else if (c.type === "Circle") {
                let nCenter = idMapping[c.data.center];
                if (nCenter) {
                    this.drawBoard.constraintSystem.addGeometry({
                        type: "Circle",
                        data: { center: nCenter, r: c.data.r },
                        fixed: c.fixed
                    });
                }
            } else if (c.type === "Arc") {
                let nCenter = idMapping[c.data.center];
                if (nCenter) {
                    this.drawBoard.constraintSystem.addGeometry({
                        type: "Arc",
                        data: { center: nCenter, r: c.data.r, startAngle: c.data.startAngle, endAngle: c.data.endAngle },
                        fixed: c.fixed
                    });
                }
            }
        }
        
        // Finalize
        this.drawBoard.saveState(); // Saves the constraint state into Storage

        // Manually flush purely visual states without invoking 'clearAll()' which wipes Storage
        this.drawBoard.drawObjects = [];
        this.drawBoard.clearTempObjects();
        this.drawBoard.hoverObj = null;
        if(this.drawBoard.onSelectionChanged) {
            this.drawBoard.onSelectionChanged(null);
        }

        // Rehydrate visuals from Storage
        this.drawBoard.loadState();     
        this.drawBoard.draw();
    }

    getPreviewObjects(worldX, worldY) {
        if (!this.clipboard || this.clipboard.length === 0) return [];
        let offsetX = worldX - this.clipboardCenter.x;
        let offsetY = worldY - this.clipboardCenter.y;
        
        let previewGeoms = [];
        let previewIdMap = {};
        
        let idCounter = -1; // Negative IDs to strictly separate from main constraint system
        let getPreviewId = () => idCounter--;

        // Points
        for(let c of this.clipboard) {
            if(c.type === "Point") {
                let px = c.data.x + offsetX;
                let py = c.data.y + offsetY;
                let pt = new Point(new Vec4(px, py, 0, 1));
                pt.highlighted = true;
                let pid = getPreviewId();
                previewIdMap[c.id] = { geom: pt, id: pid };
                previewGeoms.push(pt);
            }
        }
        
        // Lines/Circles
        for(let c of this.clipboard) {
            if(c.type === "Line") {
                let p1 = previewIdMap[c.data.start];
                let p2 = previewIdMap[c.data.end];
                if(p1 && p2) {
                    let line = new DrawLine(p1.geom, p2.geom);
                    line.id = getPreviewId();
                    line.highlighted = true;
                    previewGeoms.push(line);
                }
            } else if (c.type === "Circle") {
                let pc = previewIdMap[c.data.center];
                if (pc) {
                    let circ = new DrawCircle(pc.geom, c.data.r);
                    circ.id = getPreviewId();
                    circ.highlighted = true;
                    previewGeoms.push(circ);
                }
            } else if (c.type === "Arc") {
                let pc = previewIdMap[c.data.center];
                if (pc) {
                    let arc = new DrawArc(pc.geom, c.data.r, c.data.startAngle, c.data.endAngle);
                    arc.id = getPreviewId();
                    arc.highlighted = true;
                    previewGeoms.push(arc);
                }
            }
        }
        
        return previewGeoms;
    }
}
