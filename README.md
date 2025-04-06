# TUMAWAS - Systems

Within a few days and in the [Think. Make. Start.](https://www.tms.tum.de/) Batch 20 course, our team (TUMAWAS) developed NALO Farming, a product/solution designed to address the documentation challenges faced by farmers in Germany due to bureaucratic hurdles. The product leverages OCR technology to extract data from biogas plant interfaces, enabling farmers to easily download all necessary information in an Excel format with just one click. This significantly reduces the time spent on administrative tasks. This project earned us second place in the 'START' category, which honors the ideas with the most startup potential

Website: [https://nalo.vercel.app/](https://nalo.vercel.app/)

# General Setup

---

## **Apache & PHP Server (Plesk)**: Providing the web interface, providing persistent storage.

### Base URL

- **`https://tms.deebugger.de/bd34634c-0876-4f8f-b506-2e6cf19d34be`**

### Frontend UI

- **`GET /ui`**

### Frontend Endpoints

- **`GET /api/frontend/image/?id={id}&most_recent`**  
  Returns the image associated with a specific ID and the most recent version.  
  GET Params: `id` (int), `most_recent` (required)  


- **`GET /api/frontend/status/?most_recent`**  
  Returns the most recent status of the system.  
  GET Params: `most_recent` (required)

- **`GET /api/frontend/data/?most_recent`**  
  Returns the most recent data from the frontend.  
  GET Params: `most_recent` (required)


### Backend Endpoints

- **`GET /api/backend/image/?id={id}`**  
  Returns the image associated with a specific ID and the most recent version.  
  GET Params: `id` (int)


- **`GET /api/backend/status/`**  
  Returns the most recent status of the system.


- **`POST /api/backend/results/`**  
  Lets you upload the OCR results to the backend. **(TOKEN REQUIRED)**  
  POST Params: `token` (string)

### Camera Endpoints

- **`POST /api/camera/capture/`**
  Lets you upload the freshly captured image to the backend. **(TOKEN REQUIRED)**  
  POST Params: `token` (string)


- **`GET, GET /api/camera/settings/`**  
  GET: Returns the current camera settings.  
  GET **(with params)**: Writes all get params to the settings file.
---

## **Raspberry Pi 4B**: Runnung the backend logic.

IP: `192.168.178.48` (local ip at freds place)  **please refer to internal docs for server url**  
User: `tumawas.tms.tum.20`  
Pass: **password has been changed, refer to internal documents**   


```
sudo apt update && sudo apt upgrade -y

sudo apt install cockpit -y
sudo systemctl enable --now cockpit.socket

sudo apt install ufw -y

sudo ufw allow 22
sudo ufw allow 9090
sudo ufw enable
```

**Port 9090 UI:** Cockpit's web interface will be available on port 9090.

**System Credentials:** You will need system credentials to log into Cockpit's web interface.

<span color="red">There is now a **service** called *raspberry* that runs the **raspberry.py** file in the user directory.</span>

----

## **Raspberry Pi Zero 2 W**: Capturing images from usb webcam.

IP: `192.168.137.202` (local ip in freds hotspot)  
User: `pi`  
Pass: `raspberry` 


```
sudo apt update && sudo apt upgrade -y

sudo apt install cockpit -y
sudo systemctl enable --now cockpit.socket

sudo apt install ufw -y

sudo ufw allow 22
sudo ufw allow 9090
sudo ufw enable
```

**Port 9090 UI:** Cockpit's web interface will be available on port 9090.

**System Credentials:** You will need system credentials to log into Cockpit's web interface.

```
sudo apt update
sudo apt install python3-opencv -y
```

<span color="red">There is now a **service** called *raspberry* that runs the **raspberry.py** file in the user directory.</span>

---
## **WiFi Router**:  

SSID: `TUMAWAS`  
Pass: `pI51H1T]ex`  

Config Pass: `Nalo5678`


# Code Usage

To be continued...

![IMG_5911](https://github.com/user-attachments/assets/1a042876-3b45-4e57-b553-96d5f0012847)

