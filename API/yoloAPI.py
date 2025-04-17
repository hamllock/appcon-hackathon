from flask import Flask, request, jsonify
from flask_cors import CORS
import pytesseract as tess
from PIL import Image
import cv2
import numpy as np
from ultralytics import YOLO

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for cross-origin requests

# Load the pre-trained YOLOv8 model
model = YOLO('appcon-hackathon/model_weights/yolov8n.pt')  # YOLOv8 model

@app.route('/process_image', methods=['POST'])
def process_image():
    # Check if an image is provided in the request
    if 'image' not in request.files:
        return jsonify({"error": "No image file found in the request"}), 400
    
    # Get the image file from the request
    file = request.files['image']
    
    # Convert image to numpy array for OpenCV
    img_array = np.frombuffer(file.read(), np.uint8)
    img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
    
    # Reset file pointer for PIL processing
    file.seek(0)
    
    # Perform OCR to extract text
    pil_img = Image.open(file)
    text = tess.image_to_string(pil_img)
    
    # Perform YOLO object detection
    img_resized = cv2.resize(img, (640, 640))
    results = model(img_resized)
    
    # Extract only the labels from YOLO detections
    labels = []
    for detection in results[0].boxes:
        class_idx = int(detection.cls[0])  # Class index
        label = model.names[class_idx]  # Class name
        labels.append(label)
    
    # Return extracted text and YOLO labels as JSON response
    return jsonify({
        "ocr_text": text,
        "yolo_labels": labels
    })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)