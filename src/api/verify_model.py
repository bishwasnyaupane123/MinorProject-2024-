import pickle
import numpy as np
import os

def verify_model():
    try:
        # Set paths
        current_dir = os.path.dirname(os.path.abspath(__file__))
        model_dir = os.path.join(current_dir, 'models')
        model_path = os.path.join(model_dir, 'savings_model.pkl')
        scaler_path = os.path.join(model_dir, 'savings_scaler.pkl')
        
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
        
        # Test data
        test_data = {
            'income': 50000,
            'rent': 15000,
            'loan_repayment': 5000,
            'insurance': 2000,
            'groceries': 8000,
            'transport': 3000,
            'eating_out': 4000,
            'entertainment': 3000,
            'utilities': 2000,
            'healthcare': 1000
        }
        
        # Prepare test input
        features = ['income', 'rent', 'loan_repayment', 'insurance', 'groceries',
                   'transport', 'eating_out', 'entertainment', 'utilities', 'healthcare']
        
        test_input = [test_data[feature] for feature in features]
        test_array = np.array(test_input).reshape(1, -1)
        
        # Scale input
        test_scaled = scaler.transform(test_array)
        
        # Make prediction
        prediction = model.predict(test_scaled)[0]
        
        print("\nTest prediction results:")
        print(f"Input data: {test_data}")
        print(f"Predicted savings: ₹{prediction:.2f}")
        
        # Calculate basic savings
        total_expenses = sum(test_data[feature] for feature in features if feature != 'income')
        basic_savings = test_data['income'] - total_expenses
        
        print(f"Basic savings (income - expenses): ₹{basic_savings:.2f}")
        
        return True
        
    except Exception as e:
        print(f"Error verifying model: {str(e)}")
        return False

if __name__ == "__main__":
    print("Starting model verification...")
    verify_model() 