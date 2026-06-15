import numpy as np
import pandas as pd
from statsmodels.tsa.arima.model import ARIMA
import pickle

def train_arima_model():
    # Use the provided expense data
    data = pd.DataFrame([
        [45000.00], [45200.00], [45350.00], [45500.00], [45400.00], [45650.00],
        [45800.00], [45750.00], [46000.00], [46200.00], [46350.00], [46500.00],
        [46700.00], [46600.00], [46900.00], [47000.00], [47200.00], [47150.00],
        [47400.00], [47550.00], [47700.00], [47850.00], [48000.00], [48200.00],
        [48350.00], [48500.00], [48600.00], [48750.00], [49000.00], [48900.00],
        [49200.00], [49350.00], [49500.00], [49650.00], [49800.00], [50000.00],
        [50200.00], [50350.00], [50500.00], [50700.00], [50600.00], [50900.00],
        [51050.00], [51200.00], [51400.00], [51550.00], [51700.00], [52000.00],
        [52150.00], [52300.00], [52500.00], [52650.00], [52800.00], [52700.00],
        [53000.00], [53200.00], [53350.00], [53500.00], [53700.00], [54000.00]
    ], columns=['Total_Expenses'])
    
    # Create time series with dates
    dates = pd.date_range(end='2024-03-01', periods=len(data), freq='MS')
    series = pd.Series(data['Total_Expenses'].values, index=dates)
    
    # Train ARIMA model
    model = ARIMA(series, order=(1, 1, 1))
    fitted_model = model.fit()
    
    # Save model and parameters
    with open('arima_model.pkl', 'wb') as f:
        pickle.dump(fitted_model, f)
    
    with open('arima_params.pkl', 'wb') as f:
        pickle.dump({'order': (1, 1, 1)}, f)
    
    print("ARIMA model trained and saved successfully!")

if __name__ == "__main__":
    train_arima_model() 