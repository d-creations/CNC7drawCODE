from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import logging

app = FastAPI(title="CNC7drawCODE Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)

class SampleRequest(BaseModel):
    message: str

repo_root = Path(__file__).resolve().parent.parent

# Optional: if you have endpoints under /api avoid clash with static files
@app.get("/api/status")
async def status():
    return {"service": "CNC7drawCODE Backend", "status": "ok"}

@app.post("/api/hello")
async def hello(req: SampleRequest):
    logging.info(f"Received message: {req.message}")
    if req.message == "":
        raise HTTPException(status_code=400, detail="Empty message not allowed")
    return {"reply": f"Hello, you said: {req.message}"}

# Serve the static folders used by the frontend
if (repo_root / "src").exists():
    app.mount("/src", StaticFiles(directory=str(repo_root / "src")), name="src")
if (repo_root / "css").exists():
    app.mount("/css", StaticFiles(directory=str(repo_root / "css")), name="css")
if (repo_root / "assets").exists():
    app.mount("/assets", StaticFiles(directory=str(repo_root / "assets")), name="assets")

# Serve the index.html at root
@app.get("/")
async def serve_index():
    index_path = repo_root / "index.html"
    if index_path.exists():
        return FileResponse(index_path)
    return {"error": "index.html not found"}
# don't get a 404 when the FastAPI backend is the same origin as the frontend.
@app.get("/favicon.svg")
async def favicon_svg():
    # Look for files in repository root and public/ (deployment may copy to either)
    repo_root = Path(__file__).resolve().parents[1]
    candidates = [repo_root / "favicon.svg", repo_root / "public" / "favicon.svg"]
    checked = []
    for p in candidates:
        exists = p.exists()
        checked.append({"path": str(p), "exists": exists})
        logging.info("favicon check: %s exists=%s", p, exists)
        if exists:
            return FileResponse(p, media_type="image/svg+xml")
    # None found — include the checked paths in the error detail to aid debugging
    detail = {"error": "favicon.svg not found", "checked": checked, "cwd": str(Path.cwd())}
    logging.warning("favicon.svg not found; checked: %s", checked)
    raise HTTPException(status_code=404, detail=detail)


@app.get("/favicon.ico")
async def favicon_ico():
    # Prefer an existing .ico file, but fall back to converted PNG if present.
    repo_root = Path(__file__).resolve().parents[1]
    candidates = [repo_root / "favicon.ico", repo_root / "public" / "favicon.ico"]
    checked = []
    for p in candidates:
        exists = p.exists()
        checked.append({"path": str(p), "exists": exists})
        logging.info("favicon.ico check: %s exists=%s", p, exists)
        if exists:
            return FileResponse(p, media_type="image/x-icon")
    detail = {"error": "favicon.ico not found", "checked": checked, "cwd": str(Path.cwd())}
    logging.warning("favicon.ico not found; checked: %s", checked)
    raise HTTPException(status_code=404, detail=detail)
