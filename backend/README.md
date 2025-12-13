# Bezrook Backend

FastAPI бэкенд для системы аутентификации с TOTP.

## API Endpoints

- `POST /api/register` - Регистрация пользователя
- `POST /api/login` - Вход в систему
- `GET /api/user` - Получить данные текущего пользователя
- `POST /api/totp/setup` - Настроить TOTP
- `POST /api/totp/verify` - Проверить TOTP код
- `GET /api/sessions` - Получить список сессий
- `DELETE /api/sessions/{session_id}` - Завершить сессию

