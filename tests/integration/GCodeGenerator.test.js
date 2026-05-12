import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { ConstraintSystem } from '../../src/domain/constraints/ConstraintSystem.js';
import { GCodeGenerator } from '../../src/domain/cam/GCodeGenerator.js';

describe('CAM G-code generator', () => {
    it('emits linear G1 moves through ordered points', () => {
        const system = new ConstraintSystem();
        const p1 = system.addGeometry({ id: 'p1', type: 'Point', data: { x: 0, y: 0 }, fixed: false });
        const p2 = system.addGeometry({ id: 'p2', type: 'Point', data: { x: 10, y: 0 }, fixed: false });
        const p3 = system.addGeometry({ id: 'p3', type: 'Point', data: { x: 10, y: 5 }, fixed: false });

        const generator = new GCodeGenerator(system, { includeFooter: false });
        const gcode = generator.generatePath({ startPointId: p1, sequenceIds: [p2, p3] });

        assert.equal(
            gcode,
            ['G21', 'G90', 'G17', 'G0 X0 Y0', 'G1 X10 Y0', 'G1 X10 Y5'].join('\n')
        );
    });

    it('orients connected lines and arcs and emits incremental I J values', () => {
        const system = new ConstraintSystem();
        system.addGeometry({ id: 'p1', type: 'Point', data: { x: 0, y: 0 }, fixed: false });
        system.addGeometry({ id: 'p2', type: 'Point', data: { x: 10, y: 0 }, fixed: false });
        system.addGeometry({ id: 'p3', type: 'Point', data: { x: 20, y: 10 }, fixed: false });
        system.addGeometry({ id: 'c1', type: 'Point', data: { x: 10, y: 10 }, fixed: false });
        system.addGeometry({ id: 'l1', type: 'Line', data: { start: 'p2', end: 'p1' }, fixed: false });
        system.addGeometry({ id: 'a1', type: 'Arc', data: { center: 'c1', start: 'p2', end: 'p3', r: 10, startAngle: -Math.PI / 2, endAngle: 0 }, fixed: false });

        const generator = new GCodeGenerator(system, { includeFooter: false });
        const gcode = generator.generatePath({ startPointId: 'p1', sequenceIds: ['l1', 'a1'] });

        assert.equal(
            gcode,
            ['G21', 'G90', 'G17', 'G0 X0 Y0', 'G1 X10 Y0', 'G3 X20 Y10 I0 J10'].join('\n')
        );
    });

    it('splits full circles into two arc moves using incremental center offsets', () => {
        const system = new ConstraintSystem();
        system.addGeometry({ id: 'p1', type: 'Point', data: { x: 10, y: 0 }, fixed: false });
        system.addGeometry({ id: 'c1', type: 'Point', data: { x: 0, y: 0 }, fixed: false });
        system.addGeometry({ id: 'circle1', type: 'Circle', data: { center: 'c1', r: 10 }, fixed: false });

        const generator = new GCodeGenerator(system, { includeFooter: false, rapidToStart: false });
        const gcode = generator.generatePath({ startPointId: 'p1', sequenceIds: ['circle1'] });

        assert.equal(
            gcode,
            ['G21', 'G90', 'G17', 'G2 X-10 Y0 I-10 J0', 'G2 X10 Y0 I10 J0'].join('\n')
        );
    });
});