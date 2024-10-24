import pandas as pd
import numpy as np
import joblib
import warnings
from enum import Enum
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression, Ridge
from sklearn.metrics import mean_squared_error, r2_score
from pydantic import BaseModel, Field
# Cannot be run standalone because of these imports
from app.utils.paths import Paths
#from app.utils.model_settings import Model_Settings

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

# TODO Eventually I would like the number of days to be dynamic, based on Model_Settings.block_size
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
		return np.array([[
			15.6,27.8,0.2,48.0,4.0,7.0,73.0,98.0,1011.7052631578947,1009.5322368421052,0.0,0.0,22.7,20.1,4362,2011,12,8,
			16.4,20.1,13.6,31.0,9.0,7.0,99.0,94.0,1011.7021052631579,1009.5278947368421,0.0,0.0,16.7,19.1,4363,2011,12,8,
			16.3,24.6,1.8,30.0,15.0,4.0,75.0,51.0,1011.698947368421,1009.5235526315789,0.0,0.0,17.9,23.7,4364,2011,12,8,
			13.2,23.8,2.0,26.0,11.0,11.0,65.0,50.0,1011.6957894736843,1009.5192105263159,0.0,0.0,18.5,21.7,4365,2011,12,8,
			15.3,24.3,0.0,24.0,2.0,4.0,64.0,47.0,1011.6926315789474,1009.5148684210527,0.0,0.0,18.5,23.6,4366,2011,12,8,
			11.9,22.4,0.0,28.0,9.0,6.0,67.0,60.0,1011.6894736842105,1009.5105263157895,0.0,0.0,19.6,21.4,4367,2011,12,8,
			14.8,25.3,0.0,22.0,2.0,9.0,74.0,47.0,1011.6863157894737,1009.5061842105264,0.0,0.0,18.3,23.6,4368,2011,12,8,
			13.5,25.1,0.0,26.0,4.0,9.0,85.0,48.0,1011.6831578947368,1009.5018421052632,0.0,0.0,17.4,24.3,4369,2011,12,8,
			17.3,24.9,0.8,31.0,4.0,4.0,98.0,76.0,1011.6800000000001,1009.4975000000001,0.0,0.0,18.6,24.8,4370,2011,12,8,
			16.7,25.0,28.4,20.0,13.0,6.0,80.0,61.0,1011.6768421052632,1009.4931578947369,0.0,0.0,20.4,23.5,4371,2011,12,8,
			17.5,25.4,0.0,22.0,2.0,7.0,80.0,63.0,1011.6736842105263,1009.4888157894737,0.0,0.0,20.1,22.8,4372,2011,12,8,
			17.5,23.3,0.6,15.0,11.0,7.0,98.0,84.0,1011.6705263157895,1009.4844736842106,0.0,0.0,18.1,22.3,4373,2011,12,8,
			17.7,27.8,6.8,30.0,4.0,17.0,99.0,67.0,1011.6673684210526,1009.4801315789474,0.0,0.0,19.6,26.9,4374,2011,12,8,
		]])

class WeatherModel():
	class ModelType(str, Enum):
		Linear = 'linear',
		Ridge = 'ridge'

	#def __init__(_self):
	#	np.set_printoptions(threshold=np.inf) # type: ignore

	@staticmethod
	def divide_group(_group: pd.DataFrame):
		'''Private method. Split up the group into features and a target.'''
		features = _group.iloc[:-1]  # First rows as features
		target = _group.iloc[-1:]     # Last row as the target
		return features, target

	@staticmethod
	def split_into_features_and_target(_df: pd.DataFrame):
		'''Split a dataframe with groups into features and targets lists.'''
		features_list = []
		targets_list = []

		for _, group in _df.groupby(['Location', 'Block'], sort=False):
			features, target = WeatherModel.divide_group(group)
			features_list.append(features.values.flatten())  # Flatten the features into one row
			targets_list.append(target.values[0])  # Single target value

		# Convert lists to arrays for scikit-learn
		features = np.array(features_list)
		targets = np.array(targets_list)
		return features, targets

	@staticmethod
	def import_and_split_data():
		# Pandas complains that I'm not using dtype parameter but doing so causes a stack overflow
		with warnings.catch_warnings(action='ignore'):
			imported_data = pd.read_csv(
				Paths.processed_dataset,
				index_col=[0, 1, 2],
				memory_map=True
			)

		X, Y = WeatherModel.split_into_features_and_target(imported_data)
		#print('\nImported data:')
		#print(f'X has {X.shape[0]} samples, Y has {Y.shape[0]} samples.')

		X_train, X_test, Y_train, Y_test = train_test_split(X, Y, test_size=0.2, random_state=42)
		#print(f'Training set size: {X_train.shape[0]} samples')
		#print(f'Test set size: {X_test.shape[0]} samples')
		return X_train, X_test, Y_train, Y_test

	@staticmethod
	def train(_type: ModelType) -> bool:
		match _type:
			case WeatherModel.ModelType.Linear:
				model: LinearRegression | Ridge = LinearRegression()
			case WeatherModel.ModelType.Ridge:
				model = Ridge()
			case _:
				return False

		X_train, X_test, Y_train, Y_test = WeatherModel.import_and_split_data()
		model.fit(X_train, Y_train)
		joblib.dump(model, Paths.linear_model)
		return True

	@staticmethod
	def evaluate(_type: ModelType):
		match _type:
			case WeatherModel.ModelType.Linear:
				model: LinearRegression | Ridge = joblib.load(Paths.linear_model)
			case WeatherModel.ModelType.Ridge:
				model = joblib.load(Paths.ridge_model)
			case _:
				return False

		X_train, X_test, Y_train, Y_test = WeatherModel.import_and_split_data()
		y_pred = model.predict(X_test)
		#print(f'Mean Squared Error: {mean_squared_error(Y_test, y_pred):.2f}')
		#print(f'R^2 Score: {r2_score(Y_test, y_pred):.2f}')
		return {
			'Mean Squared Error': f'{mean_squared_error(Y_test, y_pred):.2f}',
			'R^2 Score': f'{r2_score(Y_test, y_pred):.2f}'
		}

	@staticmethod
	def predict(_type: ModelType, pre: PrerequisitData):
		match _type:
			case WeatherModel.ModelType.Linear:
				model: LinearRegression | Ridge = joblib.load(Paths.linear_model)
			case WeatherModel.ModelType.Ridge:
				model = joblib.load(Paths.ridge_model)
			case _:
				return False

		return model.predict(pre.tolist()).tolist()[0]
