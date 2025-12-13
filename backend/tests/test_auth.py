# backend/tests/test_auth.py

def test_register_new_user(client):
    response = client.post("/api/register", json={"login": "alice", "password": "secret123"})
    assert response.status_code == 200
    assert response.json()["message"] == "user создан"


def test_register_duplicate_login(client):
    # Первый раз — успех
    client.post("/api/register", json={"login": "bob", "password": "pass"})
    # Второй — ошибка
    response = client.post("/api/register", json={"login": "bob", "password": "pass"})
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]


def test_login_success(client, registered_user):
    user, password = registered_user
    response = client.post("/api/login", json={"login": user.login, "password": password})
    assert response.status_code == 200
    data = response.json()
    assert "token" in data
    assert data["message"] in ("Login successful", "TOTP required")


def test_login_wrong_password(client, registered_user):
    user, _ = registered_user
    response = client.post("/api/login", json={"login": user.login, "password": "wrong"})
    assert response.status_code == 401
    assert "Invalid login or password" in response.json()["detail"]


def test_get_user_unauthorized(client):
    response = client.get("/api/user")
    assert response.status_code == 401


def test_get_user_authorized(client, auth_headers):
    response = client.get("/api/user", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "testuser"
    assert "signup_date" in data
    assert isinstance(data["totp_enabled"], bool)
