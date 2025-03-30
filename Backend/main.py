import os
import base64
import pandas as pd
from openai import OpenAI
from dotenv import load_dotenv
from io import StringIO
import time

# Load API key from .env file
load_dotenv()
api_key = os.getenv("OPENAI_API_KEY")

# Initialize client with API key
client = OpenAI(api_key=api_key)

# Function to encode the image - ensure consistent encoding
def encode_image(image_path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode("utf-8")

# Function to process image with retry mechanism
def process_image(image_path, prompt, sheet_name, retries=3):
    print(f"Processing image: {image_path}")
    
    for attempt in range(retries):
        try:
            # Getting the Base64 string
            base64_image = encode_image(image_path)
            
            # Make API request with more specific parameters
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
                # Add temperature parameter for more consistency
                temperature=0.1,  # Lower temperature = more deterministic results
            )
            
            # Get the response text
            csv_text = response.output_text
            
            # Log the response for debugging
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
            
            print(f"Extracted {len(df)} rows of data")
            
            # If we got fewer than expected rows for the overview image, retry
            if sheet_name == "Overview_Page" and len(df) < 15:  # Adjust threshold as needed
                print(f"Got only {len(df)} rows for overview, which is less than expected. Retrying...")
                time.sleep(2)  # Add a delay before retrying
                continue
                
            return df
            
        except Exception as e:
            print(f"Attempt {attempt+1} failed: {str(e)}")
            if attempt < retries - 1:
                print("Retrying after a short delay...")
                time.sleep(2)  # Add a delay before retrying
            else:
                print("All retries failed.")
                # Return an empty DataFrame with the expected columns
                return pd.DataFrame({"Parameter": [], "Value": []})

# Define paths for images - update these to your actual paths
# Use the Pictures subdirectory as in your updated code
base_dir = "/Users/adrian/Documents/Masters/Pre-Master/TMS/A2D_Project/Pictures"

# Define image paths and prompts for the first three images
images = [
    {
        "path": os.path.join(base_dir, "First_photo_used.png"),
        "prompt": "Welche Daten sind in diesem Bild? Bitte analysiere das bereitgestellte Bild und extrahiere alle Daten. ALLE!!!. ohne Kaskadierung und in einer csv-format mit nur zwei spalten für schlüssel-wert-paare. Diese Spalten heißen 'Parameter' und 'Wert'.",
        "sheet_name": "First_Photo"
    },
    {
        "path": os.path.join(base_dir, "second_photo_used.png"),
        "prompt": "Welche Daten sind in diesem Bild? Bitte analysiere das bereitgestellte Bild und extrahiere alle Daten. ALLE!!!. ohne Kaskadierung und in einer csv-format mit nur zwei spalten für schlüssel-wert-paare. Diese Spalten heißen 'Parameter' und 'Wert'.",
        "sheet_name": "Second_Photo"
    },
    {
        "path": os.path.join(base_dir, "drittes-foto.jpg"),
        "prompt": "Welche Daten sind in diesem Bild? Bitte analysiere das bereitgestellte Bild und extrahiere alle Daten. ALLE!!!. ohne Kaskadierung und in einer csv-format mit nur zwei spalten für schlüssel-wert-paare. Diese Spalten heißen 'Parameter' und 'Wert'.",
        "sheet_name": "Third_Photo"
    }
]

# Create a dictionary to store all dataframes
all_dfs = {}

# Process each of the first three images
for img in images:
    df = process_image(img["path"], img["prompt"], img["sheet_name"])
    all_dfs[img["sheet_name"]] = df

# Define a more specific and structured prompt for the overview image
enhanced_overview_prompt = """Was ist in diesem Bild? Bitte analysiere das bereitgestellte Bild und extrahiere die Daten. 
                 ALLE schlüssel-wert-paare, die zu den folgenden schlüssel gehören 'Laufzeit Heute' 'Vorrat' 'Gesamt Heute' 'Gesamt Gestern' 'Aktuell', 'LR1', 'Pumpe', 'Betriebsst. F TR' 'Betriebsst. F LR2' 'Betriebsst. F LR1' 'Betriebsst. GRL TR1' 'Betriebsst. GRL TR2' 'Betriebsst. GRL TR3' 'Betriebsst. VG Pumpe' 'Betriebsst. Fackel' 'Betriebsst. BHKW' 'Gas Gesamt BHKW' !!!. 
                 ohne Kaskadierung und in einer csv-format
                 WICHTIG: Antworte NUR mit einer sauberen CSV-Tabelle ohne Einleitung und ohne Abschlusstext.""" 

# Process the overview image with the enhanced prompt and multiple retries
print("Processing overview image...")
overview_image_path = os.path.join(base_dir, "overview_page.jpeg")
overview_df = process_image(overview_image_path, enhanced_overview_prompt, "Overview_Page", retries=5)

# Add overview dataframe to the collection
all_dfs["Overview_Page"] = overview_df

# Save all dataframes to a single Excel file with multiple sheets
excel_path = "/Users/adrian/Documents/Masters/Pre-Master/TMS/A2D_Project/all_extracted_data_with_overview.xlsx"

# Create Excel writer
with pd.ExcelWriter(excel_path) as writer:
    # Write each dataframe to a different sheet
    for sheet_name, df in all_dfs.items():
        df.to_excel(writer, sheet_name=sheet_name, index=False)

print(f"All data saved to {excel_path}")

# Display a sample of each dataframe
for sheet_name, df in all_dfs.items():
    print(f"\nSample data from {sheet_name}:")
    print(df.head())
    print(f"Total rows in {sheet_name}: {len(df)}")  # Print total row count for each sheet