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
		target = _group.iloc[-1]     # Last row as the target
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

	def save(self):
		joblib.dump(self.model_linear, Paths.linear_model)

	def predict(self):
		self.model_linear = joblib.load(Paths.linear_model)

		# TODO figure out how the data needs to be presented
		fuck = [
			[16.535550935550937,21.595228215767634,3.25987525987526,31.0,0.0,13.0,62.33679833679834,55.32780082987552,1015.7758835758837,1016.5941908713693,0.0,0.0,18.937006237006237,20.12863070539419,5644,2015,6,1427707618201802272357],
			[16.52889812889813,21.580912863070537,3.2802494802494806,30.0,9.0,13.0,62.32640332640332,55.31120331950208,1015.7482328482329,1016.5767634854772,0.0,0.0,18.925987525987527,20.114522821576763,5645,2015,6,1427707618201802272357],
			[16.522245322245322,21.56659751037344,3.3006237006237007,31.0,0.0,13.0,62.316008316008315,55.29460580912863,1015.7205821205821,1016.559336099585,0.0,0.0,18.914968814968816,20.100414937759336,5646,2015,6,1427707618201802272357],
			[16.515592515592516,21.55228215767635,3.3209979209979212,41.0,22.0,24.0,62.305613305613306,55.27800829875519,1015.6929313929314,1016.5419087136929,0.0,0.0,18.903950103950102,20.08630705394191,5647,2015,6,1427707618201802272357],
			[16.50893970893971,21.537966804979252,3.3413721413721413,31.0,9.0,20.0,62.2952182952183,55.261410788381745,1015.6652806652806,1016.5244813278008,0.0,0.0,18.89293139293139,20.07219917012448,5648,2015,6,1427707618201802272357],
			[16.502286902286905,21.523651452282156,3.361746361746362,22.0,13.0,11.0,62.28482328482328,55.2448132780083,1015.63762993763,1016.5070539419087,0.0,0.0,18.88191268191268,20.058091286307054,5649,2015,6,1427707618201802272357],
			[16.495634095634095,21.509336099585063,3.3821205821205824,48.0,19.0,28.0,62.274428274428274,55.22821576763486,1015.6099792099792,1016.4896265560166,0.0,0.0,18.87089397089397,20.043983402489626,5650,2015,6,1427707618201802272357],
			[16.48898128898129,21.495020746887967,3.4024948024948025,74.0,43.0,35.0,62.264033264033266,55.211618257261414,1015.5823284823285,1016.4721991701244,0.0,0.0,18.85987525987526,20.0298755186722,5651,2015,6,1427707618201802272357],
			[16.482328482328484,21.48070539419087,3.422869022869023,76.0,28.0,41.0,62.25363825363825,55.19502074688797,1015.5546777546778,1016.4547717842323,0.0,0.0,18.84885654885655,20.01576763485477,5652,2015,6,1427707618201802272357],
			[16.475675675675678,21.466390041493774,3.4432432432432436,63.0,20.0,17.0,62.24324324324324,55.178423236514526,1015.5270270270271,1016.4373443983402,0.0,0.0,18.83783783783784,20.001659751037344,5653,2015,6,1427707618201802272357],
			[16.46902286902287,21.452074688796678,3.4636174636174637,41.0,15.0,26.0,62.232848232848234,55.16182572614108,1015.4993762993763,1016.4199170124481,0.0,0.0,18.826819126819128,19.987551867219917,5654,2015,6,1427707618201802272357],
			[16.462370062370063,21.437759336099585,3.4839916839916842,26.0,11.0,11.0,62.222453222453225,55.14522821576764,1015.4717255717256,1016.402489626556,0.0,0.0,18.815800415800414,19.97344398340249,5655,2015,6,1427707618201802272357],
			[16.455717255717257,21.42344398340249,3.504365904365905,35.0,19.0,20.0,62.21205821205821,55.128630705394194,1015.4440748440749,1016.3850622406638,0.0,0.0,18.804781704781703,19.959336099585062,5656,2015,6,1427707618201802272357],
			[16.44906444906445,21.409128630705393,3.524740124740125,24.0,13.0,9.0,62.2016632016632,55.11203319502075,1015.4164241164241,1016.3676348547717,0.0,0.0,18.793762993762993,19.945228215767635,5657,2015,6,1427707618201802272357]
		]
		huh = np.array(fuck)
		data = np.ndarray(shape=(14,18), buffer=huh)
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
