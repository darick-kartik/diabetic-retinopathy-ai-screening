
import hashlib
import io
import uuid

from pathlib import Path

from fastapi import UploadFile
from PIL import Image, UnidentifiedImageError


# Project root directory
BASE_DIR = Path(__file__).resolve().parents[3]

# Original retinal image storage directory
IMAGE_STORAGE_DIR = BASE_DIR / "storage" / "retinal_images"

# Maximum upload size: 10 MB
MAX_IMAGE_SIZE = 10 * 1024 * 1024

# Supported actual image formats
ALLOWED_FORMATS = {
    "JPEG": {
        "extension": ".jpg",
        "content_type": "image/jpeg"
    },
    "PNG": {
        "extension": ".png",
        "content_type": "image/png"
    }
}


async def validate_and_store_image(upload_file: UploadFile) -> dict:
    """
    Validate and store an original retinal image.

    Returns metadata required for the database record.
    """

    if not upload_file.filename:
        raise ValueError("Filename is required.")

    # Read at most 10 MB + 1 byte to enforce the size limit
    image_bytes = await upload_file.read(MAX_IMAGE_SIZE + 1)

    if not image_bytes:
        raise ValueError("Uploaded file is empty.")

    if len(image_bytes) > MAX_IMAGE_SIZE:
        raise ValueError("Image size cannot exceed 10 MB.")

    try:
        # Verify the actual image content
        with Image.open(io.BytesIO(image_bytes)) as image:
            image_format = image.format

            if image_format not in ALLOWED_FORMATS:
                raise ValueError("Only JPEG and PNG images are supported.")

            image.verify()

    except (UnidentifiedImageError, OSError, Image.DecompressionBombError):
        raise ValueError("Uploaded file is not a valid image.")

    image_info = ALLOWED_FORMATS[image_format]

    # Generate a unique storage filename
    stored_filename = f"{uuid.uuid4().hex}{image_info['extension']}"

    # Create storage directory if it does not exist
    IMAGE_STORAGE_DIR.mkdir(parents=True, exist_ok=True)

    storage_path = IMAGE_STORAGE_DIR / stored_filename

    # Calculate SHA-256 checksum of original image bytes
    checksum = hashlib.sha256(image_bytes).hexdigest()

    try:
        # Store original bytes without modification
        with storage_path.open("xb") as image_file:
            image_file.write(image_bytes)

    except Exception:
        if storage_path.exists():
            storage_path.unlink()
        raise

    return {
        "filename": stored_filename,
        "storage_path": str(storage_path.resolve()),
        "content_type": image_info["content_type"],
        "file_size_bytes": len(image_bytes),
        "checksum": checksum
    }
