from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import os
from dotenv import load_dotenv

from database import SessionLocal, engine, Base
from models import User, UserSession
from auth import get_password_hash, verify_password, create_access_token, verify_token
from totp_utils import generate_totp_secret, verify_totp_code, generate_qr_code

load_dotenv()

Base.metadata.create_all(bind=engine)

app = FastAPI()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()


# Pydantic models
class RegisterRequest(BaseModel):
    login: str
    password: str


class RegisterResponse(BaseModel):
    message: str


class LoginRequest(BaseModel):
    login: str
    password: str


class LoginResponse(BaseModel):
    token: str
    message: str


class TOTPSetupResponse(BaseModel):
    secret: str
    qr_code: str


class TOTPVerifyRequest(BaseModel):
    code: str


class TOTPVerifyResponse(BaseModel):
    success: bool
    message: str


class UserResponse(BaseModel):
    username: str
    signup_date: str


class SessionResponse(BaseModel):
    id: int
    device: str
    start_time: str
    is_current: bool


class SessionsResponse(BaseModel):
    sessions: list[SessionResponse]


# Dependency для получения DB сессии
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Dependency для получения текущего пользователя
def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    token = credentials.credentials
    payload = verify_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )
    
    user = db.query(User).filter(User.id == payload.get("sub")).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    return user


@app.post("/api/register", response_model=RegisterResponse)
async def register(request: RegisterRequest, db: Session = Depends(get_db)):
    # Проверяем, существует ли пользователь
    existing_user = db.query(User).filter(User.login == request.login).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this login already exists"
        )
    
    # Создаем нового пользователя
    hashed_password = get_password_hash(request.password)
    new_user = User(login=request.login, password_hash=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return RegisterResponse(message="user создан")


@app.post("/api/login", response_model=LoginResponse)
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.login == request.login).first()
    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid login or password"
        )
    
    # Создаем токен
    token = create_access_token(data={"sub": user.id})
    
    # Создаем сессию
    import datetime
    session = UserSession(
        user_id=user.id,
        device="DESKTOP-" + os.urandom(4).hex().upper(),
        start_time=datetime.datetime.now()
    )
    db.add(session)
    db.commit()
    
    # Если у пользователя включен TOTP, возвращаем флаг
    if user.totp_secret:
        return LoginResponse(
            token=token,
            message="TOTP required"
        )
    
    return LoginResponse(token=token, message="Login successful")


@app.get("/api/user", response_model=UserResponse)
async def get_user(current_user: User = Depends(get_current_user)):
    return UserResponse(
        username=current_user.login,
        signup_date=current_user.created_at.strftime("%d-%m-%Y")
    )


@app.post("/api/totp/setup", response_model=TOTPSetupResponse)
async def setup_totp(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    secret = generate_totp_secret()
    qr_code = generate_qr_code(current_user.login, secret)
    
    # Сохраняем секрет в БД
    current_user.totp_secret = secret
    db.commit()
    
    return TOTPSetupResponse(secret=secret, qr_code=qr_code)


@app.post("/api/totp/verify", response_model=TOTPVerifyResponse)
async def verify_totp(
    request: TOTPVerifyRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.totp_secret:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="TOTP not set up for this user"
        )
    
    is_valid = verify_totp_code(current_user.totp_secret, request.code)
    
    if is_valid:
        return TOTPVerifyResponse(success=True, message="TOTP code verified")
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid TOTP code"
        )


@app.get("/api/sessions", response_model=SessionsResponse)
async def get_sessions(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    sessions = db.query(UserSession).filter(UserSession.user_id == current_user.id).all()
    
    session_list = []
    for session in sessions:
        session_list.append(SessionResponse(
            id=session.id,
            device=session.device,
            start_time=session.start_time.strftime("%H:%M %d-%m-%Y"),
            is_current=session.id == sessions[-1].id if sessions else False
        ))
    
    return SessionsResponse(sessions=session_list)


@app.delete("/api/sessions/{session_id}")
async def terminate_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(UserSession).filter(
        UserSession.id == session_id,
        UserSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    db.delete(session)
    db.commit()
    
    return {"message": "Session terminated"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

