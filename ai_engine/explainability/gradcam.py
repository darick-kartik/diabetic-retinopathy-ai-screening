
from pathlib import Path
from uuid import uuid4

import cv2
import numpy as np
import torch
from PIL import Image

from ai_engine.inference.predictor import (
    load_model,
    IMAGE_TRANSFORM,
    DEVICE,
    CLASS_NAMES,
    IMAGE_SIZE,
)
from ai_engine.preprocessing.fundus import preprocess_fundus_image


PROJECT_ROOT = Path(__file__).resolve().parents[2]

GRADCAM_STORAGE_DIR = PROJECT_ROOT / "storage" / "gradcam"


def generate_gradcam(
    image_path: str | Path,
    target_grade: int | None = None,
) -> dict:
    """
    Generate a Grad-CAM visualization for EfficientNet-B0 V2.

    If target_grade is not supplied, the model's predicted
    class is used.

    Grad-CAM visualizes model attention, not confirmed
    retinal lesions or clinical explanations.
    """

    image_path = Path(image_path)

    if not image_path.is_file():
        raise FileNotFoundError(
            f"Retinal image not found: {image_path}"
        )

    if target_grade is not None and target_grade not in CLASS_NAMES:
        raise ValueError("Target grade must be between 0 and 4.")

    # Apply exactly the same preprocessing used during inference.
    processed_image = preprocess_fundus_image(
        image_path=image_path,
        image_size=IMAGE_SIZE,
        black_threshold=10,
        margin_ratio=0.025,
    )

    image_tensor = IMAGE_TRANSFORM(processed_image)
    image_tensor = image_tensor.unsqueeze(0).to(DEVICE)

    model = load_model()
    target_layer = model.features[-1]

    activations = {}
    gradients = {}

    def forward_hook(module, inputs, output):
        activations["value"] = output

        output.register_hook(
            lambda grad: gradients.update({"value": grad})
        )

    hook_handle = target_layer.register_forward_hook(forward_hook)

    try:
        model.zero_grad(set_to_none=True)

        with torch.enable_grad():
            logits = model(image_tensor)

            probabilities = torch.softmax(logits, dim=1)

            predicted_grade = int(
                torch.argmax(probabilities, dim=1).item()
            )

            selected_grade = (
                predicted_grade
                if target_grade is None
                else target_grade
            )

            score = logits[0, selected_grade]
            score.backward()

        activation = activations["value"].detach()
        gradient = gradients["value"].detach()

        # Calculate channel importance weights.
        weights = gradient.mean(
            dim=(2, 3),
            keepdim=True,
        )

        # Weighted combination of feature maps.
        cam = torch.sum(
            weights * activation,
            dim=1,
        )

        cam = torch.relu(cam)

        cam = torch.nn.functional.interpolate(
            cam.unsqueeze(1),
            size=(IMAGE_SIZE, IMAGE_SIZE),
            mode="bilinear",
            align_corners=False,
        )

        cam = cam[0, 0].cpu().numpy()

        # Normalize heatmap to [0, 1].
        cam_min = float(cam.min())
        cam_max = float(cam.max())

        if cam_max - cam_min > 1e-8:
            cam = (cam - cam_min) / (cam_max - cam_min)
        else:
            cam = np.zeros_like(cam)

        # Convert heatmap to an RGB visualization.
        heatmap_uint8 = np.uint8(cam * 255)

        heatmap_bgr = cv2.applyColorMap(
            heatmap_uint8,
            cv2.COLORMAP_JET,
        )

        heatmap_rgb = cv2.cvtColor(
            heatmap_bgr,
            cv2.COLOR_BGR2RGB,
        )

        original_rgb = np.array(
            processed_image.convert("RGB")
        )

        # Blend heatmap with the processed retinal image.
        overlay = cv2.addWeighted(
            original_rgb,
            0.55,
            heatmap_rgb,
            0.45,
            0,
        )

        # Save visualization separately from the original image.
        GRADCAM_STORAGE_DIR.mkdir(
            parents=True,
            exist_ok=True,
        )

        output_path = (
            GRADCAM_STORAGE_DIR
            / f"gradcam_{uuid4().hex}.png"
        )

        Image.fromarray(overlay).save(output_path)

        return {
            "gradcam_path": str(output_path.resolve()),
            "predicted_grade": predicted_grade,
            "target_grade": selected_grade,
            "target_class": CLASS_NAMES[selected_grade],
            "class_probabilities": {
                CLASS_NAMES[index]: round(
                    float(probabilities[0, index].item()),
                    6,
                )
                for index in range(len(CLASS_NAMES))
            },
            "visualization_type": "Grad-CAM",
            "research_only": True,
        }

    finally:
        hook_handle.remove()
        model.zero_grad(set_to_none=True)
