from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
import pickle
import os
import traceback

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Model paths
current_dir = os.path.dirname(os.path.abspath(__file__))
model_dir = os.path.join(current_dir, 'models')
model_path = os.path.join(model_dir, 'savings_model.pkl')
scaler_path = os.path.join(model_dir, 'savings_scaler.pkl')

model = None
scaler = None

def load_model():
    global model, scaler
    try:
        # Check if model files exist
        if not os.path.exists(model_path) or not os.path.exists(scaler_path):
            print("Error: Model files not found. Please run train_savings_model.py first.")
            return False
            
        # Load model and scaler
        with open(model_path, 'rb') as f:
            model = pickle.load(f)
            
        with open(scaler_path, 'rb') as f:
            scaler = pickle.load(f)
            
        print("Model and scaler loaded successfully!")
        return True
        
    except Exception as e:
        print(f"Error loading model: {str(e)}")
        print("Traceback:")
        traceback.print_exc()
        return False

# Add a root route for testing
@app.route('/')
def home():
    return jsonify({
        'message': 'Prediction API is running',
        'endpoints': {
            'health': '/api/health',
            'predict': '/api/predict-saving'
        }
    })

@app.route('/api/predict-saving', methods=['POST', 'OPTIONS'])
def predict_saving():
    print(f"Received {request.method} request to /api/predict-saving")
    print(f"Headers: {dict(request.headers)}")
    
    # Handle preflight request
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', '*')
        response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
        return response

    if model is None or scaler is None:
        return jsonify({
            'error': 'Model not loaded. Please check server logs.',
            'success': False
        }), 500
        
    try:
        # Get data from request
        data = request.get_json()
        print("Received data:", data)
        
        if not data:
            return jsonify({
                'error': 'No data received',
                'success': False
            }), 400
        
        # Prepare input features
        features = ['income', 'rent', 'loan_repayment', 'insurance', 'groceries',
                   'transport', 'eating_out', 'entertainment', 'utilities', 'healthcare']
        
        input_data = []
        for feature in features:
            value = float(data.get(feature, 0))
            input_data.append(value)
            
        print("Processed input data:", input_data)
        
        # Convert to numpy array and reshape
        input_array = np.array(input_data).reshape(1, -1)
        
        # Scale the input
        input_scaled = scaler.transform(input_array)
        
        # Make prediction
        prediction = model.predict(input_scaled)[0]
        print("Raw model prediction:", prediction)
        
        # Ensure prediction is not negative
        prediction = max(0, prediction)
        
        # Calculate basic savings (income - expenses)
        total_expenses = sum(float(data.get(feature, 0)) for feature in features if feature != 'income')
        income = float(data.get('income', 0))
        basic_savings = income - total_expenses
        
        print(f"Income: {income}")
        print(f"Total expenses: {total_expenses}")
        print(f"Basic savings: {basic_savings}")
        
        # Use weighted combination of model prediction and basic calculation
        final_prediction = (prediction + basic_savings) / 2
        
        # Ensure final prediction is between 0 and income
        final_prediction = max(0, min(final_prediction, income))
        
        print(f"Final prediction: {final_prediction}")
        
        response = jsonify({
            'prediction': final_prediction,
            'success': True
        })
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response
    
    except Exception as e:
        print(f"Prediction error: {str(e)}")
        print("Traceback:")
        traceback.print_exc()
        return jsonify({
            'error': str(e),
            'success': False
        }), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'model_loaded': model is not None,
        'model_path': model_path,
        'model_exists': os.path.exists(model_path)
    })

if __name__ == '__main__':
    print("Starting server...")
    print(f"Working directory: {os.getcwd()}")
    if load_model():
        print("Model loaded successfully, starting Flask server...")
        print("Server will be accessible at http://localhost:5001")
        print("Available endpoints:")
        print("  - GET  /")
        print("  - GET  /api/health")
        print("  - POST /api/predict-saving")
        # Run on port 5001 to avoid conflicts
        app.run(host='0.0.0.0', port=5001, debug=True)
    else:
        print("Failed to load model. Please check the model files and try again.") 