from os import urandom
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from dependencies import get_db, get_current_user
from models import User, UserSession
from auth import get_password_hash, verify_password, create_access_token
from schemas import RegisterRequest, RegisterResponse, LoginRequest, LoginResponse, UserResponse

router = APIRouter(redirect_slashes=True)


@router.post("/register", response_model=RegisterResponse)
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


@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.login == request.login).first()
    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid login or password"
        )

    token = create_access_token(data={"sub": str(user.id)})

    session = UserSession(
        user_id=user.id,
        device="DESKTOP-" + urandom(4).hex().upper(),
        start_time=datetime.now()
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


@router.get("/user", response_model=UserResponse)
async def get_user(current_user: User = Depends(get_current_user)):
    return UserResponse(
        username=current_user.login,
        signup_date=current_user.created_at.strftime("%d-%m-%Y"),
        totp_enabled=bool(current_user.totp_secret)
    )
