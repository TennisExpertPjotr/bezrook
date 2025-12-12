from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from totp_utils import generate_totp_secret, verify_totp_code, generate_qr_code
from schemas import TOTPSetupResponse, TOTPVerifyRequest, TOTPVerifyResponse
from dependencies import get_db, get_current_user
from models import User, PendingTotp


router = APIRouter(redirect_slashes=False)


@router.post("/setup", response_model=TOTPSetupResponse)
async def setup_totp(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.totp_secret:
        raise HTTPException(status_code=400, detail="TOTP уже включён")

    secret = generate_totp_secret()

    # Удаляем старую pending-запись, если есть
    existing = db.query(PendingTotp).filter(PendingTotp.user_id == current_user.id).first()
    if existing:
        db.delete(existing)
        db.commit()

    # Сохраняем в pending
    pending = PendingTotp(
        user_id=current_user.id,
        pending_totp_secret=secret
    )
    db.add(pending)
    db.commit()

    qr_code = generate_qr_code(current_user.login, secret)

    return TOTPSetupResponse(secret=secret, qr_code=qr_code)


@router.post("/setup/verify", response_model=TOTPVerifyResponse)
async def confirm_totp_setup(
    request: TOTPVerifyRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.totp_secret:
        raise HTTPException(status_code=400, detail="TOTP уже включён")

    pending = db.query(PendingTotp).filter(PendingTotp.user_id == current_user.id).first()

    if not pending:
        raise HTTPException(status_code=400, detail="Нет активной настройки TOTP. Начните сначала.")

    # Проверка срока действия (10 минут)
    if datetime.utcnow() - pending.created_at > timedelta(minutes=10):
        db.delete(pending)
        db.commit()
        raise HTTPException(status_code=400, detail="Время настройки истекло. Начните заново.")

    if not verify_totp_code(pending.pending_totp_secret, request.code):
        raise HTTPException(status_code=400, detail="Неверный TOTP-код")

    current_user.totp_secret = pending.pending_totp_secret
    db.delete(pending)
    db.commit()

    return TOTPVerifyResponse(success=True, message="TOTP успешно включён")


@router.post("/verify", response_model=TOTPVerifyResponse)
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
