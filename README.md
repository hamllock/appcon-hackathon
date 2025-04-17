# Project README

## Overview

This project is a mobile application built with React Native and Expo, integrated with a Flask backend to provide multiple AI-powered features. The application includes:

- **News Verification**: Determines the credibility of news articles using machine learning models.
- **Object Detection**: Identifies objects in images using YOLOv8.
- **Image OCR**: Extracts text from images using Tesseract OCR.
- **Wound Detection**: Detects and classifies wounds in images, providing first aid instructions using a custom YOLOv8 model.

The backend leverages Python libraries such as NumPy, Pandas, scikit-learn, and Ultralytics YOLO, while the frontend uses React Native components for a seamless user experience.

## Features

- **News Verification**: Input news content and source to receive credibility predictions from multiple models (Logistic Regression, Naive Bayes, SVM, XGBoost).
- **Object Detection**: Capture an image to detect objects, with results displayed and read aloud via text-to-speech.
- **Image OCR**: Extract text from images, with the option to have the text read aloud.
- **Wound Detection**: Identify wound types (e.g., Abrasion, Bruise, Burn) in images and provide detailed first aid instructions, also read aloud.

## Prerequisites

- Python 3.8 or higher
- Node.js and npm
- Expo CLI
- Expo Go app (available on iOS and Android)
- Git Bash (for Windows users) or a terminal for running commands
- A device/emulator to run the mobile app

## Setup Instructions

Follow these steps to set up the project locally:

1. **Clone the Repository**

   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```

2. **Set Up the Python Environment**

   - Create a virtual environment:

     ```bash
     python -m venv venv
     source venv/bin/activate  # On Windows: venv\Scripts\activate
     ```

   - Install required Python packages:

     ```bash
     pip install -r python_requirements.txt
     ```

3. **Install Node.js Dependencies**

   - Navigate to the project root (where `package.json` is located):

     ```bash
     npm install
     ```

4. **Install Expo Go**

   - Download and install the **Expo Go** app from the Google Play Store or Apple App Store.

5. **Start the Flask Backend**

   - Run the Flask API server:

     ```bash
     python allAPI.py
     ```

   - Ensure the server is running on `http://192.168.1.4:5000` (update the IP in the React Native components if your local IP differs).

6. **Start the Expo Development Server**

   - In a terminal, run:

     ```bash
     npx expo start
     ```

   - This will generate a QR code in the terminal.

7. **Run the Mobile App**

   - Open the **Expo Go** app on your mobile device.
   - Scan the QR code from the terminal using the Expo Go app to launch the application.

## How to Use

1. **Launch the App**

   - After scanning the QR code in Expo Go, the app will load with a home screen containing options for News Verification, Object Detection, Image OCR, and Wound Detection.

2. **News Verification**

   - Navigate to the "News Verification" section.
   - Enter the news article content and source.
   - Press "Send" to get credibility predictions from multiple models.
   - Press "Clear" to reset the inputs.

3. **Object Detection**

   - Go to the "Object Detection" section.
   - Press "Take Picture" to capture an image.
   - Press "Detect Objects" to process the image and view detected objects.
   - Results are displayed and read aloud. Press "Clear" to reset.

4. **Image OCR**

   - Navigate to the "Image OCR" section.
   - Press "Take Picture" to capture an image.
   - Press "Send to OCR" to extract text.
   - Press "Read Aloud" to hear the extracted text. Press "Clear" to reset.

5. **Wound Detection**

   - Go to the "Wound Detector" section.
   - Press "Take Picture" to capture an image of a wound.
   - Press "Send to Wound Detector" to identify the wound type and receive first aid instructions.
   - Results are displayed and read aloud. Press "Clear" to reset.

## API Endpoints

The Flask backend provides the following endpoints:

- **POST /predict**: Predicts the credibility of news content.
  - Input: JSON with `content` (string) and `brand` (string, optional).
  - Output: JSON with predictions from multiple models.
- **POST /ocr**: Extracts text from an uploaded image.
  - Input: Multipart form-data with `image` (image file).
  - Output: JSON with `extracted_text`.
- **POST /process_image**: Detects objects in an uploaded image using YOLOv8.
  - Input: Multipart form-data with `image` (image file).
  - Output: JSON with `yolo_labels` (list of detected object labels).
- **POST /wound**: Detects and classifies wounds in an uploaded image, providing first aid instructions.
  - Input: Multipart form-data with `image` (image file).
  - Output: JSON with `detected_wounds` (list of wound types, definitions, and first aid steps).

## Troubleshooting

- **Flask Server Not Running**: Ensure `allAPI.py` is running and the IP address matches your local network IP. Update the `API_URL` in React Native components if needed.
- **Expo QR Code Not Scanning**: Ensure your device and computer are on the same Wi-Fi network. Alternatively, use the Expo Go app's "Enter URL manually" option.
- **Permission Errors**: Grant camera and media library permissions when prompted in the Expo Go app.
- **Model Loading Errors**: Verify that all model weights (`model_weights/`) and `python_requirements.txt` are correctly set up.

## Dependencies

- **Backend**: NumPy, Pandas, joblib, OpenCV, pytesseract, scikit-learn, Ultralytics YOLO, Flask, Flask-CORS.
- **Frontend**: React Native, Expo, expo-camera, expo-image-picker, expo-speech.

## Notes

- Ensure the `model_weights/` directory contains all required model files (`Logistic_Regression.pkl`, `Naive_Bayes.pkl`, `SVM.pkl`, `XGBoost.pkl`, `content_vectorizer.pkl`, `brand_columns.pkl`, `yolov8n.pt`, `best.pt`).
- The app requires an active internet connection for the Flask server and Expo development server to communicate.
- For production, consider using environment variables for sensitive data like API URLs and securing the Flask server with HTTPS.

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.