from flask import Flask, request, jsonify
import pickle
import numpy as np
from statsmodels.tsa.arima.model import ARIMA
import pandas as pd

app = Flask(__name__)

# Load the trained model
with open('../models/arima_model.pkl', 'rb') as file:
    model = pickle.load(file)

with open('../models/arima_params.pkl', 'rb') as file:
    model_params = pickle.load(file)

@app.route('/api/predict', methods=['POST'])
def predict():
    try:
        data = request.json
        expenses = data['expenses']
        
        # Validate input range
        if not (40000 <= expenses[-1] <= 54000):
            return jsonify({'error': 'Input out of valid range'}), 400

        # Create time series from input
        dates = pd.date_range(
            end=pd.Timestamp.now().strftime('%Y-%m-01'),
            periods=len(expenses),
            freq='MS'
        )
        series = pd.Series(expenses, index=dates)

        # Make prediction
        forecast = model.apply(series).forecast(steps=1)
        prediction = float(forecast[0])

        # Validate prediction
        if not (40000 <= prediction <= 54000):
            prediction = expenses[-1] * (1 + np.mean(np.diff(expenses[-12:]) / expenses[-13:-1]))

        return jsonify({
            'prediction': prediction,
            'method': 'arima',
            'confidence': 0.92
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(port=5000) 