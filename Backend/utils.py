import json
import cv2


def resize_with_aspect_ratio(image, max_size=800):
    image = image.copy()
    h, w = image.shape[:2]
    if w > h:
        new_w = max_size
        new_h = int((h / w) * max_size)
    else:
        new_h = max_size
        new_w = int((w / h) * max_size)
    return cv2.resize(image, (new_w, new_h))

def read_config(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            config = json.load(file)
        return config
    except FileNotFoundError:
        print(f"Error: Configuration file '{file_path}' not found.")
        return None
    except json.JSONDecodeError:
        print(f"Error: Invalid JSON format in '{file_path}'.")
        return None