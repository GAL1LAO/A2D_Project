import os
import base64
import pandas as pd
from openai import OpenAI
from dotenv import load_dotenv
from io import StringIO, BytesIO
import time
import requests

# Load API key from .env file
load_dotenv()
api_key = os.getenv("OPENAI_API_KEY")
upload_token = os.getenv("UPLOAD_TOKEN")
# Initialize client with API key
client = OpenAI(api_key=api_key)

# Function to handle both local and URL images
def get_image_data(image_path):
    """
    Get image data from either a local file path or URL
    """
    if image_path.startswith(('http://', 'https://')):
        try:
            # It's a URL, download the image
            response = requests.get(image_path)
            response.raise_for_status()  # Raise exception for bad status codes
            return response.content
        except Exception as e:
            print(f"Error downloading image from URL: {str(e)}")
            raise
    else:
        # It's a local file path
        try:
            with open(image_path, "rb") as image_file:
                return image_file.read()
        except Exception as e:
            print(f"Error reading local image file: {str(e)}")
            raise

# Function to process image and extract data with retry logic
def process_image(image_path, prompt, sheet_name, max_retries=3):
    print(f"Processing image: {image_path}")
    
    for attempt in range(1, max_retries + 1):
        print(f"Attempt {attempt} of {max_retries}")
        
        try:
            # For URL images, we can pass the URL directly to the API
            if image_path.startswith(('http://', 'https://')):
                # Make API request with URL
                response = client.responses.create(
                    model="gpt-4o",
                    input=[
                        {
                            "role": "user",
                            "content": [
                                { "type": "input_text", "text": prompt },
                                {
                                    "type": "input_image",
                                    "image_url": image_path,
                                },
                            ],
                        }
                    ],
                    temperature=0.1,  # Lower temperature for more deterministic results
                )
            else:
                # For local files, encode and use base64
                image_data = get_image_data(image_path)
                base64_image = base64.b64encode(image_data).decode("utf-8")
                
                # Make API request with base64 encoded image
                response = client.responses.create(
                    model="gpt-4o",
                    input=[
                        {
                            "role": "user",
                            "content": [
                                { "type": "input_text", "text": prompt },
                                {
                                    "type": "input_image",
                                    "image_url": f"data:image/jpeg;base64,{base64_image}",
                                },
                            ],
                        }
                    ],
                    temperature=0.1,
                )
            
            # Get the response text
            csv_text = response.output_text
            
            # Log response for debugging
            print(f"Response length: {len(csv_text)} characters")
            
            # Clean up the response if needed (remove markdown code blocks if present)
            if csv_text.startswith("```csv"):
                csv_text = csv_text.replace("```csv", "").replace("```", "").strip()
            
            # Parse based on the format (try both methods)
            try:
                # Try reading as a standard CSV first
                df = pd.read_csv(StringIO(csv_text))
            except:
                # If that fails, parse it manually by splitting each line
                lines = csv_text.strip().split('\n')
                data = []
                for line in lines:
                    if ',' in line:
                        # Split only on the first comma to handle values that may contain commas
                        parameter, value = line.split(',', 1)
                        data.append({"Parameter": parameter.strip(), "Value": value.strip()})
                
                df = pd.DataFrame(data)
            
            # Check if the dataframe is empty or has only one row/column
            if len(df) <= 1 or len(df.columns) <= 1:
                print(f"Warning: Extracted data has insufficient rows/columns ({len(df)} rows, {len(df.columns)} columns)")
                
                if attempt < max_retries:
                    print("Retrying with a more explicit prompt...")
                    # Enhance the prompt for retry
                    prompt = prompt + " WICHTIG: Das Bild enthält mehrere Informationen. Stelle sicher, dass du ALLE Daten extrahierst und als Parameter-Wert-Paare zurückgibst."
                    time.sleep(2)  # Add a small delay before retrying
                    continue
                else:
                    print(f"Failed to extract sufficient data after {max_retries} attempts")
            
            # For overview image, check for sufficient key-value pairs
            if sheet_name == "Overview_Page" and len(df) < 15:  # Adjust threshold as needed
                print(f"Warning: Overview image data has only {len(df)} rows, which is less than the expected minimum of 15")
                
                if attempt < max_retries:
                    print("Retrying with a more explicit prompt for overview...")
                    # Further enhance the prompt to emphasize all expected keys
                    prompt = prompt + " WICHTIG: Es müssen ALLE genannten Schlüssel gefunden werden. Stelle sicher, dass du mindestens 15 Schlüssel-Wert-Paare extrahierst."
                    time.sleep(2)
                    continue
            
            print(f"Successfully extracted {len(df)} rows of data with {len(df.columns)} columns")
            return df
            
        except Exception as e:
            print(f"Error during processing: {str(e)}")
            if attempt < max_retries:
                print("Retrying after short delay...")
                time.sleep(3)  # Add a delay before retrying
            else:
                print(f"Failed after {max_retries} attempts")
                # Return an empty dataframe with proper columns as fallback
                return pd.DataFrame(columns=["Parameter", "Value"])
    
    # This should only be reached if all attempts failed without raising an exception
    print("All attempts failed to produce valid data")
    return pd.DataFrame(columns=["Parameter", "Value"])

# Function to upload Excel file to a given URL
'''def upload_excel_file(file_data, upload_url, filename=None, params=None, headers=None):
    """
    Upload an Excel file to a specified URL
    
    Args:
        file_data: Excel file as bytes
        upload_url: URL to upload the file to
        filename: Name of the file to use in the upload (default: 'data.xlsx')
        params: Additional URL parameters (optional)
        headers: Additional headers (optional)
        
    Returns:
        Response object from the request
    """
    if filename is None:
        filename = 'data.xlsx'
        
    if headers is None:
        headers = {}
        
    # Create the file object for uploading
    files = {'file': (filename, file_data, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
    
    try:
        # Make the POST request to upload the file
        response = requests.post(upload_url, files=files, data=params, headers=headers)
        response.raise_for_status()  # Raise exception for error status codes
        print(f"Successfully uploaded file to {upload_url}")
        print(f"Response status: {response.status_code}, {response.text}")
        return response
    except Exception as e:
        print(f"Error uploading file: {str(e)}")
        raise'''
def upload_excel(upload_url, file_path, token):
    with open(file_path, "rb") as file:
        files = {"file": ("file.xlsx", file, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
        data = {"token": token}
        response = requests.post(upload_url, files=files, data=data)
        print(response.text)

def generate_excel(urls=None, output_path=None, upload_url=None, save_locally=True, return_bytes=False):
    """
    Process images from URLs, generate Excel file, and optionally upload it.
    
    Args:
        urls: Dictionary containing image URLs and their prompts
        output_path: Path where to save the Excel file locally
        upload_url: URL to upload the Excel file to
        save_locally: Whether to save the file locally (default: True)
        return_bytes: If True, return the Excel data as bytes instead of saving to file
        
    Returns:
        If return_bytes is True, returns the Excel file as bytes
        If upload_url is provided, returns the response from the upload
        Otherwise returns the path to the saved Excel file
    """
    # Use default URLs if not provided
    if urls is None:
        urls = {
            "First_Photo": "https://tms.deebugger.de/bd34634c-0876-4f8f-b506-2e6cf19d34be/api/frontend/image/?id=1&most_recent",
            "Second_Photo": "https://tms.deebugger.de/bd34634c-0876-4f8f-b506-2e6cf19d34be/api/frontend/image/?id=2&most_recent",
            "Third_Photo": "https://tms.deebugger.de/bd34634c-0876-4f8f-b506-2e6cf19d34be/api/frontend/image/?id=3&most_recent",
            "Overview_Page": "https://tms.deebugger.de/bd34634c-0876-4f8f-b506-2e6cf19d34be/api/frontend/image/?id=4&most_recent"
        }
    
    # Use default output path if not provided and save_locally is True
    if output_path is None and save_locally:
        output_path = "/Users/adrian/Documents/Masters/Pre-Master/TMS/A2D_Project/all_extracted_data_with_overview_w_url.xlsx"
    
    # Define image prompts
    image_configs = [
        {
            "path": urls["First_Photo"],
            "prompt": "Welche Daten sind in diesem Bild? Bitte analysiere das bereitgestellte Bild und extrahiere alle Daten. ALLE!!!. ohne Kaskadierung und in einer csv-format mit nur zwei spalten für schlüssel-wert-paare. Diese Spalten heißen 'Parameter' und 'Wert'.",
            "sheet_name": "First_Photo"
        },
        {
            "path": urls["Second_Photo"],
            "prompt": "Welche Daten sind in diesem Bild? Bitte analysiere das bereitgestellte Bild und extrahiere alle Daten. ALLE!!!. ohne Kaskadierung und in einer csv-format mit nur zwei spalten für schlüssel-wert-paare. Diese Spalten heißen 'Parameter' und 'Wert'.",
            "sheet_name": "Second_Photo"
        },
        {
            "path": urls["Third_Photo"],
            "prompt": "Welche Daten sind in diesem Bild? Bitte analysiere das bereitgestellte Bild und extrahiere alle Daten. ALLE!!!. ohne Kaskadierung und in einer csv-format mit nur zwei spalten für schlüssel-wert-paare. Diese Spalten heißen 'Parameter' und 'Wert'.",
            "sheet_name": "Third_Photo"
        }
    ]

    # Create a dictionary to store all dataframes
    all_dfs = {}

    # Process each of the first three images
    for img in image_configs:
        df = process_image(img["path"], img["prompt"], img["sheet_name"], max_retries=3)
        all_dfs[img["sheet_name"]] = df

    # Define a more specific and structured prompt for the overview image
    overview_prompt = """Was ist in diesem Bild? Bitte analysiere das bereitgestellte Bild und extrahiere die Daten. 
                 ALLE schlüssel-wert-paare, die zu den folgenden schlüssel gehören 'Laufzeit Heute' 'Vorrat' 'Gesamt Heute' 'Gesamt Gestern' 'Aktuell', 'LR1', 'Pumpe', 'Betriebsst. F TR' 'Betriebsst. F LR2' 'Betriebsst. F LR1' 'Betriebsst. GRL TR1' 'Betriebsst. GRL TR2' 'Betriebsst. GRL TR3' 'Betriebsst. VG Pumpe' 'Betriebsst. Fackel' 'Betriebsst. BHKW' 'Gas Gesamt BHKW' !!!. 
                 ohne Kaskadierung und in einer csv-format
                 WICHTIG: Antworte NUR mit einer sauberen CSV-Tabelle ohne Einleitung und ohne Abschlusstext."""

    # Process the overview image separately with the special prompt
    print("Processing overview image...")
    overview_df = process_image(urls["Overview_Page"], overview_prompt, "Overview_Page", max_retries=5)  # More retries for overview
    all_dfs["Overview_Page"] = overview_df

    # Generate Excel file in memory first (needed for both saving and uploading)
    output_buffer = BytesIO()
    
    # Create Excel writer using the BytesIO buffer
    with pd.ExcelWriter(output_buffer, engine='xlsxwriter') as writer:
        # Write each dataframe to a different sheet
        for sheet_name, df in all_dfs.items():
            df.to_excel(writer, sheet_name=sheet_name, index=False)
    
    # Get the bytes from the BytesIO object
    output_buffer.seek(0)
    excel_bytes = output_buffer.getvalue()
    
    # Save locally if requested
    if save_locally and output_path:
        # Save to local file
        with open(output_path, 'wb') as f:
            f.write(excel_bytes)
        
        print(f"Excel file saved locally to: {output_path}")
        
        # Display a sample of each dataframe
        for sheet_name, df in all_dfs.items():
            print(f"\nSample data from {sheet_name}:")
            print(df.head())
            print(f"Total rows in {sheet_name}: {len(df)}")
    
    # Upload to URL if provided
    if upload_url:
        try:
            # Extract filename from the output path or use default
            filename = 'data.xlsx'
            if output_path:
                filename = os.path.basename(output_path)
                
            # Upload the file
            print(f"Uploading Excel file to: {upload_url}")
            #response = upload_excel_file(excel_bytes, upload_url, params, filename=filename)
            response = upload_excel(upload_url, output_path, upload_token)
            print("Upload completed successfully!")
            
            # Return the response if no other return mode is specified
            if not return_bytes and not save_locally:
                return response
        except Exception as e:
            print(f"Error during upload: {str(e)}")
            # Continue execution to return file bytes or path as appropriate
    
    # Return based on specified mode
    if return_bytes:
        return excel_bytes
    elif save_locally and output_path:
        return output_path
    else:
        # Default case if no other return mode specified
        return None

# This conditional ensures the code runs only when the script is executed directly
if __name__ == "__main__":
    # Example usage:
    
    #For development: Save locally and don't upload
    #generate_excel(save_locally=True, upload_url=None)
    
    # For production: Upload without saving locally
    # generate_excel(save_locally=False, upload_url="https://your-upload-endpoint.com/upload")
    
    # For testing: Both save locally and upload
    generate_excel(
        save_locally=True, 
        upload_url="https://tms.deebugger.de/bd34634c-0876-4f8f-b506-2e6cf19d34be/api/backend/results/",
        output_path="/Users/adrian/Documents/Masters/Pre-Master/TMS/A2D_Project/all_extracted_data_with_overview_w_url.xlsx"
    )