import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import pickle
import os

# Define the path to your CSV file
csv_path = 'C:\Users\Acer\Desktop\minor-project (3)\minor-project\NewFrontend-copy\finance-assistance\src\components\linear_regression.csv'
model_dir = './src/models'

try:
    # Load data from CSV
    print("Loading data from CSV...")
    data = pd.read_csv(csv_path)
    
    # Calculate savings as income minus expenses if not in CSV
    expense_columns = ['rent', 'loan_repayment', 'insurance', 'groceries', 
                      'transport', 'eating_out', 'entertainment', 'utilities', 'healthcare']
    
    # Prepare features and target
    X = data[['income'] + expense_columns]
    y = data['income'] - data[expense_columns].sum(axis=1)  # Calculate savings

    # Create and fit the scaler
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # Train the model
    model = LinearRegression()
    model.fit(X_scaled, y)

    # Save both model and scaler
    os.makedirs(model_dir, exist_ok=True)

    with open(os.path.join(model_dir, 'savings_predictor.pkl'), 'wb') as f:
        pickle.dump((model, scaler), f)

    with open(os.path.join(model_dir, 'feature_names.pkl'), 'wb') as f:
        pickle.dump(list(X.columns), f)

    print("Model trained and saved successfully!")

except Exception as e:
    print(f"Error: {str(e)}")
    print("\nDebug information:")
    print(f"Current working directory: {os.getcwd()}")
    print(f"CSV file exists: {os.path.exists(csv_path)}")
    if os.path.exists(csv_path):
        print(f"CSV file size: {os.path.getsize(csv_path)} bytes")