from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from schemas import SessionsResponse, SessionResponse
from dependencies import get_db, get_current_user
from models import User, UserSession


router = APIRouter(redirect_slashes=True)


@router.get("", response_model=SessionsResponse)
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


@router.delete("/{session_id}")
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
