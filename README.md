# Bezrook - Система аутентификации с TOTP

Полнофункциональная система аутентификации с поддержкой двухфакторной аутентификации через TOTP (Google Authenticator).

## Структура проекта

- `frontend/` - React приложение (Vite)
- `backend/` - FastAPI бэкенд

## Быстрый старт

### 1. Настройка базы данных PostgreSQL

Создайте базу данных:
```sql
CREATE DATABASE bezrook;
```

### 2. Настройка бэкенда

1. Перейдите в папку `backend`:
```bash
cd backend
```

2. Создайте виртуальное окружение:
```bash
python -m venv venv
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate
```

3. Установите зависимости:
```bash
pip install -r requirements.txt
```

4. Создайте файл `.env`:
```bash
cp .env.example .env
```

5. Отредактируйте `.env` и укажите параметры подключения к БД:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/bezrook
SECRET_KEY=your-secret-key-change-this-in-production
```

6. Запустите сервер:
```bash
uvicorn main:app --reload
```

Бэкенд будет доступен по адресу http://localhost:8000

### 3. Настройка фронтенда

1. Перейдите в папку `frontend`:
```bash
cd frontend
```

2. Установите зависимости:
```bash
npm install
```

3. Запустите dev сервер:
```bash
npm run dev
```

Фронтенд будет доступен по адресу http://localhost:3000

## Функциональность

### Регистрация
- Валидация пароля (минимум 10 символов, заглавные/строчные буквы, цифры, спецсимволы)
- Проверка совпадения паролей
- Хеширование паролей с помощью bcrypt

### Вход
- Аутентификация по логину и паролю
- JWT токены для сессий
- Автоматическое перенаправление на TOTP, если включена 2FA

### TOTP (Google Authenticator)
- Генерация секретного ключа
- QR-код для сканирования в Google Authenticator
- Верификация 6-значных кодов
- Поддержка вставки кода из буфера обмена

### Личный кабинет
- Просмотр информации о пользователе
- Управление сессиями
- Настройка TOTP 2FA

## API Endpoints

- `POST /api/register` - Регистрация пользователя
- `POST /api/login` - Вход в систему
- `GET /api/user` - Получить данные текущего пользователя (требует авторизации)
- `POST /api/totp/setup` - Настроить TOTP (требует авторизации)
- `POST /api/totp/verify` - Проверить TOTP код (требует авторизации)
- `GET /api/sessions` - Получить список сессий (требует авторизации)
- `DELETE /api/sessions/{session_id}` - Завершить сессию (требует авторизации)

## Технологии

### Frontend
- React 18
- React Router
- Vite
- Axios

### Backend
- FastAPI
- SQLAlchemy (ORM)
- PostgreSQL
- PyJWT (JWT токены)
- Passlib (хеширование паролей)
- PyOTP (TOTP)
- QRCode (генерация QR-кодов)

## Примечания

- Все пароли хешируются с помощью bcrypt
- JWT токены действительны 30 дней
- TOTP коды действительны в течение 30 секунд (с учетом небольшой погрешности)
- CORS настроен для работы с фронтендом на localhost:3000

