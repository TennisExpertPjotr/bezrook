FROM python:3

WORKDIR /usr/app

COPY requirements.txt ./

RUN pip install --no-cache-dir -r requirements.txt

COPY src/ src/
COPY alembic.ini ./
COPY alembic/ alembic/

CMD ["sh", "-c", "alembic upgrade head && exec python src/main.py"]