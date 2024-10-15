import time
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from app.core.location import Location

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

@app.get("/")
async def root():
	'''Displays a message when viewing the root of the website.'''
	return { "message": "Hello world" }

@app.get("/location/{location}")
async def get_location(location: Location):
	'''Testing enums.'''
	return { "location": location }

@app.get("/test/number/{num}/{message}")
async def show_number_message(num: int, message: str):
	'''For testing; responds with the number and message.'''
	return { "number": num, "message": message }

@app.get("/test/query")
async def show_query_params(bool: bool, integer: int = 0, string: str = ""):
	return { "bool": bool, "integer": integer, "string": string }
