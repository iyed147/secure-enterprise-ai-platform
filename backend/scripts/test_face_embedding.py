"""
Test Step 5.1 : détection MediaPipe + embedding DeepFace, en isolation.
Usage : python scripts/test_face_embedding.py <chemin_image_1> <chemin_image_2>
Compare deux images : si ce sont deux photos de la même personne, la distance doit être basse.
Si ce sont deux personnes différentes, la distance doit être nettement plus haute.
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import cv2
import mediapipe as mp
import numpy as np
from deepface import DeepFace

mp_face_detection = mp.solutions.face_detection


def detect_and_crop_face(image_path: str) -> np.ndarray:
    image = cv2.imread(image_path)
    if image is None:
        raise ValueError(f"Impossible de lire l'image : {image_path}")

    with mp_face_detection.FaceDetection(model_selection=1, min_detection_confidence=0.6) as detector:
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        results = detector.process(rgb_image)

        if not results.detections:
            raise ValueError(f"Aucun visage détecté dans : {image_path}")
        if len(results.detections) > 1:
            print(f"⚠️  Plusieurs visages détectés dans {image_path}, on prend le premier.")

        detection = results.detections[0]
        bbox = detection.location_data.relative_bounding_box
        h, w, _ = image.shape

        x = max(0, int(bbox.xmin * w))
        y = max(0, int(bbox.ymin * h))
        bw = int(bbox.width * w)
        bh = int(bbox.height * h)

        face_crop = image[y:y + bh, x:x + bw]
        return face_crop


def get_embedding(image_path: str) -> np.ndarray:
    face_crop = detect_and_crop_face(image_path)
    result = DeepFace.represent(
        img_path=face_crop,
        model_name="Facenet",
        enforce_detection=False,  # on a déjà détecté/cadré via MediaPipe
    )
    return np.array(result[0]["embedding"])


def main():
    if len(sys.argv) < 3:
        print("Usage: python scripts/test_face_embedding.py <image_1> <image_2>")
        sys.exit(1)

    img1_path, img2_path = sys.argv[1], sys.argv[2]

    print(f"\n🔍 Traitement de {img1_path}...")
    emb1 = get_embedding(img1_path)
    print(f"   Dimension: {len(emb1)}")

    print(f"\n🔍 Traitement de {img2_path}...")
    emb2 = get_embedding(img2_path)
    print(f"   Dimension: {len(emb2)}")

    distance = np.linalg.norm(emb1 - emb2)
    print(f"\n📏 Distance euclidienne: {distance:.4f}")
    print("   (Référence approximative Facenet: <10 = même personne probable, >10 = personnes différentes probable)")


if __name__ == "__main__":
    main()