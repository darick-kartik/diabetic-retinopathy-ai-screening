
from pathlib import Path

import numpy as np
from PIL import Image, ImageOps


def crop_black_borders(
    image: Image.Image,
    threshold: int = 10,
    margin_ratio: float = 0.025,
) -> Image.Image:
    """
    Crop unnecessary dark borders while preserving a margin
    around the detected retinal field.
    """

    if not 0 <= threshold <= 255:
        raise ValueError("Threshold must be between 0 and 255.")

    if not 0 <= margin_ratio <= 0.2:
        raise ValueError("Margin ratio must be between 0 and 0.2.")

    rgb_image = image.convert("RGB")
    grayscale = np.array(rgb_image.convert("L"))

    # Detect pixels brighter than the dark-border threshold.
    mask = grayscale > threshold

    # Avoid aggressive cropping if the image is mostly dark.
    if mask.mean() < 0.10:
        return rgb_image

    y_coordinates, x_coordinates = np.where(mask)

    left = int(x_coordinates.min())
    right = int(x_coordinates.max()) + 1
    top = int(y_coordinates.min())
    bottom = int(y_coordinates.max()) + 1

    width = right - left
    height = bottom - top

    # Preserve a small margin around the detected retinal field.
    margin = int(max(width, height) * margin_ratio)

    left = max(0, left - margin)
    top = max(0, top - margin)
    right = min(rgb_image.width, right + margin)
    bottom = min(rgb_image.height, bottom + margin)

    return rgb_image.crop((left, top, right, bottom))


def resize_with_padding(
    image: Image.Image,
    image_size: int = 224,
) -> Image.Image:
    """
    Resize an image without distorting its aspect ratio.
    Add black padding to create a square image.
    """

    if image_size <= 0:
        raise ValueError("Image size must be positive.")

    image = image.convert("RGB")

    resized = ImageOps.contain(
        image,
        (image_size, image_size),
        method=Image.Resampling.LANCZOS,
    )

    canvas = Image.new(
        "RGB",
        (image_size, image_size),
        color=(0, 0, 0),
    )

    x_offset = (image_size - resized.width) // 2
    y_offset = (image_size - resized.height) // 2

    canvas.paste(resized, (x_offset, y_offset))

    return canvas


def preprocess_fundus_image(
    image_path: str | Path,
    image_size: int = 224,
    black_threshold: int = 10,
    margin_ratio: float = 0.025,
) -> Image.Image:
    """
    Complete baseline preprocessing pipeline.

    Original image -> RGB -> border crop ->
    aspect-ratio-preserving resize -> square padding.
    """

    image_path = Path(image_path)

    if not image_path.is_file():
        raise FileNotFoundError(
            f"Fundus image not found: {image_path}"
        )

    with Image.open(image_path) as source:
        image = source.convert("RGB")

    cropped = crop_black_borders(
        image,
        threshold=black_threshold,
        margin_ratio=margin_ratio,
    )

    processed = resize_with_padding(
        cropped,
        image_size=image_size,
    )

    return processed
