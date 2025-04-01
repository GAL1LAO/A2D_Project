import time
import cv2
import requests

# API endpoints
INTERVAL_API_URL = "https://tms.deebugger.de/bd34634c-0876-4f8f-b506-2e6cf19d34be/api/camera/settings/"
UPLOAD_API_URL = "https://tms.deebugger.de/bd34634c-0876-4f8f-b506-2e6cf19d34be/api/camera/capture/"
TOKEN = "36e87200-ee38-48da-bba5-aecdaf40584f"

def fetch_capture_interval():
    try:
        print(f"Fetching settings...")
        response = requests.get(INTERVAL_API_URL, timeout=5)
        response.raise_for_status()
        data = response.json()
        return data.get("capture_interval", 360)  # Default to 360s if not provided
    except requests.RequestException as e:
        print(f"Error fetching capture interval: {e}")
        return 360  # Fallback to default

def capture_image():
    cap = cv2.VideoCapture(0, cv2.CAP_V4L2)
    if not cap.isOpened():
        print("Error: Could not open camera.")
        return None

    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 2048)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 1536)

    _, _ = cap.read()

    time.sleep(3)

    ret, frame = cap.read()
    cap.release()

    frame = cv2.rotate(frame, cv2.ROTATE_180)

    if ret:
        filename = "../capture.jpg"
        cv2.imwrite(filename, frame)
        return filename
    else:
        print("Error: Could not capture image.")
        return None

def upload_image(image_path):
    try:
        with open(image_path, "rb") as file:
            files = {"file": ("img_1.jpg", file, "image/jpeg")}
            data = {"token": TOKEN}
            response = requests.post(UPLOAD_API_URL, files=files, data=data)
            response.raise_for_status()
            print("Upload response:", response.status_code)
    except requests.RequestException as e:
        print(f"Error uploading image: {e}")


def main():
    next_capture_time = time.time()
    capture_interval = fetch_capture_interval()

    while True:
        time.sleep(5)
        new_interval = fetch_capture_interval()
        if new_interval != capture_interval:
            print(f"Capture interval updated: {new_interval} seconds")
            capture_interval = new_interval
            next_capture_time = 0

        if time.time() >= next_capture_time:
            print("Capturing image...")
            image_path = capture_image()
            if image_path:
                upload_image(image_path)
            next_capture_time = time.time() + capture_interval


if __name__ == "__main__":
    main()
