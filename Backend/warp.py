import json
import cv2
import numpy as np
import tempfile
import os
import requests
from utils import read_config


def order_points(pts):
    pts = pts.reshape(4, 2)
    rect = np.zeros((4, 2), dtype="float32")
    s = pts.sum(axis=1)
    rect[0] = pts[np.argmin(s)]  # top left
    rect[2] = pts[np.argmax(s)]  # bottom right
    diff = np.diff(pts, axis=1).flatten()
    rect[1] = pts[np.argmin(diff)]  # top right
    rect[3] = pts[np.argmax(diff)]  # bottom left
    return rect


def process_images_from_urls(urls, save_debug_images=True, debug_folder="debug_images"):
    """
    Process images from URLs, detect screens, and return temporary files.
    
    Args:
        urls (dict): Dictionary with keys as image names and values as URLs.
                    Example: {"First_Photo": "http://...", "Second_Photo": "http://..."}
        save_debug_images (bool): If True, save copies of images to debug_folder
        debug_folder (str): Folder to save debug images for testing
    
    Returns:
        dict: Dictionary with same keys as input and values as temporary file paths
    """
    config = read_config("conf.json")["systems"][str(1)]
    result_files = {}
    
    # Create debug folder if it doesn't exist and saving is enabled
    if save_debug_images:
        os.makedirs(debug_folder, exist_ok=True)
    
    for image_name, url in urls.items():
        # Download image from URL
        response = requests.get(url)
        if response.status_code != 200:
            print(f"Failed to download image from {url}")
            continue
            
        # Create a temporary file
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.jpg')
        temp_file.write(response.content)
        temp_file.close()
        
        # Read the downloaded image
        image = cv2.imread(temp_file.name)
        if image is None:
            print(f"Failed to read image from {url}")
            os.unlink(temp_file.name)  # Delete the temporary file
            continue
            
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        
        # Edge detection
        edges = cv2.Canny(blurred, 
                          config["screen_detection"]["min_thresh"], 
                          config["screen_detection"]["max_thresh"])
        
        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        found_screen = False
        for contour in contours:
            epsilon = 0.1 * cv2.arcLength(contour, True)
            approx = cv2.approxPolyDP(contour, epsilon, True)
            
            if len(approx) == 4:
                x, y, w, h = cv2.boundingRect(approx)
                width_min = config["screen_detection"]["width_def"] * (1 - config["screen_detection"]["dim_tolerance"])
                width_max = config["screen_detection"]["width_def"] * (1 + config["screen_detection"]["dim_tolerance"])
                height_min = config["screen_detection"]["height_def"] * (1 - config["screen_detection"]["dim_tolerance"])
                height_max = config["screen_detection"]["height_def"] * (1 + config["screen_detection"]["dim_tolerance"])
                
                if (width_min < w < width_max and height_min < h < height_max):
                    pts1 = order_points(approx)
                    pts2 = np.float32([[0, 0], [w-1, 0], [w-1, h-1], [0, h-1]])
                    matrix = cv2.getPerspectiveTransform(pts1, pts2)
                    warped = cv2.warpPerspective(image, matrix, (w, h))
                    
                    # Create a new temporary file for the processed image
                    processed_temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.jpg')
                    processed_temp_file.close()
                    
                    cv2.imwrite(processed_temp_file.name, warped)
                    result_files[image_name] = processed_temp_file.name
                    
                    # Save debug copy if enabled
                    if save_debug_images:
                        debug_filename = os.path.join(debug_folder, f"{image_name}_processed.jpg")
                        cv2.imwrite(debug_filename, warped)
                        print(f"Saved processed debug image to: {debug_filename}")
                    
                    found_screen = True
                    break
        
        # If no screen found, use the original image
        if not found_screen:
            result_files[image_name] = temp_file.name
            
            # Save original debug copy if enabled
            if save_debug_images:
                debug_filename = os.path.join(debug_folder, f"{image_name}_original.jpg")
                cv2.imwrite(debug_filename, image)
                print(f"Saved original debug image to: {debug_filename}")
        else:
            # Delete the original temporary file if we created a processed one
            os.unlink(temp_file.name)
    print("dictionary from warp.py")        
    print(result_files)
    return result_files
'''
if __name__ == "__main__":
    # Example usage:
    
    #For development: Save locally and don't upload
    #generate_excel(save_locally=True, upload_url=None)
    
    # For production: Upload without saving locally
    # generate_excel(save_locally=False, upload_url="https://your-upload-endpoint.com/upload")
    
    # For testing: Both save locally and upload
    process_images_from_urls(
        urls = {
            "First_Photo": "https://tms.deebugger.de/bd34634c-0876-4f8f-b506-2e6cf19d34be/First_photo_used.png",
            "Second_Photo": "https://tms.deebugger.de/bd34634c-0876-4f8f-b506-2e6cf19d34be/api/frontend/image/?id=2&most_recent",
            "Third_Photo": "https://tms.deebugger.de/bd34634c-0876-4f8f-b506-2e6cf19d34be/api/frontend/image/?id=3&most_recent",
            "Overview_Page": "https://tms.deebugger.de/bd34634c-0876-4f8f-b506-2e6cf19d34be/api/frontend/image/?id=4&most_recent"
        }
    )'''