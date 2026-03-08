import os
import io
import logging
from fastapi import FastAPI, HTTPException, Request, Header
from fastapi.responses import Response
from rembg import remove, new_session
from PIL import Image

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="MyFamousFinds Background Removal Service")

MODEL_NAME = os.getenv("REMBG_MODEL", "birefnet-general")
session = None

@app.on_event("startup")
async def startup_event():
    global session
    logger.info(f"Loading rembg model: {MODEL_NAME}")
    session = new_session(MODEL_NAME)
    logger.info("Model loaded successfully")

@app.get("/health")
async def health():
    return {"status": "ok", "model": MODEL_NAME}

@app.post("/remove-bg")
async def remove_background(
    request: Request,
    x_api_key: str = Header(None)
):
    api_key = os.getenv("REMOVAL_API_KEY")
    if api_key and x_api_key != api_key:
        raise HTTPException(status_code=401, detail="Unauthorized")

    content_type = request.headers.get("content-type", "")
    if not content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Content-Type must be an image type (image/jpeg, image/png, etc.)")

    try:
        input_bytes = await request.body()
        if not input_bytes:
            raise HTTPException(status_code=400, detail="Empty request body")

        logger.info(f"Processing image: {len(input_bytes)} bytes")
        output_bytes = remove(input_bytes, session=session)

        img = Image.open(io.BytesIO(output_bytes))
        img.verify()

        logger.info(f"Background removed successfully, output: {len(output_bytes)} bytes")
        return Response(content=output_bytes, media_type="image/png")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Background removal failed: {e}")
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")
