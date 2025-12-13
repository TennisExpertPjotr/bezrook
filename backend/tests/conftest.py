# backend/tests/conftest.py
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from src.main import app, sessions, user
from src.models import Base, User, UserSession
from src.auth import get_password_hash


# Тестовый движок (session scope)
@pytest.fixture(scope="session")
def test_engine():
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)


# Транзакционная БД-сессия (function scope)
@pytest.fixture
def db(test_engine):
    connection = test_engine.connect()
    transaction = connection.begin()
    session = sessionmaker(bind=connection)()

    yield session

    session.close()
    transaction.rollback()
    connection.close()


# TestClient с подменой зависимостей
@pytest.fixture
def client(db):
    def override_get_db():
        yield db

    app.dependency_overrides[sessions.get_db] = override_get_db
    app.dependency_overrides[user.get_db]
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


# Зарегистрированный пользователь ===
@pytest.fixture
def registered_user(db):
    login = "testuser"
    password = "password123"
    hashed = get_password_hash(password)
    user = User(login=login, password_hash=hashed)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user, password


# Заголовки авторизации
@pytest.fixture
def auth_headers(client, registered_user):
    user, password = registered_user
    login_resp = client.post("/api/login", json={"login": user.login, "password": password})
    assert login_resp.status_code == 200
    token = login_resp.json()["token"]
    return {"Authorization": f"Bearer {token}"}


# Пользователь с несколькими сессиями
@pytest.fixture
def user_with_sessions(db, registered_user):
    user, _ = registered_user
    # Добавляем 2 дополнительные сессии
    for i in range(2):
        session = UserSession(
            user_id=user.id,
            device=f"DEVICE-{i}",
        )
        db.add(session)
    db.commit()
    return user
