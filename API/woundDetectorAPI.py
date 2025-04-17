from flask import Flask, request, jsonify
import cv2
from ultralytics import YOLO
import numpy as np

# Initialize Flask app
app = Flask(__name__)

# Load the pre-trained YOLOv8 model
model = YOLO('appcon-hackathon/model_weights/best.pt')  # YOLOv8 model

@app.route('/wound', methods=['POST'])
def ocr():
    # Get the image file from the request
    if 'image' not in request.files:
        return jsonify({"error": "No image file found in the request"}), 400

    file = request.files['image']
    
    # Read the image file into OpenCV
    img_array = np.frombuffer(file.read(), np.uint8)
    img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
    
    # Resize the image to 640x640
    img_resized = cv2.resize(img, (640, 640))
    
    # Run YOLOv8 model predictions on the image
    results = model(img_resized)
    
    # Extract labels as "extracted text"
    labels = []
    for detection in results[0].boxes:
        class_idx = int(detection.cls[0])  # Class index
        label = model.names[class_idx]  # Class name
        labels.append(label)
    
    # Join labels into a single string
    extracted_text = " ".join(labels) if labels else "No wounds detected."
    
    # Return extracted text as JSON response
    return jsonify({"extracted_text": extracted_text})

if __name__ == '__main__':
    app.run(host='192.168.1.4', port=5000, debug=True)