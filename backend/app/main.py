import time
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.utils.paths import Paths
from app.utils.location import Location
from app.core.process_data import DataProcessor
from app.core.model import WeatherModel, PrerequisitData

@asynccontextmanager
async def lifespan(app: FastAPI):
	# Startup
	DataProcessor.guarantee_data()
	WeatherModel.train(WeatherModel.ModelType.Linear)
	WeatherModel.train(WeatherModel.ModelType.Ridge)
	WeatherModel.train(WeatherModel.ModelType.Lasso)
	yield
	# Shutdown

app = FastAPI(lifespan=lifespan)

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

@app.get(Paths.api_path + '/models/{_type}/evaluate')
async def model_evaluate(_type: WeatherModel.ModelType):
	'''Evaluate the chosen weather model.'''
	return WeatherModel.evaluate(_type)

@app.get(Paths.api_path + '/models/{_type}/predict-test')
async def model_predict_test(_type: WeatherModel.ModelType):
	'''A test prediction for validation.'''
	try:
		result = WeatherModel.predict(_type, PrerequisitData.test_data())
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

@app.post(Paths.api_path + '/models/{_type}/predict')
async def model_predict(_type: WeatherModel.ModelType, prerequisit: PrerequisitData):
	'''Request a result from a chosen weather model.
	A model will be trained if it does not exist yet.
	'''
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

@app.put(Paths.api_path + '/data/process')
async def data_process():
	'''Process the data to be used with the model.
	Only needed for troubleshooting.
	'''
	DataProcessor.process_data()
	return { 'Result': 'Finished' }

@app.put(Paths.api_path + '/models/{_type}/train')
async def model_train(_type: WeatherModel.ModelType):
	'''Manually train the chosen weather model.
	Used for troubleshooting.
	'''
	WeatherModel.train(_type)
	return { 'Result': 'Success' }

@app.delete(Paths.api_path + '/data/remove')
async def data_remove():
	'''Remove the processed data.
	Used for troubleshooting.
	'''
	return { 'Result': DataProcessor.remove_processed_data() }

@app.delete(Paths.api_path + '/models/{_type}/remove')
async def model_remove(_type: WeatherModel.ModelType):
	'''Remove the chosen weather model.
	Used for troubleshooting.
	'''
	return { 'Result': WeatherModel.remove(_type) }

@app.delete(Paths.api_path + '/remove_all')
async def remove_all():
	'''Remove the processed dataset and all model types.
	Used for troubleshooting.
	'''
	return { 'Result' : {
		'Dataset' : DataProcessor.remove_processed_data(),
		'Linear' : WeatherModel.remove(WeatherModel.ModelType.Linear),
		'Ridge' : WeatherModel.remove(WeatherModel.ModelType.Ridge),
		'Lasso' : WeatherModel.remove(WeatherModel.ModelType.Lasso),
	} }
