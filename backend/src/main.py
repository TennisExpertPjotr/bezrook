from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from logging import basicConfig, INFO

from routes import sessions, totp, user


# Configure basic logging
basicConfig(
    level=INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

# Initialise application
app = FastAPI()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(user.router, prefix='/api', tags=['Users'])
app.include_router(sessions.router, prefix='/api/sessions', tags=['Sessions'])
app.include_router(totp.router, prefix='/api/totp', tags=['TOTP'])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, )
