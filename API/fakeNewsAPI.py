import numpy as np
import pandas as pd
import joblib
from scipy.sparse import hstack
from flask import Flask, request, jsonify
from sklearn.feature_extraction.text import TfidfVectorizer

app = Flask(__name__)

# Load pre-trained models and vectorizer
models = {
    "Logistic_Regression": joblib.load("model_weights/Logistic_Regression.pkl"),
    "Naive_Bayes": joblib.load("model_weights/Naive_Bayes.pkl"),
    "SVM": joblib.load("model_weights/SVM.pkl"),
    "XGBoost": joblib.load("model_weights/XGBoost.pkl")
}
vectorizer = joblib.load("model_weights/content_vectorizer.pkl")
brand_columns = joblib.load("model_weights/brand_columns.pkl")

def preprocess_input(content, brand):
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

        # Get predictions from all models
        predictions = {}
        for model_name, model in models.items():
            pred = model.predict(features)[0]
            predictions[model_name] = 'Not Credible' if pred == 1 else 'Credible'

        return jsonify({
            'status': 'success',
            'predictions': predictions
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)