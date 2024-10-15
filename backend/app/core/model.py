import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression, Ridge
from sklearn.metrics import mean_squared_error, r2_score
from utils.paths import Paths

class WeatherPredictionModel():
	def __init__(self):
		self.data_imported = False
		return

	def __divide_group(self, _group: pd.DataFrame):
		'''Private method. Split up the group into features and a target.'''
		features = _group.iloc[:-1]  # First rows as features
		target = _group.iloc[-1]     # Last row as the target
		return features, target

	def __gpt_split_into_features_and_target(self, _df: pd.DataFrame):
		'''Split a dataframe with groups into features and targets lists.'''
		features_list = []
		targets_list = []

		for _, group in _df.groupby(['Location', 'Block'], sort=False):
			features, target = WeatherPredictionModel.__divide_group(self, group)
			features_list.append(features.values.flatten())  # Flatten the features into one row
			targets_list.append(target.values[0])  # Single target value

		# Convert lists to arrays for scikit-learn
		features = np.array(features_list)
		targets = np.array(targets_list)
		return features, targets

	def __import_and_split_data(self):
		imported_data = pd.read_csv(Paths.processed_dataset, index_col=[0, 1, 2])
		X, Y = WeatherPredictionModel.__gpt_split_into_features_and_target(self, imported_data)
		print("Imported data:")
		print(f'X has {X.shape[0]} samples, Y has {Y.shape[0]} samples.')

		self.X_train, self.X_test, self.Y_train, self.Y_test = train_test_split(X, Y, test_size=0.2, random_state=42)
		print(f"Training set size: {self.X_train.shape[0]} samples")
		print(f"Test set size: {self.X_test.shape[0]} samples\n")

		self.data_imported = True

	def train_linear(self):
		if (not self.data_imported):
			WeatherPredictionModel.__import_and_split_data(self, )

		self.model_linear = LinearRegression()
		self.model_linear.fit(self.X_train, self.Y_train)

	def train_ridge(self):
		if (not self.data_imported):
			WeatherPredictionModel.__import_and_split_data(self)

		self.model_ridge = Ridge()
		self.model_ridge.fit(self.X_train, self.Y_train)

	def evaluate_linear(self):
		linear_y_pred = self.model_linear.predict(self.X_test)
		print('Linear Regression Evaluation:')
		print(f'Mean Squared Error: {mean_squared_error(self.Y_test, linear_y_pred):.2f}')
		print(f'R^2 Score: {r2_score(self.Y_test, linear_y_pred):.2f}\n')

	def evaluate_ridge(self):
		ridge_y_pred = self.model_ridge.predict(self.X_test)
		print('Ridge Regression Evaluation:')
		print(f'Mean Squared Error: {mean_squared_error(self.Y_test, ridge_y_pred):.2f}')
		print(f'R^2 Score: {r2_score(self.Y_test, ridge_y_pred):.2f}\n')

	def save_linear(self):
		joblib.dump(self.model_linear, Paths.linear_model)

	def save_ridge(self):
		joblib.dump(self.model_ridge, Paths.ridge_model)

if __name__ == "__main__":
	model = WeatherPredictionModel()
	model.train_linear()
	model.evaluate_linear()
	model.save_linear()
	model.train_ridge()
	model.evaluate_ridge()
	model.save_ridge()
