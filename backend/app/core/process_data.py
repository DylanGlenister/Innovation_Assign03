import pandas as pd
from datetime import datetime, date

class DataProcessor:
	def process_data(self):
		block_size = 14

		raw_data = pd.read_csv('./app/models/weatherAUS.csv')
		# Remove columns that either has a large amount of missing data or are not suitable for machine learning
		raw_data.drop(columns=['Sunshine', 'Evaporation', 'WindGustDir', 'WindDir9am', 'WindDir3pm', 'RainToday', 'RainTomorrow'], inplace=True)

		# Fill missing data
		data_filled = raw_data.copy()
		data_filled.fillna({'MinTemp': data_filled['MinTemp'].interpolate()}, inplace=True)
		data_filled.fillna({'MaxTemp': data_filled['MaxTemp'].interpolate()}, inplace=True)
		data_filled.fillna({'Temp9am': data_filled['Temp9am'].interpolate()}, inplace=True)
		data_filled.fillna({'Temp3pm': data_filled['Temp3pm'].interpolate()}, inplace=True)
		data_filled.fillna({'Rainfall': data_filled['Rainfall'].interpolate()}, inplace=True)
		data_filled.fillna({'WindGustSpeed': data_filled['WindGustSpeed'].interpolate()}, inplace=True)
		data_filled.fillna({'WindSpeed9am': data_filled['WindSpeed9am'].interpolate()}, inplace=True)
		data_filled.fillna({'WindSpeed3pm': data_filled['WindSpeed3pm'].interpolate()}, inplace=True)
		data_filled.fillna({'Humidity9am': data_filled['Humidity9am'].interpolate()}, inplace=True)
		data_filled.fillna({'Humidity3pm': data_filled['Humidity3pm'].interpolate()}, inplace=True)
		data_filled.fillna({'Pressure9am': data_filled['Pressure9am'].interpolate()}, inplace=True)
		data_filled.fillna({'Pressure3pm': data_filled['Pressure3pm'].interpolate()}, inplace=True)
		# Cloud9am and Cloud3pm have too many missing values to properly interpolate, assume NaN means no cloud cover
		data_filled.fillna({'Cloud9am': 0}, inplace=True)
		data_filled.fillna({'Cloud3pm': 0}, inplace=True)

		def to_iso_date(_date: str) -> str:
			'''Converts the date from dd-mm-yyyy to yyyy-mm-dd'''
			return datetime.strptime(_date, '%d-%m-%Y').strftime("%Y-%m-%d")

		def convert_date_to_day_index(_date: str):
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

		redated = data_filled.copy()
		redated['Date'] = redated['Date'].apply(to_iso_date)
		redated['DayIndex'] = redated['Date'].apply(convert_date_to_day_index)
		# TODO May need to remove year to prevent overfitting
		redated['Year'] = redated['Date'].apply(extract_year)
		redated['Month'] = redated['Date'].apply(extract_month)
		# Don't include the day to make it harder for the model to overfit
		#redated['Day'] = redated['Date'].apply(extract_day)
		# Remove the date as well for the same reason
		redated.drop(columns=['Date'], inplace=True)

		def hash_location(_location: str) -> int:
			'''Converts the string into bytes then reencodes it to an int.'''
			return int.from_bytes(_location.encode(), 'big')

		hashed = redated.copy()
		hashed['LocationHash'] = hashed['Location'].apply(hash_location)

		def reconfigure(_df: pd.DataFrame, _block_size=5):
			'''Splits the rows into blocks up to a max size defined by block_size. Blocks are per location. Uses Location, Date, Block, and Id as the labels for a multiIndex DataFrame.'''
			# Lists to store block and id number
			block = []
			id = []

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

		reconfigured = reconfigure(hashed, block_size)

		def purge(_df: pd.DataFrame) -> pd.DataFrame:
			'''Purge blocks with less than 10 elements in them.'''
			# Count rows in each block
			block_sizes = _df.groupby(['Location', 'Block'], sort=False).size()

			# Identify unfit blocks (those with less than block_size)
			# Pylance mistakes this for an error
			unfit = block_sizes[block_sizes < block_size].index.to_list() # type: ignore

			# Boolean indexing to drop multiple combinations
			df_filtered = _df[~(
				_df.index.get_level_values('Location').isin([x[0] for x in unfit])
				& _df.index.get_level_values('Block').isin([x[1] for x in unfit])
			)]

			return df_filtered

		purged = purge(reconfigured)
		purged.to_csv('./app/models/weatherAUS_processed.csv')
