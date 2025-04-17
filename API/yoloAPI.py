from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
from ultralytics import YOLO
import logging

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for cross-origin requests

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Load the pre-trained YOLOv8 model
try:
    model = YOLO('appcon-hackathon/model_weights/yolov8n.pt')  # YOLOv8 model
    logger.info("YOLO model loaded successfully")
except Exception as e:
    logger.error(f"Failed to load YOLO model: {str(e)}")
    raise

@app.route('/process_image', methods=['POST'])
def process_image():
    try:
        # Check if an image is provided in the request
        if 'image' not in request.files:
            logger.warning("No image file found in request")
            return jsonify({"error": "No image file found in the request"}), 400
        
        # Get the image file from the request
        file = request.files['image']
        logger.debug("Image file received")
        
        # Convert image to numpy array for OpenCV
        img_array = np.frombuffer(file.read(), np.uint8)
        img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
        if img is None:
            logger.error("Failed to decode image")
            return jsonify({"error": "Invalid image file"}), 400
        
        # Perform YOLO object detection
        logger.debug("Performing YOLO object detection")
        img_resized = cv2.resize(img, (640, 640))
        results = model(img_resized)
        
        # Extract only the labels from YOLO detections
        labels = []
        for detection in results[0].boxes:
            class_idx = int(detection.cls[0])  # Class index
            label = model.names[class_idx]  # Class name
            labels.append(label)
        
        logger.info(f"Detected {len(labels)} objects")
        # Return YOLO labels as JSON response
        return jsonify({"yolo_labels": labels})
    
    except Exception as e:
        logger.error(f"Error processing image: {str(e)}")
        return jsonify({"error": f"Server error: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)