import time
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.utils.paths import Paths
from app.utils.location import Location
from app.core.process_data import DataProcessor
from app.core.model import WeatherModel, PrerequisitData

app = FastAPI()

# Add CORS middleware, required for frontend connection to work
app.add_middleware(
	CORSMiddleware,
	allow_origins=["http://localhost:3000"], # URL of React application
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)

@app.middleware('http')
async def log_requests(request: Request, call_next):
	'''Log HTTP requests into the console.'''
	start_time = time.time()
	response = await call_next(request)
	process_time = time.time() - start_time
	print(f'Request: {request.url} - Duration: {process_time} seconds')
	return response

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
	'''Handle HTTP exceptions.'''
	return JSONResponse(
		status_code=exc.status_code,
		content={'Detail': exc.detail, 'Error': 'An error occurred'}
	)

# I would like this to list all the avaiable api endpoints.
@app.get('/')
async def root():
	'''Displays a message when viewing the root of the website.'''
	return { 'Message': 'Hello world' }

@app.get(Paths.api_path + '/data/process')
async def data_process():
	'''Process the data to be used with the model. Will only need to be done once.'''
	DataProcessor.process_data()
	return { 'Result': 'Finished' }

@app.get(Paths.api_path + '/data/remove')
async def data_remove():
	'''Remove the processed data, used for troubleshooting.'''
	return { 'Result': DataProcessor.remove_processed_data() }

@app.get(Paths.api_path + '/models/{_type}/train')
async def model_train(_type: WeatherModel.ModelType):
	WeatherModel.train(_type)
	return { 'Result': 'Success' }

@app.get(Paths.api_path + '/models/{_type}/evaluate')
async def model_evaluate(_type: WeatherModel.ModelType):
	return WeatherModel.evaluate(_type)

@app.post(Paths.api_path + '/models/{_type}/predict')
def model_predict(_type: WeatherModel.ModelType, prerequisit: PrerequisitData):
	try:
		result = WeatherModel.predict(_type, prerequisit)
		return { 'Result' : {

			'MinTemp': result[0],
			'MaxTemp': result[1],
			'Rainfall': result[2],
			'WindGustSpeed': result[3],
			'WindSpeed9am': result[4],
			'WindSpeed3pm': result[5],
			'Humidity9am': result[6],
			'Humidity3pm': result[7],
			'Pressure9am': result[8],
			'Pressure3pm': result[9],
			'Cloud9am': result[10],
			'Cloud3pm': result[11],
			'Temp9am': result[12],
			'Temp3pm': result[13],
			'DayIndex': result[14],
			'Year': result[15],
			'Month': result[16],
			'LocationHash': result[17],
		} }
	except Exception as e:
		raise HTTPException(status_code=500, detail='Internal server error')

@app.post(Paths.api_path + '/models/{_type}/predict-test-data')
async def model_predict_test(_type: WeatherModel.ModelType):
	return model_predict(_type, PrerequisitData.test_data())

@app.get(Paths.api_path + '/models/{_type}/remove')
async def model_remove(_type: WeatherModel.ModelType):
	return { 'Result': WeatherModel.remove(_type) }

@app.get(Paths.api_path + '/clean_all')
async def clean_all():
	return { 'Result' : {
		'Dataset' : DataProcessor.remove_processed_data(),
		'Linear' : WeatherModel.remove(WeatherModel.ModelType.Linear),
		'Ridge' : WeatherModel.remove(WeatherModel.ModelType.Ridge),
		'Lasso' : WeatherModel.remove(WeatherModel.ModelType.Lasso),
	} }

@app.get(Paths.api_path + '/test/number/{_num}/{_message}')
async def show_number_message(_num: int, _message: str):
	'''For testing; responds with the number and message.'''
	return { 'Number': _num, 'Message': _message }

@app.get(Paths.api_path + '/test/query')
async def show_query_params(bool: bool, integer: int = 0, string: str = ''):
	return { 'Bool': bool, 'Integer': integer, 'String': string }
