from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import pytesseract
import numpy as np

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for cross-origin requests

# Function to perform OCR
def ocr_image(image):
    # Convert image to grayscale for better OCR accuracy
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    # Apply thresholding to enhance text visibility
    thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]
    
    # Run Tesseract OCR on the processed image
    text = pytesseract.image_to_string(thresh)
    
    return text

@app.route('/ocr', methods=['POST'])
def ocr_api():
    # Check if an image is provided in the request
    if 'image' not in request.files:
        return jsonify({"error": "No image file found in the request"}), 400
    
    # Get the image file from the request
    file = request.files['image']
    
    # Convert the image file to a format that OpenCV can work with
    img_array = np.frombuffer(file.read(), np.uint8)
    img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
    
    # Perform OCR on the image
    extracted_text = ocr_image(img)
    
    # Return the extracted text as a JSON response
    return jsonify({"extracted_text": extracted_text})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)