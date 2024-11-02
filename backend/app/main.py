import time
from contextlib import asynccontextmanager

import app.core.model as wm
from app.core.process_data import DataProcessor
from app.utils.paths import Paths
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse

manager = wm.ModelManager()

@asynccontextmanager
async def lifespan(app: FastAPI):
	# Startup
	DataProcessor.guarantee_data()
	manager.guarantee()
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

@app.get('/')
async def root():
	'''Displays a message when viewing the root of the website.'''
	return { 'Result': {
		'Evaluate model': {
			'Type': 'GET',
			'Path': Paths.api_path + '/models/{type}/evaluate',
			'Description': 'Evaluate the chosen weather model.'
		},
		'Prediction with model test': {
			'Type': 'GET',
			'Path': Paths.api_path + '/models/{type}/predict-test',
			'Description': 'A test prediction for validation.'
		},
		'Get dataset': {
			'Type': 'GET',
			'Path': Paths.api_path + '/data',
			'Description': 'Return the entire processed dataset.'
		},
		'Predict with model': {
			'Type': 'POST',
			'Path': Paths.api_path + '/models/{type}/predict',
			'Description': 'Request a result from a chosen weather model.'
		},
		'Process dataset': {
			'Type': 'PUT',
			'Path': Paths.api_path + '/data/process',
			'Description': 'Process the data to be used with the model.'
		},
		'Train model': {
			'Type': 'PUT',
			'Path': Paths.api_path + '/models/{type}/train',
			'Description': 'Manually train the chosen weather model.'
		},
		'Delete dataset': {
			'Type': 'DELETE',
			'Path': Paths.api_path + '/data/delete',
			'Description': 'Delete the processed data.'
		},
		'Delete model': {
			'Type': 'DELETE',
			'Path': Paths.api_path + '/models/{type}/delete',
			'Description': 'Delete the chosen weather model.'
		},
		'Delete dataset and models': {
			'Type': 'DELETE',
			'Path': Paths.api_path + '/delete_all',
			'Description': 'Delete the processed dataset and all model types.'
		}
	} }

@app.get(Paths.api_path + '/models/{_type}/evaluate')
async def model_evaluate(_type: wm.ModelType):
	'''Evaluate the chosen weather model.

	A model will be trained if it does not exist yet.
	'''
	return { 'Result': manager.oftype(_type).evaluate() }

@app.get(Paths.api_path + '/models/{_type}/predict-test')
async def model_predict_test(_type: wm.ModelType):
	'''A test prediction for validation.

	A model will be trained if it does not exist yet.
	'''
	try:
		return { 'Result' : manager.oftype(_type).predict(wm.PrerequisitData.test_data()) }
	except Exception as e:
		raise HTTPException(status_code=500, detail='Internal server error')

@app.get(Paths.api_path + '/data')
async def get_dataset():
	'''Return the entire processed dataset.

	This is really bad and I would like to remove this before submitting.
	A better solution would be to request a location with a date range.
	'''
	return FileResponse(Paths.processed_dataset)

@app.post(Paths.api_path + '/models/{_type}/predict')
async def model_predict(_type: wm.ModelType, _prerequisit: wm.PrerequisitData):
	'''Request a result from a chosen weather model.

	A model will be trained if it does not exist yet.
	'''
	try:
		return { 'Result' : manager.oftype(_type).predict(_prerequisit) }
	except Exception as e:
		raise HTTPException(status_code=500, detail='Internal server error')

@app.put(Paths.api_path + '/data/process')
async def data_process():
	'''Process the data to be used with the model.

	Used for troubleshooting.
	'''
	DataProcessor.process_data()
	return { 'Result': 'Finished' }

@app.put(Paths.api_path + '/models/{_type}/train')
async def model_train(_type: wm.ModelType):
	'''Manually train the chosen weather model.

	Used for troubleshooting.
	'''
	manager.oftype(_type).train()
	return { 'Result': 'Success' }

@app.delete(Paths.api_path + '/data/delete')
async def processed_dataset_delete():
	'''Delete the processed data.

	Used for troubleshooting.
	'''
	return { 'Result': DataProcessor.remove_processed_data() }

@app.delete(Paths.api_path + '/models/{_type}/delete')
async def model_delete(_type: wm.ModelType):
	'''Delete the chosen weather model.

	Used for troubleshooting.
	'''
	return { 'Result': manager.delete(_type) }

@app.delete(Paths.api_path + '/delete_all')
async def delete_all():
	'''Delete the processed dataset and all model types.

	Used for troubleshooting.
	'''
	return { 'Result' : {
		'Dataset' : DataProcessor.remove_processed_data(),
		'Linear' : manager.delete(wm.ModelType.Linear),
		'Ridge' : manager.delete(wm.ModelType.Ridge),
		'Lasso' : manager.delete(wm.ModelType.Lasso),
	} }
