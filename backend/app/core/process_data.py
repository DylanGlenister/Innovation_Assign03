import pandas as pd
from os import remove
from pathlib import Path
from datetime import datetime, date
from app.utils.paths import Paths
from app.utils.location import Location

class DataProcessor:
	block_size = 13

	@staticmethod
	def process_data():
		print(f'Processing data.')
		data = pd.read_csv(Paths.raw_dataset)
		# Remove columns that either has a large amount of missing data or are not suitable for machine learning
		data.drop(columns=['Sunshine', 'Evaporation', 'WindGustDir', 'WindDir9am', 'WindDir3pm', 'RainToday', 'RainTomorrow'], inplace=True)

		# Fill missing data
		data.fillna({'MinTemp': data['MinTemp'].interpolate()}, inplace=True)
		data.fillna({'MaxTemp': data['MaxTemp'].interpolate()}, inplace=True)
		data.fillna({'Temp9am': data['Temp9am'].interpolate()}, inplace=True)
		data.fillna({'Temp3pm': data['Temp3pm'].interpolate()}, inplace=True)
		data.fillna({'Rainfall': data['Rainfall'].interpolate()}, inplace=True)
		data.fillna({'WindGustSpeed': data['WindGustSpeed'].interpolate()}, inplace=True)
		data.fillna({'WindSpeed9am': data['WindSpeed9am'].interpolate()}, inplace=True)
		data.fillna({'WindSpeed3pm': data['WindSpeed3pm'].interpolate()}, inplace=True)
		data.fillna({'Humidity9am': data['Humidity9am'].interpolate()}, inplace=True)
		data.fillna({'Humidity3pm': data['Humidity3pm'].interpolate()}, inplace=True)
		data.fillna({'Pressure9am': data['Pressure9am'].interpolate()}, inplace=True)
		data.fillna({'Pressure3pm': data['Pressure3pm'].interpolate()}, inplace=True)
		# Cloud9am and Cloud3pm have too many missing values to properly interpolate, assume NaN means no cloud cover
		data.fillna({'Cloud9am': 0}, inplace=True)
		data.fillna({'Cloud3pm': 0}, inplace=True)

		def to_iso_date(_date: str) -> str:
			'''Converts the date from dd-mm-yyyy to yyyy-mm-dd'''
			return datetime.strptime(_date, '%d-%m-%Y').strftime("%Y-%m-%d")

		def convert_date_to_day_index(_date: str) -> int:
			'''Converts the date into the number of days since 2000-01-01'''
			delta = datetime.strptime(_date, '%Y-%m-%d').date() - date(2000, 1, 1)
			return delta.days

		def extract_year(_date: str) -> int:
			'''Returns the year component of the date'''
			return datetime.strptime(_date, '%Y-%m-%d').year

		def extract_month(_date: str) -> int:
			'''Returns the month component of the date'''
			return datetime.strptime(_date, '%Y-%m-%d').month

		def extract_day(_date: str) -> int:
			'''Returns the day component of the date'''
			return datetime.strptime(_date, '%Y-%m-%d').day

		data['Date'] = data['Date'].apply(to_iso_date)
		# DayIndex is needed for reconfiguration, to validate sequenciality.
		data['DayIndex'] = data['Date'].apply(convert_date_to_day_index)
		# TODO May need to remove year to prevent overfitting
		data['Year'] = data['Date'].apply(extract_year)
		data['Month'] = data['Date'].apply(extract_month)
		# Don't include the day to make it harder for the model to overfit
		data['Day'] = data['Date'].apply(extract_day)
		# Remove the date as well for the same reason
		data.drop(columns=['Date'], inplace=True)

		data['LocationHash'] = data['Location'].apply(Location.switch_loc)

		def reconfigure(_df: pd.DataFrame, _block_size=5):
			'''Splits the rows into blocks up to a max size defined by Model_Settings.block_size. Blocks are per location. Uses Location, Date, Block, and Id as the labels for a multiIndex DataFrame.'''
			# Lists to store block and id number
			block = []
			id = []
			# Block sizes needs to be incremented once before use
			_block_size += 1

			# Goes through every location
			for _, group in _df.groupby('Location', sort=False):
				block_num = 0
				id_num = 0
				prev = group['DayIndex'].iloc[0]

				# Iterate over the DayIndex column
				for _, index_num in group['DayIndex'].items():
					# Check if a new block should be started
					if id_num == _block_size or (index_num != prev + 1):
						block_num += 1
						id_num = 0  # Reset ID within the block

					# Append the block number and ID within block to the lists
					block.append(block_num)
					id.append(id_num)

					# Update variables for the next iteration
					id_num += 1
					prev = index_num

			# Create the multiIndex
			index = pd.MultiIndex.from_arrays(
				[_df['Location'], block, id],
				names=['Location', 'Block', 'Id']
			)

			# Removed unneeded columns and apply the multiIndex
			stripped = _df.drop(columns=['Location'])
			stripped.set_index(index, inplace=True)
			return stripped

		data = reconfigure(data, DataProcessor.block_size)

		def purge(_df: pd.DataFrame) -> pd.DataFrame:
			'''Purge blocks with less than 10 elements in them.'''
			# Count rows in each block
			block_sizes = _df.groupby(['Location', 'Block'], sort=False).size()

			# Identify unfit blocks (those with less than Model_Settings.block_size)
			# Pylance mistakes this for an error
			unfit = block_sizes[block_sizes < DataProcessor.block_size].index.to_list() # type: ignore

			# Boolean indexing to drop multiple combinations
			df_filtered = _df[~(
				_df.index.get_level_values('Location').isin([x[0] for x in unfit])
				& _df.index.get_level_values('Block').isin([x[1] for x in unfit])
			)]

			return df_filtered

		data = purge(data)
		# TODO Try to minimise the MSE
		#data.drop(columns=['DayIndex'], inplace=True)
		data.to_csv(Paths.processed_dataset)

	@staticmethod
	def remove_processed_data():
		print(f'Removing processed data.')
		try:
			remove(Paths.processed_dataset)
			return { 'Result' : 'Dataset deleted' }
		except:
			return { 'Result' : 'No dataset found' }

	@staticmethod
	def guarantee_data():
		'''Will only process data if the result file does not exists.

		Does not validate the quality of the file.
		'''
		if not Path(Paths.processed_dataset).is_file():
			print('Processed dataset file not found.')
			DataProcessor.process_data()
