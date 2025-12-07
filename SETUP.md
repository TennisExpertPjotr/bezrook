# Инструкция по установке и запуску

## Предварительные требования

- Python 3.8+
- Node.js 16+
- PostgreSQL 12+

## Шаг 1: Настройка базы данных

1. Установите PostgreSQL, если еще не установлен
2. Создайте базу данных:
```sql
CREATE DATABASE bezrook;
```

3. Запомните параметры подключения (хост, порт, пользователь, пароль)

## Шаг 2: Настройка бэкенда

1. Перейдите в папку `backend`:
```bash
cd backend
```

2. Создайте виртуальное окружение:
```bash
python -m venv venv
```

3. Активируйте виртуальное окружение:
```bash
# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

4. Установите зависимости:
```bash
pip install -r requirements.txt
```

5. Создайте файл `.env` в папке `backend`:
```bash
# Windows
copy .env.example .env

# Linux/Mac
cp .env.example .env
```

6. Отредактируйте `.env` и укажите параметры подключения к БД:
```
DATABASE_URL=postgresql://username:password@localhost:5432/bezrook
SECRET_KEY=your-secret-key-change-this-in-production-min-32-chars
```

7. Запустите сервер:
```bash
uvicorn main:app --reload
```

Бэкенд будет доступен по адресу http://localhost:8000

## Шаг 3: Настройка фронтенда

1. Откройте новый терминал и перейдите в папку `frontend`:
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

## Проверка работы

1. Откройте браузер и перейдите на http://localhost:3000
2. Зарегистрируйте нового пользователя
3. Войдите в систему
4. В личном кабинете нажмите "Включить TOTP 2FA"
5. Отсканируйте QR-код в приложении Google Authenticator
6. Введите код из приложения для подтверждения

## Решение проблем

### Ошибка подключения к БД
- Проверьте, что PostgreSQL запущен
- Проверьте правильность параметров в `.env`
- Убедитесь, что база данных `bezrook` создана

### Ошибка CORS
- Убедитесь, что фронтенд запущен на порту 3000
- Проверьте настройки CORS в `backend/main.py`

### Ошибка при установке зависимостей
- Убедитесь, что используете правильную версию Python (3.8+)
- Для Windows может потребоваться установка Visual C++ Build Tools для некоторых пакетов

