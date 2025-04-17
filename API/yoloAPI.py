
from flask import Flask, request, jsonify
import pytesseract as tess
from PIL import Image
import cv2
import numpy as np
from ultralytics import YOLO
import pyttsx3  # Text-to-Speech (TTS)

# Initialize Flask app
app = Flask(__name__)

# Load the pre-trained YOLOv8 model
model = YOLO('yolov8.pt')  # YOLOv8 model

# Function to convert text to speech
def text_to_speech(text):
    engine = pyttsx3.init()
    engine.say(text)
    engine.runAndWait()

@app.route('/process_image', methods=['POST'])
def process_image():
    # Get image from the request
    if 'image' not in request.files:
        return jsonify({"error": "No image file found in the request"}), 400
    
    file = request.files['image']
    
    # Convert image to PIL format and process for OCR
    img_array = np.frombuffer(file.read(), np.uint8)
    img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
    
    # Perform OCR to extract text
    pil_img = Image.open(request.files['image'])
    text = tess.image_to_string(pil_img)
    
    # Perform YOLO object detection
    img_resized = cv2.resize(img, (640, 640))
    results = model(img_resized)
    
    # Extract YOLO annotations
    annotations = []
    for detection in results[0].boxes:
        box = detection.xyxy[0].cpu().numpy()  # Bounding box coordinates [x_min, y_min, x_max, y_max]
        class_idx = int(detection.cls[0])  # Class index
        label = model.names[class_idx]  # Class name
        score = float(detection.conf[0])  # Confidence score
        annotations.append({
            'label': label,
            'confidence': score,
            'bbox': box.tolist()  # Convert bbox to list for JSON serialization
        })
    
    # Combine text and detections to say it out loud
    response_text = "Text detected: " + text + ". Objects detected: "
    for annotation in annotations:
        response_text += f"{annotation['label']} with confidence {annotation['confidence']:.2f}. "

    # Call TTS to speak the response text
    text_to_speech(response_text)
    
    # Return extracted text and YOLO annotations as JSON response
    return jsonify({
        "ocr_text": text,
        "yolo_annotations": annotations
    })

if __name__ == '__main__':
    app.run(debug=True)
