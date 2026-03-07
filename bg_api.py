"""
Free background removal API using open-source rembg (U²-Net model).

Install:
    pip install -r requirements-rembg.txt

Run:
    uvicorn bg_api:app --host 0.0.0.0 --port 8000

Usage:
    POST /remove-bg  with file upload → returns PNG with transparent background
    GET  /health      → health check
"""

from fastapi import FastAPI, UploadFile
from fastapi.responses import StreamingResponse, JSONResponse
from rembg import remove
import io

app = FastAPI(title="Background Removal API")


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/remove-bg")
async def remove_background(file: UploadFile):
    input_bytes = await file.read()
    output_bytes = remove(input_bytes)
    return StreamingResponse(
        io.BytesIO(output_bytes),
        media_type="image/png",
    )
