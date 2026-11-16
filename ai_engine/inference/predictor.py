
from pathlib import Path

import torch
import torch.nn as nn
from PIL import Image
from torchvision import models, transforms

from ai_engine.preprocessing.fundus import preprocess_fundus_image


# --------------------------------------------------
# Configuration
# --------------------------------------------------

PROJECT_ROOT = Path(__file__).resolve().parents[2]

CHECKPOINT_PATH = (
    PROJECT_ROOT
    / "checkpoints"
    / "efficientnet_b0_v2_best.pth"
)

IMAGE_SIZE = 224
NUM_CLASSES = 5

DEVICE = torch.device("cpu")

CLASS_NAMES = {
    0: "No DR",
    1: "Mild NPDR",
    2: "Moderate NPDR",
    3: "Severe NPDR",
    4: "Proliferative DR",
}

# ImageNet normalization used during training.
IMAGE_TRANSFORM = transforms.Compose([
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225],
    ),
])


# --------------------------------------------------
# Model loader
# --------------------------------------------------

_model = None


def load_model():
    """
    Load the trained EfficientNet-B0 V2 model.
    The model is loaded only once.
    """

    global _model

    if _model is not None:
        return _model

    if not CHECKPOINT_PATH.is_file():
        raise FileNotFoundError(
            f"Model checkpoint not found: {CHECKPOINT_PATH}"
        )

    model = models.efficientnet_b0(weights=None)

    model.classifier[1] = nn.Linear(
        in_features=1280,
        out_features=NUM_CLASSES,
    )

    checkpoint = torch.load(
        CHECKPOINT_PATH,
        map_location=DEVICE,
        weights_only=False,
    )

    if "model_state_dict" not in checkpoint:
        raise KeyError(
            "Checkpoint does not contain 'model_state_dict'."
        )

    model.load_state_dict(
        checkpoint["model_state_dict"],
        strict=True,
    )

    model.to(DEVICE)
    model.eval()

    _model = model

    return _model


# --------------------------------------------------
# Image preparation
# --------------------------------------------------

def prepare_image(image_path: str | Path):
    """
    Apply the same fundus preprocessing used during training
    and convert the image into a normalized tensor.
    """

    processed_image = preprocess_fundus_image(
        image_path=image_path,
        image_size=IMAGE_SIZE,
        black_threshold=10,
        margin_ratio=0.025,
    )

    image_tensor = IMAGE_TRANSFORM(processed_image)

    # Add batch dimension: [1, 3, 224, 224]
    image_tensor = image_tensor.unsqueeze(0)

    return image_tensor.to(DEVICE)


# --------------------------------------------------
# Prediction
# --------------------------------------------------

def predict_retinal_image(image_path: str | Path):
    """
    Predict one of the five diabetic retinopathy grades.

    This is a research prediction, not a clinical diagnosis.
    """

    model = load_model()

    image_tensor = prepare_image(image_path)

    with torch.inference_mode():
        logits = model(image_tensor)

        probabilities = torch.softmax(
            logits,
            dim=1,
        )[0]

    predicted_grade = int(
        torch.argmax(probabilities).item()
    )

    class_scores = {
        CLASS_NAMES[index]: round(
            float(probabilities[index].item()),
            6,
        )
        for index in range(NUM_CLASSES)
    }

    return {
        "predicted_grade": predicted_grade,
        "predicted_class": CLASS_NAMES[predicted_grade],
        "confidence": round(
            float(probabilities[predicted_grade].item()),
            6,
        ),
        "class_probabilities": class_scores,
        "model_name": "EfficientNet-B0",
        "model_version": "V2",
        "device": str(DEVICE),
        "research_only": True,
        "human_review_required": True,
        "clinical_warning": (
            "Research prototype only. This prediction is not "
            "a medical diagnosis and requires qualified "
            "medical review."
        ),
    }
