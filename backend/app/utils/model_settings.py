class Model_Settings:
	block_size = 13
	'''How many days worth of data will be required for the model to make an addiction.

	The training dataset should be split into block_size + 1 blocks.

	Setting this number higher than 13 causes issues for some reason.
	'''
