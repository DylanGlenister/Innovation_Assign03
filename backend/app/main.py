import time
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from app.utils.paths import Paths
from app.core.location import Location
from app.core.process_data import DataProcessor
from app.core.model import LinearWeatherModel, RidgeWeatherModel

app = FastAPI()

@app.middleware("http")
async def log_requests(request: Request, call_next):
	'''Log HTTP requests into the console.'''
	start_time = time.time()
	response = await call_next(request)
	process_time = time.time() - start_time
	print(f"Request: {request.url} - Duration: {process_time} seconds")
	return response

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
	'''Handle HTTP exceptions.'''
	return JSONResponse(
		status_code=exc.status_code,
		content={"detail": exc.detail, "error": "An error occurred"}
	)

# I would like this to list all the avaiable api endpoints.
@app.get("/")
async def root():
	'''Displays a message when viewing the root of the website.'''
	return { "message": "Hello world" }

@app.get(Paths.api_path + "/test/number/{num}/{message}")
async def show_number_message(num: int, message: str):
	'''For testing; responds with the number and message.'''
	return { "number": num, "message": message }

@app.get(Paths.api_path + "/test/query")
async def show_query_params(bool: bool, integer: int = 0, string: str = ""):
	return { "bool": bool, "integer": integer, "string": string }

@app.get(Paths.api_path + "/process")
async def process_data():
	processor = DataProcessor()
	processor.process_data()
	return { "State": "Finished" }

@app.get(Paths.api_path + "/models/train")
async def train_both_models():
	linear_model = LinearWeatherModel()
	linear_model.train()
	linear_model.evaluate()
	linear_model.save()
	ridge_model = RidgeWeatherModel()
	ridge_model.train()
	ridge_model.evaluate()
	ridge_model.save()
	return { "State": "Finished" }

@app.get(Paths.api_path + "/models/linear/train")
async def linear_train():
	linear_model = LinearWeatherModel()
	linear_model.train()
	linear_model.evaluate()
	linear_model.save()
	return { "State": "Finished" }

@app.get(Paths.api_path + "/models/ridge/train")
async def ridge_train():
	ridge_model = RidgeWeatherModel()
	ridge_model.train()
	ridge_model.evaluate()
	ridge_model.save()
	return { "State": "Finished" }

@app.get(Paths.api_path + "/models/linear/predict")
async def linear_predict():
	linear_model = LinearWeatherModel()
	linear_model.predict()
