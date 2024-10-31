import pandas as pd
import numpy as np
import joblib
import warnings
from os import remove
from pathlib import Path
from enum import Enum
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression, Ridge, Lasso
from sklearn.metrics import mean_squared_error, r2_score
from pydantic import BaseModel, Field
# Cannot be run standalone because of these imports
from app.utils.paths import Paths
from app.core.process_data import DataProcessor

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

class DayData(BaseModel):
	MinTemp: float = Field(13, ge=-70, le=70, description='The minimum temperature for the day (C)')
	MaxTemp: float = Field(23, ge=-70, le=70, description='The maximum temperature for the day (C).')
	Rainfall: float = Field(0, ge=0, description='How much rain fell in the day (mm).')
	WindGustSpeed: float = Field(39, ge=0, description='The maximum gust speed (km/h).')
	WindSpeed9am: float = Field(17, ge=0, description='The rolling average wind speed at 9am (km/h).')
	WindSpeed3pm: float = Field(19, ge=0, description='The rolling average wind speed at 3pm (km/h).')
	Humidity9am: float = Field(70, ge=0, le=100, description='The air humidity at 9am (%).')
	Humidity3pm: float = Field(51, ge=0, le=100, description='The air humidity at 3pm (%).')
	Pressure9am: float = Field(1018, gt=900, lt=1200, description='The air pressure at 9am (millibars).')
	Pressure3pm: float = Field(1015, gt=900, lt=1200, description='The air pressure at 3pm (millibars).')
	Cloud9am: float = Field(1, ge=0, le=9, description='A rating of the amount of cloud cover at 9am (0-9).')
	Cloud3pm: float = Field(1, ge=0, le=9, description='A rating of the amount of cloud cover at 3pm (0-9).')
	Temp9am: float = Field(27, ge=-70, le=70, description='The temperature at 9am (C).')
	Temp3pm: float = Field(22, ge=-70, le=70, description='The temperature at 3pm (C).')
	DayIndex: int = Field(5000, gt=0, description='The number of days since 01/01/2000.')
	Year: int = Field(2010, gt=2000, description='What year it is.')
	Month: int = Field(..., ge=1, le=12, description='What month it is a a number (1-12).')
	LocationHash: int = Field(..., description='A hardcoded value for each location:\n<todo>.')

	def tolist(_self):
		return [_self.MinTemp, _self.MaxTemp, _self.Rainfall, _self.WindGustSpeed, _self.WindSpeed9am, _self.WindSpeed3pm, _self.Humidity9am, _self.Humidity3pm, _self.Pressure9am, _self.Pressure3pm, _self.Cloud9am, _self.Cloud3pm, _self.Temp9am, _self.Temp3pm, _self.DayIndex, _self.Year, _self.Month, _self.LocationHash]

class PrerequisitData(BaseModel):
	Day0: DayData = Field(..., description='A day of weather data.')
	Day1: DayData = Field(..., description='A day of weather data.')
	Day2: DayData = Field(..., description='A day of weather data.')
	Day3: DayData = Field(..., description='A day of weather data.')
	Day4: DayData = Field(..., description='A day of weather data.')
	Day5: DayData = Field(..., description='A day of weather data.')
	Day6: DayData = Field(..., description='A day of weather data.')
	Day7: DayData = Field(..., description='A day of weather data.')
	Day8: DayData = Field(..., description='A day of weather data.')
	Day9: DayData = Field(..., description='A day of weather data.')
	Day10: DayData = Field(..., description='A day of weather data.')
	Day11: DayData = Field(..., description='A day of weather data.')
	Day12: DayData = Field(..., description='A day of weather data.')

	def tolist(_self):
		return np.array([np.array([
			_self.Day0.tolist(),
			_self.Day1.tolist(),
			_self.Day2.tolist(),
			_self.Day3.tolist(),
			_self.Day4.tolist(),
			_self.Day5.tolist(),
			_self.Day6.tolist(),
			_self.Day7.tolist(),
			_self.Day8.tolist(),
			_self.Day9.tolist(),
			_self.Day10.tolist(),
			_self.Day11.tolist(),
			_self.Day12.tolist()
		]).flatten()])

	@staticmethod
	def test_data():
		return PrerequisitData(
			Day0=DayData(
				MinTemp=15.6,
				MaxTemp=27.8,
				Rainfall=0.2,
				WindGustSpeed=48.0,
				WindSpeed9am=4.0,
				WindSpeed3pm=7.0,
				Humidity9am=73.0,
				Humidity3pm=98.0,
				Pressure9am=1011.7052631578947,
				Pressure3pm=1009.5322368421052,
				Cloud9am=0.0,
				Cloud3pm=0.0,
				Temp9am=22.7,
				Temp3pm=20.1,
				DayIndex=4362,
				Year=2011,
				Month=12,
				LocationHash=8
			),
			Day1=DayData(
				MinTemp=16.4,
				MaxTemp=20.1,
				Rainfall=13.6,
				WindGustSpeed=31.0,
				WindSpeed9am=9.0,
				WindSpeed3pm=7.0,
				Humidity9am=99.0,
				Humidity3pm=94.0,
				Pressure9am=1011.7021052631579,
				Pressure3pm=1009.5278947368421,
				Cloud9am=0.0,
				Cloud3pm=0.0,
				Temp9am=16.7,
				Temp3pm=19.1,
				DayIndex=4363,
				Year=2011,
				Month=12,
				LocationHash=8
			),
			Day2=DayData(
				MinTemp=16.3,
				MaxTemp=24.6,
				Rainfall=1.8,
				WindGustSpeed=30.0,
				WindSpeed9am=15.0,
				WindSpeed3pm=4.0,
				Humidity9am=75.0,
				Humidity3pm=51.0,
				Pressure9am=1011.698947368421,
				Pressure3pm=1009.5235526315789,
				Cloud9am=0.0,
				Cloud3pm=0.0,
				Temp9am=17.9,
				Temp3pm=23.7,
				DayIndex=4364,
				Year=2011,
				Month=12,
				LocationHash=8
			),
			Day3=DayData(
				MinTemp=13.2,
				MaxTemp=23.8,
				Rainfall=2.0,
				WindGustSpeed=26.1,
				WindSpeed9am=11.0,
				WindSpeed3pm=11.0,
				Humidity9am=65.0,
				Humidity3pm=50.0,
				Pressure9am=1011.6957894736843,
				Pressure3pm=1009.5192105263159,
				Cloud9am=0.0,
				Cloud3pm=0.0,
				Temp9am=18.5,
				Temp3pm=21.7,
				DayIndex=4365,
				Year=2011,
				Month=12,
				LocationHash=8
			),
			Day4=DayData(
				MinTemp=15.3,
				MaxTemp=24.3,
				Rainfall=0.0,
				WindGustSpeed=24.0,
				WindSpeed9am=2.0,
				WindSpeed3pm=4.0,
				Humidity9am=34.0,
				Humidity3pm=47.0,
				Pressure9am=1011.6926315789474,
				Pressure3pm=1009.5148684210527,
				Cloud9am=0.0,
				Cloud3pm=0.0,
				Temp9am=18.5,
				Temp3pm=23.6,
				DayIndex=4366,
				Year=2011,
				Month=12,
				LocationHash=8
			),
			Day5=DayData(
				MinTemp=11.9,
				MaxTemp=22.4,
				Rainfall=0.0,
				WindGustSpeed=28.0,
				WindSpeed9am=9.0,
				WindSpeed3pm=6.0,
				Humidity9am=67.0,
				Humidity3pm=60.0,
				Pressure9am=1011.6894736842105,
				Pressure3pm=1009.5105263157895,
				Cloud9am=0.0,
				Cloud3pm=0.0,
				Temp9am=19.6,
				Temp3pm=21.4,
				DayIndex=4367,
				Year=2011,
				Month=12,
				LocationHash=8
			),
			Day6=DayData(
				MinTemp=14.8,
				MaxTemp=25.3,
				Rainfall=0.0,
				WindGustSpeed=22.0,
				WindSpeed9am=2.0,
				WindSpeed3pm=9.0,
				Humidity9am=74.0,
				Humidity3pm=47.0,
				Pressure9am=1011.6863157894737,
				Pressure3pm=1009.5061842105264,
				Cloud9am=0.0,
				Cloud3pm=0.0,
				Temp9am=18.3,
				Temp3pm=23.6,
				DayIndex=4368,
				Year=2011,
				Month=12,
				LocationHash=8
			),
			Day7=DayData(
				MinTemp=13.5,
				MaxTemp=25.1,
				Rainfall=0.0,
				WindGustSpeed=26.0,
				WindSpeed9am=4.0,
				WindSpeed3pm=9.0,
				Humidity9am=85.0,
				Humidity3pm=48.0,
				Pressure9am=1011.6831578947368,
				Pressure3pm=1009.5018421052632,
				Cloud9am=0.0,
				Cloud3pm=0.0,
				Temp9am=17.4,
				Temp3pm=24.3,
				DayIndex=4369,
				Year=2011,
				Month=12,
				LocationHash=8
			),
			Day8=DayData(
				MinTemp=17.3,
				MaxTemp=24.9,
				Rainfall=0.8,
				WindGustSpeed=31.0,
				WindSpeed9am=4.0,
				WindSpeed3pm=4.0,
				Humidity9am=98.0,
				Humidity3pm=76.0,
				Pressure9am=1011.6800000000001,
				Pressure3pm=1009.4975000000001,
				Cloud9am=0.0,
				Cloud3pm=0.0,
				Temp9am=18.6,
				Temp3pm=24.8,
				DayIndex=4370,
				Year=2011,
				Month=12,
				LocationHash=8
			),
			Day9=DayData(
				MinTemp=16.7,
				MaxTemp=25.0,
				Rainfall=28.4,
				WindGustSpeed=20.0,
				WindSpeed9am=13.0,
				WindSpeed3pm=6.0,
				Humidity9am=80.0,
				Humidity3pm=61.0,
				Pressure9am=1011.6768421052632,
				Pressure3pm=1009.4931578947369,
				Cloud9am=0.0,
				Cloud3pm=0.0,
				Temp9am=20.4,
				Temp3pm=23.5,
				DayIndex=4371,
				Year=2011,
				Month=12,
				LocationHash=8
			),
			Day10=DayData(
				MinTemp=17.5,
				MaxTemp=25.4,
				Rainfall=0.0,
				WindGustSpeed=22.0,
				WindSpeed9am=2.0,
				WindSpeed3pm=7.0,
				Humidity9am=80.0,
				Humidity3pm=63.0,
				Pressure9am=1011.6736842105263,
				Pressure3pm=1009.4888157894737,
				Cloud9am=0.0,
				Cloud3pm=0.0,
				Temp9am=20.1,
				Temp3pm=22.8,
				DayIndex=4372,
				Year=2011,
				Month=12,
				LocationHash=8
			),
			Day11=DayData(
				MinTemp=17.5,
				MaxTemp=23.3,
				Rainfall=0.6,
				WindGustSpeed=15.0,
				WindSpeed9am=11.0,
				WindSpeed3pm=7.0,
				Humidity9am=98.0,
				Humidity3pm=84.0,
				Pressure9am=1011.6705263157895,
				Pressure3pm=1009.4844736842106,
				Cloud9am=0.0,
				Cloud3pm=0.0,
				Temp9am=18.1,
				Temp3pm=22.3,
				DayIndex=4373,
				Year=2011,
				Month=12,
				LocationHash=8
			),
			Day12=DayData(
				MinTemp=17.7,
				MaxTemp=27.8,
				Rainfall=6.8,
				WindGustSpeed=30.0,
				WindSpeed9am=4.0,
				WindSpeed3pm=17.0,
				Humidity9am=99.0,
				Humidity3pm=67.0,
				Pressure9am=1011.6673684210526,
				Pressure3pm=1009.4801315789474,
				Cloud9am=0.0,
				Cloud3pm=0.0,
				Temp9am=19.6,
				Temp3pm=26.9,
				DayIndex=4374,
				Year=2011,
				Month=12,
				LocationHash=8
			)
		)

class ModelType(str, Enum):
	Linear = 'linear',
	Ridge = 'ridge',
	Lasso = 'lasso'

class ModelManager():
	class __Underlying():
		def __init__(_self, _type: ModelType):
			'''Initial creation of the object.'''
			_self.model: LinearRegression | Ridge | Lasso
			_self.type = _type

		def guarantee(_self):
			'''Will either load a model from file or create and train a new one.'''
			if not Path(ModelManager.select_model_path(_self.type)).is_file():
				print(f'{_self.type} not found.')
				_self.train()
			else:
				print(f'{_self.type} found.')
				_self.model = joblib.load(
					ModelManager.select_model_path(_self.type)
				)

		def train(_self):
			'''Import the dataset and train the model.

			The model will be saved.
			'''
			_self.model = ModelManager.create_model(_self.type)
			print(f'Training {_self.type} model.')
			X_train, X_test, Y_train, Y_test = ModelManager.import_and_split_data()
			_self.model.fit(X_train, Y_train)
			joblib.dump(
				_self.model,
				ModelManager.select_model_path(_self.type)
			)

		def evaluate(_self):
			'''Evaluate the performance of the model.'''
			print(f'Evaluating {_self.type} model.')
			_self.guarantee()
			X_train, X_test, Y_train, Y_test = ModelManager.import_and_split_data()
			y_pred = _self.model.predict(X_test)
			return {
				'Mean Squared Error': f'{mean_squared_error(Y_test, y_pred):.2f}',
				'R^2 Score': f'{r2_score(Y_test, y_pred):.2f}'
			}

		def predict(_self, _pre: PrerequisitData):
			print(f'Predicting with {_self.type} model.')
			_self.guarantee()
			return _self.model.predict(_pre.tolist()).tolist()[0]

	@staticmethod
	def __divide_group(_group: pd.DataFrame):
		'''Private method. Split up the group into features and a target.'''
		features = _group.iloc[:-1]  # First rows as features
		target = _group.iloc[-1:]     # Last row as the target
		return features, target

	@staticmethod
	def __split_into_features_and_target(_df: pd.DataFrame):
		'''Split a dataframe with groups into features and targets lists.'''
		features_list = []
		targets_list = []

		for _, group in _df.groupby(['Location', 'Block'], sort=False):
			features, target = ModelManager.__divide_group(group)
			features_list.append(features.values.flatten())  # Flatten the features into one row
			targets_list.append(target.values[0])  # Single target value

		# Convert lists to arrays for scikit-learn
		features = np.array(features_list)
		targets = np.array(targets_list)
		return features, targets

	@staticmethod
	def import_and_split_data():
		# If the processed dataset doesn't exist, make it
		if not Path(Paths.processed_dataset).is_file():
			print('Processed dataset not found.')
			DataProcessor.process_data()

		# Pandas complains that I'm not using dtype parameter but doing so causes a stack overflow
		with warnings.catch_warnings(action='ignore'):
			imported_data = pd.read_csv(
				Paths.processed_dataset,
				index_col=[0, 1, 2],
				memory_map=True
			)

		imported_data.drop(columns=['Day'], inplace=True)

		X, Y = ModelManager.__split_into_features_and_target(imported_data)
		X_train, X_test, Y_train, Y_test = train_test_split(X, Y, test_size=0.2, random_state=42)
		return X_train, X_test, Y_train, Y_test

	@staticmethod
	def create_model(_type: ModelType):
		match _type:
			case ModelType.Linear:
				return LinearRegression()
			case ModelType.Ridge:
				return Ridge()
			case ModelType.Lasso:
				return Lasso()

	@staticmethod
	def select_model_path(_type: ModelType):
		match _type:
			case ModelType.Linear:
				return Paths.linear_model
			case ModelType.Ridge:
				return Paths.ridge_model
			case ModelType.Lasso:
				return Paths.lasso_model

	@staticmethod
	def delete(_type: ModelType):
		print(f'Removing {_type} model.')
		try:
			remove(ModelManager.select_model_path(_type))
			return { 'Result' : 'Model deleted' }
		except:
			return { 'Result' : 'No model found' }

	def __init__(_self):
		_self.__linear = ModelManager.__Underlying(ModelType.Linear)
		_self.__ridge = ModelManager.__Underlying(ModelType.Ridge)
		_self.__lasso = ModelManager.__Underlying(ModelType.Lasso)

	def guarantee(_self):
		_self.__linear.guarantee()
		_self.__ridge.guarantee()
		_self.__lasso.guarantee()

	def oftype(_self, _type: ModelType):
		match _type:
			case ModelType.Linear:
				return _self.__linear
			case ModelType.Ridge:
				return _self.__ridge
			case ModelType.Lasso:
				return _self.__lasso
