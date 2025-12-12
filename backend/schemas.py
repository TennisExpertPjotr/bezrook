from pydantic import BaseModel


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
    totp_enabled: bool


class SessionResponse(BaseModel):
    id: int
    device: str
    start_time: str
    is_current: bool


class SessionsResponse(BaseModel):
    sessions: list[SessionResponse]
