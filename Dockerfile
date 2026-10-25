FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app/src

RUN pip install --no-cache-dir poetry

COPY pyproject.toml poetry.lock README.md ./
COPY src ./src

RUN poetry config virtualenvs.create false && poetry install --only main --no-interaction --no-ansi

EXPOSE 8000

CMD ["sh", "-c", "uvicorn catalyst_backend.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
