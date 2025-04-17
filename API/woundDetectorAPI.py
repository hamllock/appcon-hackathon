from flask import Flask, request, jsonify
import cv2
from ultralytics import YOLO
import numpy as np

# Initialize Flask app
app = Flask(__name__)

# Load the pre-trained YOLOv8 model
model = YOLO('best.pt')  # YOLOv8 model

@app.route('/predict', methods=['POST'])
def predict():
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
    
    # Extract annotations
    annotations = []
    for detection in results[0].boxes:
        box = detection.xyxy[0].cpu().numpy()  # Bounding box coordinates [x_min, y_min, x_max, y_max]
        class_idx = int(detection.cls[0])  # Class index
        label = model.names[class_idx]  # Class name
        score = float(detection.conf[0])  # Confidence score
        annotations.append({
            'label': label,
            'confidence': score,
            'bbox': box.tolist()  # Convert bbox to list to make it JSON serializable
        })
    
    # Return annotations as JSON response
    return jsonify(annotations)

if __name__ == '__main__':
    app.run(debug=True)
