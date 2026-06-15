import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler
import pickle
import os

def train_savings_model():
    try:
        # Set paths
        current_dir = os.path.dirname(os.path.abspath(__file__))
        data_path = os.path.join(current_dir, '..', 'components', 'linear_regression.csv')
        model_dir = os.path.join(current_dir, 'models')
        
        # Create models directory if it doesn't exist
        if not os.path.exists(model_dir):
            os.makedirs(model_dir)
        
        print(f"Loading data from: {data_path}")
        
        # Load and prepare data
        data = pd.read_csv(data_path)
        print("Data loaded successfully!")
        print(f"Data shape: {data.shape}")
        
        # Define features
        features = ['income', 'rent', 'loan_repayment', 'insurance', 'groceries',
                   'transport', 'eating_out', 'entertainment', 'utilities', 'healthcare']
        
        # Prepare features and target
        X = data[features]
        y = data['savings']
        
        # Scale features
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
        
        # Train model
        model = LinearRegression()
        model.fit(X_scaled, y)
        
        # Save model and scaler
        model_path = os.path.join(model_dir, 'savings_model.pkl')
        scaler_path = os.path.join(model_dir, 'savings_scaler.pkl')
        
        with open(model_path, 'wb') as f:
            pickle.dump(model, f)
        
        with open(scaler_path, 'wb') as f:
            pickle.dump(scaler, f)
        
        print("\nModel training completed successfully!")
        print(f"Model saved to: {model_path}")
        print(f"Scaler saved to: {scaler_path}")
        
        # Print model coefficients
        print("\nModel coefficients:")
        for feature, coef in zip(features, model.coef_):
            print(f"{feature}: {coef:.2f}")
        print(f"Intercept: {model.intercept_:.2f}")
        
        return True
        
    except Exception as e:
        print(f"Error training model: {str(e)}")
        return False

if __name__ == "__main__":
    print("Starting model training...")
    train_savings_model() 