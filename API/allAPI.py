import numpy as np
import pandas as pd
import joblib
import cv2
import pytesseract
from scipy.sparse import hstack
from flask import Flask, request, jsonify
from flask_cors import CORS
from sklearn.feature_extraction.text import TfidfVectorizer
from ultralytics import YOLO
import logging

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for cross-origin requests

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Load pre-trained models and vectorizer for /predict endpoint
try:
    models = {
        "Logistic_Regression": joblib.load("model_weights/Logistic_Regression.pkl"),
        "Naive_Bayes": joblib.load("model_weights/Naive_Bayes.pkl"),
        "SVM": joblib.load("model_weights/SVM.pkl"),
        "XGBoost": joblib.load("model_weights/XGBoost.pkl")
    }
    vectorizer = joblib.load("model_weights/content_vectorizer.pkl")
    brand_columns = joblib.load("model_weights/brand_columns.pkl")
    logger.info("Text prediction models and vectorizer loaded successfully")
except Exception as e:
    logger.error(f"Failed to load text prediction models or vectorizer: {str(e)}")
    raise

# Load the pre-trained YOLOv8 model for /process_image endpoint
try:
    yolo_model = YOLO('model_weights/yolov8n.pt')  # YOLOv8 model
    logger.info("YOLO model for object detection loaded successfully")
except Exception as e:
    logger.error(f"Failed to load YOLO model for object detection: {str(e)}")
    raise

# Load the pre-trained YOLOv8 model for /wound endpoint
try:
    wound_model = YOLO('model_weights/best.pt')  # YOLOv8 model for wound detection
    logger.info("YOLO model for wound detection loaded successfully")
except Exception as e:
    logger.error(f"Failed to load YOLO model for wound detection: {str(e)}")
    raise

# Preprocessing function for /predict endpoint
def preprocess_input(content, brand):
    try:
        # Feature engineering
        text_length = len(content)
        word_count = len(content.split())
        avg_word_length = sum(len(word) for word in content.split()) / word_count if word_count > 0 else 0

        # TF-IDF vectorization
        tfidf_content = vectorizer.transform([content])

        # One-hot encode brand
        brand_data = np.zeros(len(brand_columns))
        brand_col = f"Brand_{brand}"
        if brand_col in brand_columns:
            brand_idx = brand_columns.index(brand_col)
            brand_data[brand_idx] = 1

        # Other features DataFrame
        other_features = pd.DataFrame({
            'text_length': [text_length],
            'word_count': [word_count],
            'avg_word_length': [avg_word_length],
            **{col: [brand_data[i]] for i, col in enumerate(brand_columns)}
        })

        # Combine TF-IDF and other features
        combined_features = hstack([tfidf_content, other_features])

        return combined_features
    except Exception as e:
        logger.error(f"Error in preprocessing: {str(e)}")
        return None

# OCR function for /ocr endpoint
def ocr_image(image):
    try:
        # Convert image to grayscale for better OCR accuracy
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Apply thresholding to enhance text visibility
        thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]
        
        # Run Tesseract OCR on the processed image
        text = pytesseract.image_to_string(thresh)
        
        return text
    except Exception as e:
        logger.error(f"Error in OCR processing: {str(e)}")
        return None

# /predict endpoint: Text credibility prediction
@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        content = data.get('content')
        brand = data.get('brand', 'Unknown')

        if not content:
            logger.warning("Content is required but not provided")
            return jsonify({'error': 'Content is required'}), 400

        # Preprocess input
        features = preprocess_input(content, brand)

        if features is None or features.shape[0] == 0:
            logger.error("Feature preprocessing failed")
            return jsonify({'error': 'Feature preprocessing failed'}), 500

        # Get predictions from all models
        predictions = {}
        for model_name, model in models.items():
            try:
                pred = model.predict(features)[0]
                predictions[model_name] = 'Not Credible' if pred == 1 else 'Credible'
            except Exception as model_error:
                logger.error(f"Error in {model_name} prediction: {str(model_error)}")
                predictions[model_name] = f'Error: {str(model_error)}'

        logger.info("Predictions generated successfully")
        return jsonify({
            'status': 'success',
            'predictions': predictions
        })

    except Exception as e:
        logger.error(f"Server error in /predict: {str(e)}")
        return jsonify({'error': f'Internal Server Error: {str(e)}'}), 500

# /ocr endpoint: Image text extraction
@app.route('/ocr', methods=['POST'])
def ocr_api():
    try:
        # Check if an image is provided in the request
        if 'image' not in request.files:
            logger.warning("No image file found in request for /ocr")
            return jsonify({"error": "No image file found in the request"}), 400
        
        # Get the image file from the request
        file = request.files['image']
        
        # Convert the image file to a format that OpenCV can work with
        img_array = np.frombuffer(file.read(), np.uint8)
        img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
        if img is None:
            logger.error("Failed to decode image for /ocr")
            return jsonify({"error": "Invalid image file"}), 400
        
        # Perform OCR on the image
        extracted_text = ocr_image(img)
        if extracted_text is None:
            logger.error("OCR processing failed")
            return jsonify({"error": "OCR processing failed"}), 500

        logger.info("OCR text extracted successfully")
        return jsonify({"extracted_text": extracted_text})

    except Exception as e:
        logger.error(f"Server error in /ocr: {str(e)}")
        return jsonify({"error": f"Internal Server Error: {str(e)}"}), 500

# /process_image endpoint: YOLO object detection
@app.route('/process_image', methods=['POST'])
def process_image():
    try:
        # Check if an image is provided in the request
        if 'image' not in request.files:
            logger.warning("No image file found in request for /process_image")
            return jsonify({"error": "No image file found in the request"}), 400
        
        # Get the image file from the request
        file = request.files['image']
        
        # Convert image to numpy array for OpenCV
        img_array = np.frombuffer(file.read(), np.uint8)
        img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
        if img is None:
            logger.error("Failed to decode image for /process_image")
            return jsonify({"error": "Invalid image file"}), 400
        
        # Perform YOLO object detection
        logger.debug("Performing YOLO object detection")
        img_resized = cv2.resize(img, (640, 640))
        results = yolo_model(img_resized)
        
        # Extract only the labels from YOLO detections
        labels = []
        for detection in results[0].boxes:
            class_idx = int(detection.cls[0])  # Class index
            label = yolo_model.names[class_idx]  # Class name
            labels.append(label)
        
        logger.info(f"Detected {len(labels)} objects")
        return jsonify({"yolo_labels": labels})
    
    except Exception as e:
        logger.error(f"Server error in /process_image: {str(e)}")
        return jsonify({"error": f"Server error: {str(e)}"}), 500

# First aid information for wounds
FIRST_AID = {
    "Abrasion": {
        "definition": "Surface-level skin injury (e.g., from falling on rough ground).",
        "first_aid": [
            "Wash hands or wear gloves.",
            "Rinse the wound with clean water to remove dirt.",
            "Gently clean around the wound with soap and water (avoid scrubbing).",
            "Apply an antibiotic ointment (like Neosporin).",
            "Cover with a clean, non-stick bandage.",
            "Change the dressing daily or if it becomes dirty/wet."
        ]
    },
    "Bruise": {
        "definition": "Bleeding under the skin due to impact. No skin break.",
        "first_aid": [
            "Apply a cold compress/ice pack (wrapped in cloth) for 10–20 minutes to reduce swelling.",
            "Elevate the area if possible.",
            "Rest the bruised area.",
            "Avoid heat for the first 24 hours.",
            "Monitor for signs of severe injury (pain/swelling that worsens, difficulty moving limb)."
        ]
    },
    "Burn": {
        "definition": "Skin injury caused by heat, classified by severity.",
        "first_aid": [
            "For First Degree (Red, No Blisters): Cool burn under running water for 10–15 minutes, apply aloe vera or burn cream, cover with a sterile non-stick bandage.",
            "For Second Degree (Blisters, More Painful): Cool under water for 10–15 minutes, do not pop blisters, apply antibiotic ointment, cover with a clean, loose bandage, seek medical help if large or on face/genitals/hands.",
            "For Third Degree (Charred/Waxy Skin, Numb): Call emergency services immediately, do not remove burned clothing, cover with a cool, moist sterile cloth or clean sheet, monitor breathing."
        ]
    },
    "Cut": {
        "definition": "Clean slice through skin, often by a sharp object.",
        "first_aid": [
            "Wash hands/wear gloves.",
            "Apply pressure with a clean cloth/gauze to stop bleeding.",
            "Clean wound gently with water (no hydrogen peroxide).",
            "Apply antibiotic ointment.",
            "Cover with a sterile bandage.",
            "Get medical help if deep, won’t stop bleeding, or gaping."
        ]
    },
    "Laceration": {
        "definition": "Jagged or deep tear in the skin.",
        "first_aid": [
            "Apply direct pressure to stop bleeding.",
            "Clean the wound gently if possible.",
            "Apply sterile bandage or clean cloth.",
            "Keep the area elevated if bleeding heavily.",
            "Seek medical attention (stitches may be needed)."
        ]
    },
    "Stab Wound": {
        "definition": "Deep penetrating wound from sharp object (knife, etc.).",
        "first_aid": [
            "Call emergency services immediately.",
            "Do NOT remove the object if it's still in the body.",
            "Apply pressure around the wound to control bleeding (not directly on the object).",
            "If object is removed or not present, control bleeding with direct pressure and clean dressing.",
            "Lay the person down and keep them calm.",
            "Monitor for signs of shock: pale skin, rapid heartbeat, shallow breathing."
        ]
    }
}

# /wound endpoint: Wound detection using YOLO
@app.route('/wound', methods=['POST'])
def wound_detection():
    try:
        # Check if an image is provided in the request
        if 'image' not in request.files:
            logger.warning("No image file found in request for /wound")
            return jsonify({"error": "No image file found in the request"}), 400
        
        # Get the image file from the request
        file = request.files['image']
        
        # Convert image to numpy array for OpenCV
        img_array = np.frombuffer(file.read(), np.uint8)
        img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
        if img is None:
            logger.error("Failed to decode image for /wound")
            return jsonify({"error": "Invalid image file"}), 400
        
        # Perform YOLO wound detection
        logger.debug("Performing YOLO wound detection")
        img_resized = cv2.resize(img, (640, 640))
        results = wound_model(img_resized)
        
        # Map predicted class names to standardized names
        class_mapping = {
            "Otarcie": "Abrasion",
            "Laseration": "Laceration",
            "Rana kluta": "Stab Wound",
            "Bruises": "Bruise",
            "Burn": "Burn",
            "Cut": "Cut"
        }
        
        # Extract unique labels from YOLO detections
        labels = set()
        for detection in results[0].boxes:
            class_idx = int(detection.cls[0])  # Class index
            label = wound_model.names[class_idx]  # Class name
            # Map to standardized name if applicable
            standardized_label = class_mapping.get(label, label)
            labels.add(standardized_label)
        
        # Prepare response with unique labels and first aid
        response = {
            "detected_wounds": [],
            "message": "No wounds detected." if not labels else f"Detected {len(labels)} unique wound type(s)."
        }
        
        if labels:
            for label in labels:
                wound_info = FIRST_AID.get(label, {
                    "definition": "Unknown wound type.",
                    "first_aid": ["Seek medical attention."]
                })
                response["detected_wounds"].append({
                    "wound_type": label,
                    "definition": wound_info["definition"],
                    "first_aid": wound_info["first_aid"]
                })
        
        logger.info(f"Wound detection completed: {response['message']}")
        return jsonify(response)
    
    except Exception as e:
        logger.error(f"Server error in /wound: {str(e)}")
        return jsonify({"error": f"Server error: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)