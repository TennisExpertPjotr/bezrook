# Bezrook Backend

FastAPI бэкенд для системы аутентификации с TOTP.

## Установка

1. Создайте виртуальное окружение:
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# или
venv\Scripts\activate  # Windows
```

2. Установите зависимости:
```bash
pip install -r requirements.txt
```

3. Создайте файл `.env` на основе `.env.example`:
```bash
cp .env.example .env
```

4. Настройте PostgreSQL и создайте базу данных:
```sql
CREATE DATABASE bezrook;
```

5. Запустите сервер:
```bash
uvicorn main:app --reload
```

Сервер будет доступен по адресу http://localhost:8000

## API Endpoints

- `POST /api/register` - Регистрация пользователя
- `POST /api/login` - Вход в систему
- `GET /api/user` - Получить данные текущего пользователя
- `POST /api/totp/setup` - Настроить TOTP
- `POST /api/totp/verify` - Проверить TOTP код
- `GET /api/sessions` - Получить список сессий
- `DELETE /api/sessions/{session_id}` - Завершить сессию

