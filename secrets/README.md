# Структура файлов docker secrets   

- `secrets/db_password.txt` - Пароль суперпользователя PostgreSQL
- `secrets/jwt_key.txt` - Ключ для подписи JWT сервером  

# Рекомендации и генерация

## Требования безопасности
- Пароль суперпользователя PostgreSQL должен состоять минимум из 32 символов с обязательным использованием цифр и специальных символов
- Ключ для подписи JWT сервером должен состоять минимум из 64 случайных байтов

## Генерация секретов
```bash
openssl rand -base64 32 > secrets/db_password.txt
openssl rand -base64 64 > secrets/jwt_key.txt
```
