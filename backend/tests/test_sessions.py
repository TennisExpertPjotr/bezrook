# backend/tests/test_sessions.py
from src.models import User, UserSession


def test_get_sessions_unauthorized(client):
    response = client.get("/api/sessions")
    assert response.status_code == 401


def test_session_creation_on_login(client, auth_headers):
    response = client.get("/api/sessions", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data["sessions"]) == 1


def test_get_sessions_with_data(client, db, user_with_sessions, auth_headers):
    response = client.get("/api/sessions", headers=auth_headers)
    assert response.status_code == 200
    sessions = response.json()["sessions"]

    assert len(sessions) == 3  # 1 при логине + 2 в фикстуре
    assert all(
        "id" in s and "device" in s and "start_time" in s and "is_current" in s
        for s in sessions
    )
    # Последняя — текущая
    assert sessions[-1]["is_current"] is True
    assert all(not s["is_current"] for s in sessions[:-1])


def test_terminate_session_success(client, db, registered_user, auth_headers):
    user, _ = registered_user
    # Создаём дополнительную сессию
    extra_session = UserSession(user_id=user.id, device="EXTRA")
    db.add(extra_session)
    db.commit()
    session_id = extra_session.id

    # Удаляем
    response = client.delete(f"/api/sessions/{session_id}", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["message"] == "Session terminated"

    # Проверяем удаление
    assert db.query(UserSession).filter(UserSession.id == session_id).first() is None


def test_terminate_session_not_found(client, auth_headers):
    response = client.delete("/api/sessions/999999", headers=auth_headers)
    assert response.status_code == 404
    assert response.json()["detail"] == "Session not found"


def test_terminate_session_other_user_forbidden(client, db, auth_headers):
    # Создаём второго пользователя и его сессию
    other_user = User(login="other", password_hash="fake_hash")
    db.add(other_user)
    db.commit()
    other_session = UserSession(user_id=other_user.id, device="OTHER")
    db.add(other_session)
    db.commit()
    other_id = other_session.id

    # Пытаемся удалить чужую сессию
    response = client.delete(f"/api/sessions/{other_id}", headers=auth_headers)
    assert response.status_code == 404
    assert response.json()["detail"] == "Session not found"
