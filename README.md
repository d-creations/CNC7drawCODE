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
