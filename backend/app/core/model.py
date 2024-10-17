import pandas as pd
import numpy as np
import joblib
import warnings
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression, Ridge
from sklearn.metrics import mean_squared_error, r2_score
# Cannot be run standalone because of these imports
from app.utils.paths import Paths
from app.utils.model_settings import Model_Settings

class BaseWeatherModel():
	def __init__(self):
		self.data_imported = False
		return

	def divide_group(self, _group: pd.DataFrame):
		'''Private method. Split up the group into features and a target.'''
		features = _group.iloc[:-1]  # First rows as features
		target = _group.iloc[-1:]     # Last row as the target
		return features, target

	def gpt_split_into_features_and_target(self, _df: pd.DataFrame):
		'''Split a dataframe with groups into features and targets lists.'''
		features_list = []
		targets_list = []

		for _, group in _df.groupby(['Location', 'Block'], sort=False):
			features, target = BaseWeatherModel.divide_group(self, group)
			features_list.append(features.values.flatten())  # Flatten the features into one row
			targets_list.append(target.values[0])  # Single target value

		# Convert lists to arrays for scikit-learn
		features = np.array(features_list)
		targets = np.array(targets_list)
		return features, targets

	def import_and_split_data(self):
		# Pandas complains that I'm not using dtype parameter but doing so causes a stack overflow
		with warnings.catch_warnings(action="ignore"):
			# TODO stop pandas importing the location hash as a string
			imported_data = pd.read_csv(
				Paths.processed_dataset,
				index_col=[0, 1, 2],
				memory_map=True
			)
			'''dtype={
				"Location": str,
				"Block": int,
				"Id": int,
				"MinTemp": float,
				"MaxTemp": float,
				"Rainfall": float,
				"WindGustSpeed": float,
				"WindSpeed9am": float,
				"WindSpeed3pm": float,
				"Humidity9am": float,
				"Humidity3pm": float,
				"Pressure9am": float,
				"Pressure3pm": float,
				"Cloud9am": float,
				"Cloud3pm": float,
				"Temp9am": float,
				"Temp3pm": float,
				"DayIndex": int,
				"Year": int,
				"Month": int,
				"LocationHash": int
			}'''

		X, Y = BaseWeatherModel.gpt_split_into_features_and_target(self, imported_data)
		print("\nImported data:")
		print(f'X has {X.shape[0]} samples, Y has {Y.shape[0]} samples.')

		self.X_train, self.X_test, self.Y_train, self.Y_test = train_test_split(X, Y, test_size=0.2, random_state=42)
		print(f"Training set size: {self.X_train.shape[0]} samples")
		print(f"Test set size: {self.X_test.shape[0]} samples")

		self.data_imported = True

class LinearWeatherModel(BaseWeatherModel):
	def train(self):
		if (not self.data_imported):
			BaseWeatherModel.import_and_split_data(self)

		self.model_linear = LinearRegression()
		self.model_linear.fit(self.X_train, self.Y_train)

	def evaluate(self):
		linear_y_pred = self.model_linear.predict(self.X_test)
		print('\nLinear Regression Evaluation:')
		print(f'Mean Squared Error: {mean_squared_error(self.Y_test, linear_y_pred):.2f}')
		print(f'R^2 Score: {r2_score(self.Y_test, linear_y_pred):.2f}')
		np.set_printoptions(threshold=np.inf) # type: ignore
		with open('./app/models/Y_pred.txt', 'w') as f:
			f.write(np.array2string(linear_y_pred, separator=', '))

	def dump_test(self):
		np.set_printoptions(threshold=np.inf) # type: ignore
		with open('./app/models/X_train.txt', 'w') as f:
			f.write(np.array2string(self.X_train, separator=', '))
		with open('./app/models/Y_train.txt', 'w') as f:
			f.write(np.array2string(self.Y_train, separator=', '))
		with open('./app/models/X_test.txt', 'w') as f:
			f.write(np.array2string(self.X_test, separator=', '))
		with open('./app/models/Y_test.txt', 'w') as f:
			f.write(np.array2string(self.Y_test, separator=', '))

	def save(self):
		joblib.dump(self.model_linear, Paths.linear_model)

	def predict(self):
		self.model_linear: LinearRegression = joblib.load(Paths.linear_model)
		data = np.array([[15.6, 27.8, 0.2, 48.0, 4.0, 7.0, 73.0, 98.0, 1011.7052631578948, 1009.5322368421052, 0.0, 0.0, 22.7, 20.1, 4362, 2011, 12, 22629523177174120, 16.4, 20.1, 13.6, 31.0, 9.0, 7.0, 99.0, 94.0, 1011.702105263158, 1009.527894736842, 0.0, 0.0, 16.7, 19.1, 4363, 2011, 12, 22629523177174120, 16.3, 24.6, 1.8, 30.0, 15.0, 4.0, 75.0, 51.0, 1011.698947368421, 1009.5235526315788, 0.0, 0.0, 17.9, 23.7, 4364, 2011, 12, 22629523177174120, 13.2, 23.8, 2.0, 26.0, 11.0, 11.0, 65.0, 50.0, 1011.6957894736844, 1009.519210526316, 0.0, 0.0, 18.5, 21.7, 4365, 2011, 12, 22629523177174120, 15.3, 24.3, 0.0, 24.0, 2.0, 4.0, 64.0, 47.0, 1011.6926315789474, 1009.5148684210528, 0.0, 0.0, 18.5, 23.6, 4366, 2011, 12, 22629523177174120, 11.9, 22.4, 0.0, 28.0, 9.0, 6.0, 67.0, 60.0, 1011.6894736842104, 1009.5105263157895, 0.0, 0.0, 19.6, 21.4, 4367, 2011, 12, 22629523177174120, 14.8, 25.3, 0.0, 22.0, 2.0, 9.0, 74.0, 47.0, 1011.6863157894736, 1009.5061842105264, 0.0, 0.0, 18.3, 23.6, 4368, 2011, 12, 22629523177174120, 13.5, 25.1, 0.0, 26.0, 4.0, 9.0, 85.0, 48.0, 1011.6831578947368, 1009.5018421052632, 0.0, 0.0, 17.4, 24.3, 4369, 2011, 12, 22629523177174120, 17.3, 24.9, 0.8, 31.0, 4.0, 4.0, 98.0, 76.0, 1011.68, 1009.4975, 0.0, 0.0, 18.6, 24.8, 4370, 2011, 12, 22629523177174120, 16.7, 25.0, 28.4, 20.0, 13.0, 6.0, 80.0, 61.0, 1011.6768421052632, 1009.4931578947368, 0.0, 0.0, 20.4, 23.5, 4371, 2011, 12, 22629523177174120, 17.5, 25.4, 0.0, 22.0, 2.0, 7.0, 80.0, 63.0, 1011.6736842105264, 1009.4888157894736, 0.0, 0.0, 20.1, 22.8, 4372, 2011, 12, 22629523177174120, 17.5, 23.3, 0.6, 15.0, 11.0, 7.0, 98.0, 84.0, 1011.6705263157896, 1009.4844736842106, 0.0, 0.0, 18.1, 22.3, 4373, 2011, 12, 22629523177174120, 17.7, 27.8, 6.8, 30.0, 4.0, 17.0, 99.0, 67.0, 1011.6673684210526, 1009.4801315789474, 0.0, 0.0, 19.6, 26.9, 4374, 2011, 12, 22629523177174120]])
		return self.model_linear.predict(data)

class RidgeWeatherModel(BaseWeatherModel):
	def train(self):
		if (not self.data_imported):
			BaseWeatherModel.import_and_split_data(self)

		self.model_ridge = Ridge()
		self.model_ridge.fit(self.X_train, self.Y_train)

	def evaluate(self):
		ridge_y_pred = self.model_ridge.predict(self.X_test)
		print('\nRidge Regression Evaluation:')
		print(f'Mean Squared Error: {mean_squared_error(self.Y_test, ridge_y_pred):.2f}')
		print(f'R^2 Score: {r2_score(self.Y_test, ridge_y_pred):.2f}')

	def save(self):
		joblib.dump(self.model_ridge, Paths.ridge_model)
