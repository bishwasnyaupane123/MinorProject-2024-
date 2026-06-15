import pickle
import os

# Path to the model
model_path = 'C:\Users\Acer\Desktop\minor-project (3)\minor-project\NewFrontend-copy\finance-assistance\src\models\savings_predictor.pkl'
feature_names_path = 'C:\Users\Acer\Desktop\minor-project (3)\minor-project\NewFrontend-copy\finance-assistance\src\models\feature_names.pkl'

def verify_model():
    try:
        # Check if files exist
        if not os.path.exists(model_path):
            print(f"Model file not found at: {model_path}")
            return False
            
        if not os.path.exists(feature_names_path):
            print(f"Feature names file not found at: {feature_names_path}")
            return False

        # Try loading the model
        with open(model_path, 'rb') as file:
            model = pickle.load(file)
        print("Model loaded successfully!")
        
        # Try loading feature names
        with open(feature_names_path, 'rb') as file:
            feature_names = pickle.load(file)
        print("Feature names loaded successfully!")
        print("Features:", feature_names)
        
        return True
    except Exception as e:
        print(f"Error verifying model: {str(e)}")
        return False

if __name__ == "__main__":
    verify_model() 