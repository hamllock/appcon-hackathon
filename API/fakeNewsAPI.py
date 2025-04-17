import numpy as np
import pandas as pd
import joblib
from scipy.sparse import hstack
from flask import Flask, request, jsonify
from flask_cors import CORS
from sklearn.feature_extraction.text import TfidfVectorizer

app = Flask(__name__)
CORS(app)  # Enable CORS for cross-origin requests

# Load pre-trained models and vectorizer
models = {
    "Logistic_Regression": joblib.load("appcon-hackathon/model_weights/Logistic_Regression.pkl"),
    "Naive_Bayes": joblib.load("appcon-hackathon/model_weights/Naive_Bayes.pkl"),
    "SVM": joblib.load("appcon-hackathon/model_weights/SVM.pkl"),
    "XGBoost": joblib.load("appcon-hackathon/model_weights/XGBoost.pkl")
}
vectorizer = joblib.load("appcon-hackathon/model_weights/content_vectorizer.pkl")
brand_columns = joblib.load("appcon-hackathon/model_weights/brand_columns.pkl")

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
        print(f"Error in preprocessing: {str(e)}")
        return None

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        content = data.get('content')
        brand = data.get('brand', 'Unknown')

        if not content:
            return jsonify({'error': 'Content is required'}), 400

        # Preprocess input
        features = preprocess_input(content, brand)

        if features is None or features.shape[0] == 0:
            return jsonify({'error': 'Feature preprocessing failed'}), 500

        # Get predictions from all modelspip show flask-cors
        predictions = {}
        for model_name, model in models.items():
            try:
                pred = model.predict(features)[0]
                predictions[model_name] = 'Not Credible' if pred == 1 else 'Credible'
            except Exception as model_error:
                predictions[model_name] = f'Error: {str(model_error)}'

        return jsonify({
            'status': 'success',
            'predictions': predictions
        })

    except Exception as e:
        print(f"Server error: {str(e)}")
        return jsonify({'error': f'Internal Server Error: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)